import { getSupabaseClient } from "../lib/supabase"

type QuestionRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  category: string
  question_date: string | null
  publish_at: string | null
  expires_at: string | null
}

type OptionRow = {
  id: string
  question_id: string
  label: string
  position: number
}

type ResultRow = {
  option_id: string
  label: string
  votes: number | string
  percentage: number
}

export type PublicOption = {
  id: string
  label: string
  position: number
}

export type PublicQuestion = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  category: string
  questionDate: string | null
  publishAt: string | null
  expiresAt: string | null
  options: PublicOption[]
}

export type QuestionResult = {
  optionId: string
  label: string
  votes: number
  percentage: number
}

export class PublicDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PublicDataError"
  }
}

export class VoteSubmissionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = "VoteSubmissionError"
  }
}

function asSafeCount(value: number | string): number {
  const count = typeof value === "number" ? value : Number(value)
  return Number.isSafeInteger(count) && count >= 0 ? count : 0
}

export async function getPublishedQuestions(): Promise<PublicQuestion[]> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()
  const { data: questionData, error: questionError } = await supabase
    .from("questions")
    .select(
      "id, slug, title, subtitle, category, question_date, publish_at, expires_at",
    )
    .eq("status", "published")
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("question_date", { ascending: false })
    .order("publish_at", { ascending: false, nullsFirst: false })

  if (questionError) {
    throw new PublicDataError(
      `Objavljena pitanja nisu mogla da se učitaju: ${questionError.message}`,
    )
  }

  const questions = (questionData ?? []) as QuestionRow[]
  if (!questions.length) return []

  const { data: optionData, error: optionError } = await supabase
    .from("options")
    .select("id, question_id, label, position")
    .in(
      "question_id",
      questions.map((question) => question.id),
    )
    .order("position", { ascending: true })

  if (optionError) {
    throw new PublicDataError(
      `Odgovori na pitanja nisu mogli da se učitaju: ${optionError.message}`,
    )
  }

  const optionsByQuestion = new Map<string, PublicOption[]>()
  for (const option of (optionData ?? []) as OptionRow[]) {
    const options = optionsByQuestion.get(option.question_id) ?? []
    options.push({
      id: option.id,
      label: option.label,
      position: option.position,
    })
    optionsByQuestion.set(option.question_id, options)
  }

  const questionsWithoutOptions = questions.filter(
    (question) => !optionsByQuestion.get(question.id)?.length,
  )
  if (questionsWithoutOptions.length) {
    throw new PublicDataError(
      `Baza nije vratila opcije za ${questionsWithoutOptions.length} objavljeno pitanje. Proverite podatke i SELECT dozvolu za public.options.`,
    )
  }

  return questions.map((question) => ({
    id: question.id,
    slug: question.slug,
    title: question.title,
    subtitle: question.subtitle,
    category: question.category,
    questionDate: question.question_date,
    publishAt: question.publish_at,
    expiresAt: question.expires_at,
    options: optionsByQuestion.get(question.id) ?? [],
  }))
}

export async function getQuestionResults(
  questionId: string,
): Promise<QuestionResult[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc("get_question_results", {
    p_question_id: questionId,
  })

  if (error) {
    throw new PublicDataError(
      `Rezultati nisu mogli da se učitaju: ${error.message}`,
    )
  }

  return ((data ?? []) as ResultRow[]).map((result) => ({
    optionId: result.option_id,
    label: result.label,
    votes: asSafeCount(result.votes),
    percentage: result.percentage,
  }))
}

function voteResponseCode(response: Record<string, unknown>): string | null {
  for (const key of ["error", "code", "status"]) {
    const value = response[key]
    if (typeof value === "string" && value) return value
  }
  return null
}

export async function submitQuestionVote(
  questionId: string,
  optionId: string,
  voterKey: string,
): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc("vote_question", {
    p_question_id: questionId,
    p_option_id: optionId,
    p_voter_key: voterKey,
  })

  if (error) {
    throw new VoteSubmissionError(
      error.code || "rpc_error",
      error.message || "Glas nije mogao da bude poslat.",
    )
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new VoteSubmissionError(
      "invalid_response",
      "Server nije potvrdio da je glas prihvaćen.",
    )
  }

  const response = data as Record<string, unknown>
  const status = voteResponseCode(response)
  const accepted =
    response.success === true ||
    response.ok === true ||
    status === "success" ||
    status === "ok" ||
    status === "vote_recorded"

  if (!accepted) {
    throw new VoteSubmissionError(
      status ?? "vote_rejected",
      typeof response.message === "string"
        ? response.message
        : "Glas nije prihvaćen.",
    )
  }
}
