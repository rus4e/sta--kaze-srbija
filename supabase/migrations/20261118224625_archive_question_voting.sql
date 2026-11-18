DROP POLICY IF EXISTS "read published questions or editor owner" ON public.questions;
CREATE POLICY "read available questions or editor owner"
ON public.questions
FOR SELECT
TO anon, authenticated
USING (
  (
    status IN ('published', 'archived')
    AND (publish_at IS NULL OR publish_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  )
  OR (SELECT ((auth.jwt() -> 'app_metadata') ->> 'editor_role') = 'owner')
);

DROP POLICY IF EXISTS "read published options or editor owner" ON public.options;
CREATE POLICY "read available options or editor owner"
ON public.options
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.questions q
    WHERE q.id = options.question_id
      AND q.status IN ('published', 'archived')
      AND (q.publish_at IS NULL OR q.publish_at <= now())
      AND (q.expires_at IS NULL OR q.expires_at > now())
  )
  OR (SELECT ((auth.jwt() -> 'app_metadata') ->> 'editor_role') = 'owner')
);

CREATE OR REPLACE FUNCTION public.get_question_results(p_question_id uuid)
RETURNS TABLE(option_id uuid, label text, votes bigint, percentage integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  WITH counts AS (
    SELECT o.id AS option_id, o.label, count(v.id)::bigint AS vote_count, o.position
    FROM public.options o
    JOIN public.questions q ON q.id = o.question_id
    LEFT JOIN public.votes v ON v.option_id = o.id AND v.question_id = q.id
    WHERE q.id = p_question_id
      AND q.status IN ('published', 'archived')
      AND (q.publish_at IS NULL OR q.publish_at <= now())
      AND (q.expires_at IS NULL OR q.expires_at > now())
    GROUP BY o.id, o.label, o.position
  ),
  total AS (SELECT coalesce(sum(vote_count), 0)::numeric AS vote_total FROM counts)
  SELECT counts.option_id, counts.label, counts.vote_count,
    CASE WHEN total.vote_total = 0 THEN 0
      ELSE round(counts.vote_count * 100 / total.vote_total)::integer
    END
  FROM counts CROSS JOIN total
  ORDER BY counts.position;
$function$;

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
    SELECT 1 FROM public.options
    WHERE id = p_option_id AND question_id = p_question_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_option');
  END IF;

  INSERT INTO public.votes(question_id, option_id, voter_key)
  VALUES (p_question_id, p_option_id, p_voter_key)
  ON CONFLICT (question_id, voter_key) DO NOTHING
  RETURNING id INTO new_id;

  IF new_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
  END IF;

  RETURN jsonb_build_object('ok', true);
END
$function$;