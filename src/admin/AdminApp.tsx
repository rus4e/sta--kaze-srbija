import { useState } from "react"
import { AdminShell } from "./components/AdminShell"
import { allDemoQuestions, demoPackages } from "./demoData"
import type { AdminScreen, DemoQuestion } from "./types"
import { DashboardScreen } from "./screens/DashboardScreen"
import {
  CalendarScreen,
  ReviewScreen,
  WeeklyPlanScreen,
} from "./screens/PlanningScreens"
import {
  GeneratorScreen,
  ResearchScreen,
  VisualStudioScreen,
} from "./screens/CreativeScreens"
import { ActivityScreen, AnalyticsScreen } from "./screens/InsightsScreens"
import "./admin.css"

export function AdminApp() {
  const [screen, setScreen] = useState<AdminScreen>("dashboard")
  const [questions, setQuestions] = useState<DemoQuestion[]>(allDemoQuestions)
  const packages = demoPackages.map((pack) => ({
    ...pack,
    questions: pack.questions.map(
      (question) =>
        questions.find((item) => item.id === question.id) ?? question,
    ),
  }))
  const updateQuestion = (updated: DemoQuestion) =>
    setQuestions((current) =>
      current.map((question) =>
        question.id === updated.id ? updated : question,
      ),
    )
  const setStatus = (id: string, status: "Odobreno" | "Odbijeno") =>
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, status } : question,
      ),
    )

  return (
    <AdminShell screen={screen} setScreen={setScreen}>
      {screen === "dashboard" && (
        <DashboardScreen
          packages={packages}
          questions={questions}
          onOpenWeekly={() => setScreen("weekly")}
          onOpenReview={() => setScreen("activity")}
        />
      )}
      {screen === "weekly" && <WeeklyPlanScreen packages={packages} />}
      {screen === "generator" && <GeneratorScreen />}
      {screen === "research" && <ResearchScreen />}
      {screen === "studio" && <VisualStudioScreen />}
      {screen === "review" && (
        <ReviewScreen
          questions={questions}
          updateQuestion={updateQuestion}
          setStatus={setStatus}
        />
      )}
      {screen === "calendar" && <CalendarScreen packages={packages} />}
      {screen === "analytics" && <AnalyticsScreen />}
      {screen === "activity" && <ActivityScreen />}
    </AdminShell>
  )
}
