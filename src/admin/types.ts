export type AdminScreen = "dashboard" | "weekly" | "generator" | "research" | "studio" | "review" | "calendar" | "analytics" | "activity"

export type QuestionType = "Tekstualno" | "Ilustrovano" | "Vizuelno"
export type EditorialStatus = "Predlog AI" | "Čeka proveru" | "Odobreno" | "Zakazano" | "Objavljeno" | "Odbijeno"

export type DemoQuestion = {
  id: string
  code?: string
  dayIndex: number
  text: string
  answers: string[]
  optionIds?: string[]
  assetReady?: boolean
  imagePath?: string
  category: string
  type: QuestionType
  publishDate: string
  rationale: string
  source?: string
  status: EditorialStatus
}
export type DemoPackage = {
  id: string
  dayIndex: number
  day: string
  date: string
  publishTime: string
  questions: DemoQuestion[]
}
export type DemoActivity = {
  id: string
  time: string
  actor: "AI predlog" | "Urednik"
  action: string
  target: string
}
