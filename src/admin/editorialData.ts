import { getSupabaseClient } from "../lib/supabase"
import type { DemoPackage, DemoQuestion, EditorialStatus, QuestionType } from "./types"

type QuestionRow = {
  id: string
  slug: string
  status: string
  title: string
  category: string
  question_date: string
  publish_at: string | null
}
type EditorialRow = {
  question_id: string
  week_start: string
  package_day: string
  package_position: number
  question_type: QuestionType
  editorial_status: EditorialStatus
  asset_ready: boolean
  editorial_note: string | null
}
type OptionRow = { id: string; question_id: string; label: string; position: number }

const dayNames = ["Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja"]
const dayCodes = ["PON", "UTO", "SRE", "ČET", "PET", "SUB", "NED"]

function belgradeDateNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value
  return `${value("year")}-${value("month")}-${value("day")}`
}
function weekStartFor(date: string) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7))
  return value.toISOString().slice(0, 10)
}
function dayIndexFor(date: string) {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
}
function displayDate(date: string) {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Belgrade",
  }).format(new Date(`${date}T12:00:00Z`))
}
function displayTime(value: string | null) {
  if (!value) return "08:00"
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Belgrade",
  }).format(new Date(value))
}
function belgradePublishAt(date: string) {
  const offsetName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Belgrade",
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(`${date}T12:00:00Z`))
    .find((part) => part.type === "timeZoneName")?.value
  const match = offsetName?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  const offset = match
    ? `${match[1]}${match[2].padStart(2, "0")}:${(match[3] ?? "00").padStart(2, "0")}`
    : "+01:00"
  return new Date(`${date}T08:00:00${offset}`).toISOString()
}

export async function loadEditorialPackages(): Promise<DemoPackage[]> {
  const supabase = getSupabaseClient()
  const { data: questionData, error: questionError } = await supabase
    .from("questions")
    .select("id, slug, status, title, category, question_date, publish_at")
    .gte("question_date", belgradeDateNow())
    .order("question_date", { ascending: true })
    .limit(500)
  if (questionError) {
    throw new Error(`Nacrti nisu mogli da se učitaju: ${questionError.message}`)
  }
  const now = Date.now()
  const questionRows = ((questionData ?? []) as QuestionRow[]).filter(
    (question) =>
      question.status === "draft" ||
      (question.status === "published" &&
        question.publish_at !== null &&
        Date.parse(question.publish_at) > now),
  )
  if (!questionRows.length) return []

  const questionIds = questionRows.map((question) => question.id)
  const [editorialResult, optionResult] = await Promise.all([
    supabase
      .from("question_editorial_metadata")
      .select("question_id, week_start, package_day, package_position, question_type, editorial_status, asset_ready, editorial_note")
      .in("question_id", questionIds),
    supabase
      .from("options")
      .select("id, question_id, label, position")
      .in("question_id", questionIds)
      .order("position", { ascending: true }),
  ])
  if (editorialResult.error) {
    throw new Error(`Uredničke beleške nisu mogle da se učitaju: ${editorialResult.error.message}`)
  }
  if (optionResult.error) {
    throw new Error(`Odgovori nisu mogli da se učitaju: ${optionResult.error.message}`)
  }

  const metadataByQuestion = new Map(
    ((editorialResult.data ?? []) as EditorialRow[]).map((row) => [row.question_id, row]),
  )
  const optionsByQuestion = new Map<string, OptionRow[]>()
  for (const option of (optionResult.data ?? []) as OptionRow[]) {
    const current = optionsByQuestion.get(option.question_id) ?? []
    current.push(option)
    optionsByQuestion.set(option.question_id, current)
  }

  const questions: DemoQuestion[] = questionRows.flatMap((row) => {
    const editorial = metadataByQuestion.get(row.id)
    if (!editorial) return []
    const options = optionsByQuestion.get(row.id) ?? []
    if (options.length !== 4) {
      throw new Error(`Pitanje ${row.slug} nema sva četiri odgovora. Nacrt nije prikazan kao potpun.`)
    }
    const dayIndex = dayIndexFor(row.question_date)
    return [{
      id: row.id,
      code: `${dayCodes[dayIndex]}-${String(editorial.package_position).padStart(2, "0")}`,
      dayIndex,
      text: row.title,
      answers: options.map((option) => option.label),
      optionIds: options.map((option) => option.id),
      assetReady: editorial.asset_ready,
      category: row.category,
      type: editorial.question_type,
      publishDate: row.question_date,
      rationale: editorial.editorial_note ?? "",
      status: row.status === "published" ? "Zakazano" : editorial.editorial_status,
    }]
  })

  const questionsByDate = new Map<string, DemoQuestion[]>()
  for (const question of questions) {
    const current = questionsByDate.get(question.publishDate) ?? []
    current.push(question)
    questionsByDate.set(question.publishDate, current)
  }
  return [...questionsByDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayQuestions]) => {
      const dayIndex = dayIndexFor(date)
      const firstQuestion = questionRows.find((question) => question.question_date === date)
      const metadata = firstQuestion ? metadataByQuestion.get(firstQuestion.id) : undefined
      return {
        id: `${metadata?.week_start ?? date}-${date}`,
        dayIndex,
        day: dayNames[dayIndex],
        date: displayDate(date),
        publishTime: displayTime(firstQuestion?.publish_at ?? null),
        questions: dayQuestions.sort((a, b) =>
          Number(a.code?.slice(-2) ?? 0) - Number(b.code?.slice(-2) ?? 0),
        ),
      }
    })
}

