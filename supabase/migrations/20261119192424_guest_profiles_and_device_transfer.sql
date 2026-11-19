ALTER TABLE public.votes
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX votes_question_user_unique
  ON public.votes(question_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE POLICY "read own votes"
  ON public.votes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT ON public.votes TO authenticated;

CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 48),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.user_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.vote_question(
  p_question_id uuid,
  p_option_id uuid,
  p_voter_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  IF p_voter_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_voter');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.questions
    WHERE id = p_question_id
      AND status IN ('published', 'archived')
      AND (publish_at IS NULL OR publish_at <= now())
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'question_unavailable');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.options
    WHERE id = p_option_id AND question_id = p_question_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_option');
  END IF;

  INSERT INTO public.votes(question_id, option_id, voter_key, user_id)
  VALUES (p_question_id, p_option_id, p_voter_key, auth.uid())
  ON CONFLICT DO NOTHING
  RETURNING id INTO new_id;

  IF new_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
  END IF;

  RETURN jsonb_build_object('ok', true);
END
$function$;

CREATE OR REPLACE FUNCTION public.link_guest_profile(
  p_voter_key uuid,
  p_nickname text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  account_id uuid := auth.uid();
  resolved_nickname text;
  linked_count integer := 0;
BEGIN
  IF account_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'login_required');
  END IF;

  IF p_voter_key IS NULL OR nullif(trim(p_nickname), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_profile');
  END IF;

  INSERT INTO public.user_profiles(user_id, nickname)
  VALUES (account_id, left(trim(p_nickname), 48))
  ON CONFLICT (user_id) DO NOTHING;

  SELECT nickname INTO resolved_nickname
  FROM public.user_profiles
  WHERE user_id = account_id;

  DELETE FROM public.votes AS guest_vote
  USING public.votes AS account_vote
  WHERE guest_vote.voter_key = p_voter_key
    AND guest_vote.user_id IS NULL
    AND account_vote.user_id = account_id
    AND account_vote.question_id = guest_vote.question_id;

  UPDATE public.votes
  SET user_id = account_id
  WHERE voter_key = p_voter_key
    AND user_id IS NULL;

  GET DIAGNOSTICS linked_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'nickname', resolved_nickname,
    'linked_votes', linked_count
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.get_my_vote_history()
RETURNS TABLE(question_id uuid, option_id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT v.question_id, v.option_id
  FROM public.votes AS v
  WHERE v.user_id = (SELECT auth.uid())
  ORDER BY v.created_at;
$function$;

REVOKE ALL ON FUNCTION public.vote_question(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vote_question(uuid, uuid, uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.link_guest_profile(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_guest_profile(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_vote_history() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_vote_history() TO authenticated;
