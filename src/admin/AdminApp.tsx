import { useEffect, useState } from "react"
import { AdminShell } from "./components/AdminShell"
import type { AdminScreen, DemoPackage, DemoQuestion } from "./types"
import { DashboardScreen } from "./screens/DashboardScreen"
import { ActivityScreen, AnalyticsScreen } from "./screens/InsightsScreens"
import { CalendarScreen, ReviewScreen, WeeklyPlanScreen } from "./screens/PlanningScreens"
import { GeneratorScreen, ResearchScreen, VisualStudioScreen } from "./screens/CreativeScreens"
import {
  loadEditorialPackages,
  publishEditorialQuestion,
  saveEditorialQuestion,
  saveEditorialStatus,
} from "./editorialData"
import "./admin.css"

export function AdminApp() {
  const [screen, setScreen] = useState<AdminScreen>("dashboard")
  const [packages, setPackages] = useState<DemoPackage[]>([])
  const [questions, setQuestions] = useState<DemoQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    void loadEditorialPackages()
      .then((loadedPackages) => {
        if (!active) return
        setPackages(loadedPackages)
        setQuestions(loadedPackages.flatMap((pack) => pack.questions))
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : "Nacrti trenutno nisu dostupni.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [retry])

  const updateQuestion = (updated: DemoQuestion) =>
    setQuestions((current) => current.map((question) => question.id === updated.id ? updated : question))

  const setStatus = async (id: string, status: "Odobreno" | "Odbijeno") => {
    await saveEditorialStatus(id, status)
    setQuestions((current) => current.map((question) => question.id === id ? { ...question, status } : question))
  }

  const saveQuestion = async (question: DemoQuestion) => {
    await saveEditorialQuestion(question)
    const refreshed = await loadEditorialPackages()
    setPackages(refreshed)
    setQuestions(refreshed.flatMap((pack) => pack.questions))
  }

  const publishQuestion = async (id: string) => {
    const status = await publishEditorialQuestion(id)
    setQuestions((current) => current.map((question) => question.id === id ? { ...question, status } : question))
    return status
  }

  const visiblePackages = packages.map((pack) => ({
    ...pack,
    questions: pack.questions.map((question) => questions.find((item) => item.id === question.id) ?? question),
  }))

  if (loading || error) {
    return (
      <AdminShell screen={screen} setScreen={setScreen}>
        <section className="admin-panel" aria-live="polite">
          <span className="admin-eyebrow">NEDELJNI PLAN</span>
          <h1>{loading ? "Učitavam sačuvane nacrte" : "Nacrti nisu dostupni"}</h1>
          <p>{loading ? "Preuzimam pitanja i odgovore iz redakcijske baze." : error}</p>
          {error && <button type="button" onClick={() => setRetry((value) => value + 1)}>Pokušaj ponovo</button>}
        </section>
      </AdminShell>
    )
  }

  if (!questions.length) {
    return (
      <AdminShell screen={screen} setScreen={setScreen}>
        <section className="admin-panel">
          <span className="admin-eyebrow">NEDELJNI PLAN</span>
          <h1>Nema sačuvanih nacrta</h1>
          <p>Ovde će se pojaviti budući paketi pitanja kada budu sačuvani u redakcijskoj bazi.</p>
        </section>
      </AdminShell>
    )
  }

  return (
    <AdminShell screen={screen} setScreen={setScreen}>
      {screen === "dashboard" && (
        <DashboardScreen
          packages={visiblePackages}
          questions={questions}
          onOpenWeekly={() => setScreen("weekly")}
          onOpenReview={() => setScreen("review")}
        />
      )}
      {screen === "weekly" && <WeeklyPlanScreen packages={visiblePackages} />}
      {screen === "generator" && <GeneratorScreen />}
      {screen === "research" && <ResearchScreen />}
      {screen === "studio" && <VisualStudioScreen />}
      {screen === "review" && (
        <ReviewScreen
          questions={questions}
          updateQuestion={updateQuestion}
          saveQuestion={saveQuestion}
          setStatus={setStatus}
          publishQuestion={publishQuestion}
        />
      )}
      {screen === "calendar" && <CalendarScreen packages={visiblePackages} />}
      {screen === "analytics" && <AnalyticsScreen />}
      {screen === "activity" && <ActivityScreen />}
    </AdminShell>
  )
}