export async function saveEditorialQuestion(question: DemoQuestion) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(question.publishDate)) {
    throw new Error("Datum pitanja nije ispravan.")
  }
  if (!question.optionIds || question.optionIds.length !== question.answers.length) {
    throw new Error("Odgovori nisu povezani sa sačuvanim pitanjem.")
  }
  const supabase = getSupabaseClient()
  const { data: currentQuestion, error: currentQuestionError } = await supabase
    .from("questions")
    .select("status, publish_at")
    .eq("id", question.id)
    .maybeSingle()
  if (currentQuestionError) {
    throw new Error(`Pitanje nije moglo da se proveri: ${currentQuestionError.message}`)
  }
  if (!currentQuestion) throw new Error("Pitanje nije pronađeno.")
  const scheduledFuture =
    currentQuestion.status === "published" &&
    currentQuestion.publish_at !== null &&
    Date.parse(currentQuestion.publish_at) > Date.now()
  if (currentQuestion.status !== "draft" && !scheduledFuture) {
    throw new Error("Javno objavljeno pitanje više se ne može menjati iz ovog pregleda.")
  }

  const { data: updatedQuestion, error: questionError } = await supabase
    .from("questions")
    .update({
      title: question.text.trim(),
      category: question.category,
      question_date: question.publishDate,
      publish_at: belgradePublishAt(question.publishDate),
    })
    .eq("id", question.id)
    .eq("status", currentQuestion.status)
    .select("id")
    .maybeSingle()
  if (questionError) throw new Error(`Pitanje nije sačuvano: ${questionError.message}`)
  if (!updatedQuestion) throw new Error("Pitanje više nije nacrt ili nalog nema dozvolu za izmenu.")

  const { data: currentMetadata, error: currentMetadataError } = await supabase
    .from("question_editorial_metadata")
    .select("question_type, asset_ready")
    .eq("question_id", question.id)
    .maybeSingle()
  if (currentMetadataError) {
    throw new Error("Urednički podaci nisu mogli da se provere: " + currentMetadataError.message)
  }
  if (!currentMetadata) throw new Error("Urednički podaci nisu pronađeni.")
  const nextAssetReady = question.type === "Tekstualno" ||
    (currentMetadata.question_type === question.type && currentMetadata.asset_ready)
  const { data: updatedMetadata, error: metadataError } = await supabase
    .from("question_editorial_metadata")
    .update({
      question_type: question.type,
      editorial_status: question.status,
      asset_ready: nextAssetReady,
      editorial_note: question.rationale.trim() || null,
      week_start: weekStartFor(question.publishDate),
      package_day: question.publishDate,
      updated_at: new Date().toISOString(),
    })
    .eq("question_id", question.id)
    .select("question_id")
    .maybeSingle()
  if (metadataError) throw new Error(`Uredničke beleške nisu sačuvane: ${metadataError.message}`)
  if (!updatedMetadata) throw new Error("Urednički podaci nisu pronađeni za ovo pitanje.")

  const optionUpdates = await Promise.all(
    question.optionIds.map((optionId, index) =>
      supabase
        .from("options")
        .update({ label: question.answers[index].trim() })
        .eq("id", optionId)
        .eq("question_id", question.id)
        .select("id")
        .maybeSingle(),
    ),
  )
  const failedOption = optionUpdates.find((result) => result.error || !result.data)
  if (failedOption) {
    throw new Error(`Nisu sačuvani svi odgovori: ${failedOption.error?.message ?? "odgovor nije pronađen"}`)
  }
}

export async function saveEditorialStatus(
  questionId: string,
  status: Extract<EditorialStatus, "Čeka proveru" | "Odobreno" | "Odbijeno">,
) {
  const { data, error } = await getSupabaseClient()
    .from("question_editorial_metadata")
    .update({ editorial_status: status, updated_at: new Date().toISOString() })
    .eq("question_id", questionId)
    .select("question_id")
    .maybeSingle()
  if (error) throw new Error(`Status nije sačuvan: ${error.message}`)
  if (!data) throw new Error("Urednički status nije pronađen.")
}

export async function publishEditorialQuestion(questionId: string): Promise<"Zakazano" | "Objavljeno"> {
  const supabase = getSupabaseClient()
  const { data: editorial, error: editorialError } = await supabase
    .from("question_editorial_metadata")
    .select("editorial_status, asset_ready")
    .eq("question_id", questionId)
    .maybeSingle()
  if (editorialError) throw new Error(`Provera pitanja nije uspela: ${editorialError.message}`)
  if (!editorial) throw new Error("Urednički podaci nisu pronađeni.")
  if (editorial.editorial_status !== "Odobreno") throw new Error("Pitanje prvo mora biti urednički odobreno.")
  if (!editorial.asset_ready) throw new Error("Za ovo pitanje prvo treba pripremiti i povezati vizuelni materijal.")

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("status, publish_at")
    .eq("id", questionId)
    .maybeSingle()
  if (questionError) throw new Error(`Pitanje nije moglo da se proveri: ${questionError.message}`)
  if (!question) throw new Error("Pitanje nije pronađeno.")
  if (question.status === "published") {
    return question.publish_at && Date.parse(question.publish_at) > Date.now() ? "Zakazano" : "Objavljeno"
  }
  if (question.status !== "draft") throw new Error("Pitanje nije u statusu nacrta.")

  const { data: publishedQuestion, error: publishError } = await supabase
    .from("questions")
    .update({ status: "published" })
    .eq("id", questionId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle()
  if (publishError) throw new Error(`Objava nije uspela: ${publishError.message}`)
  if (!publishedQuestion) throw new Error("Pitanje više nije nacrt.")
  return question.publish_at && Date.parse(question.publish_at) > Date.now() ? "Zakazano" : "Objavljeno"
}
