import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  getAvailableQuestions,
  getQuestionResults,
  submitQuestionVote,
  type PublicQuestion,
  type QuestionResult,
  VoteSubmissionError,
} from "./data/publicQuestions"
import {
  getAnonymousVoterKey,
  getStoredVoteChoices,
  storeVoteChoice,
} from "./lib/anonymousVoter"
import { ScriptToggle } from "./lib/serbianScript"

type Tab = "home" | "explore" | "saved" | "profile"
type IconName = "home" | "compass" | "bookmark" | "user" | "bell" | "check" | "share" | "users" | "clock" | "arrow" | "close" | "copy" | "instagram" | "message" | "trend" | "settings" | "chevron" | "spark" | "search"

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5M9 21v-7h6v7" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  bookmark: (
    <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.7L6 21V4.5Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M10 20h4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
  message: (
    <>
      <path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v8Z" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-9" />
      <path d="M15 6h6v6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  spark: (
    <path d="M12 2c.7 5.7 2.3 7.3 8 8-5.7.7-7.3 2.3-8 8-.7-5.7-2.3-7.3-8-8 5.7-.7 7.3-2.3 8-8Z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
}

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

type ResultsByQuestion = Record<string, QuestionResult[]>
type AnswersByQuestion = Record<string, string>

function totalVotes(results: QuestionResult[] | undefined): number {
  return results?.reduce((sum, result) => sum + result.votes, 0) ?? 0
}

function leadingResult(
  results: QuestionResult[] | undefined,
): QuestionResult | null {
  if (!results?.length) return null
  return results.reduce((leading, result) =>
    result.votes > leading.votes ? result : leading,
  )
}

function categoryMark(category: string): string {
  const marks: Record<string, string> = {
    Društvo: "Д",
    Kultura: "К",
    Život: "Ж",
    Sport: "С",
  }
  return marks[category] ?? category.slice(0, 1).toLocaleUpperCase("sr-Latn-RS")
}

function formatPortalDate(dateKey: string): string {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00Z`))
}

function belgradeDateKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value
  return `${value("year")}-${value("month")}-${value("day")}`
}

function dailyMajorityMatches(
  questions: PublicQuestion[],
  answers: AnswersByQuestion,
  resultsByQuestion: ResultsByQuestion,
): { matched: number; ready: number } {
  let matched = 0
  let ready = 0
  for (const question of questions) {
    const selected = answers[question.id]
    const results = resultsByQuestion[question.id] ?? []
    if (!selected || !results.length) continue
    const highest = Math.max(...results.map((result) => result.votes))
    ready += 1
    if (results.some((result) => result.optionId === selected && result.votes === highest)) {
      matched += 1
    }
  }
  return { matched, ready }
}

function dailyVoterGroup(matched: number): { name: string; copy: string; emoji: string } {
  if (matched >= 4) {
    return {
      name: "Glas većine, ali sa stavom",
      copy: "Često si na istoj talasnoj dužini sa Srbijom — ali glas je i dalje tvoj.",
      emoji: "🧭",
    }
  }
  if (matched >= 2) {
    return {
      name: "Diplomata sa kompasom",
      copy: "Nekad ideš uz većinu, nekad svojim putem. Kompas radi, samo ne voli autopilot.",
      emoji: "🗺️",
    }
  }
  return {
    name: "Sam svoj uzorak",
    copy: "Danas si češće birao drugačije. Većina je zanimljiva, ali ti nisi fusnota.",
    emoji: "✨",
  }
}

function OfficialLogo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      className={`official-logo ${compact ? "official-logo--compact" : ""}`}
src={`${import.meta.env.BASE_URL}sta-kaze-srbija-logo.png`}
      alt="Šta kaže Srbija?"
    />
  )
}

function Header({
  title,
  settings = false,
  onAction,
}: {
  title?: string
  settings?: boolean
  onAction?: () => void
}) {
  return (
    <header className="topbar">
      <div className="header-identity">
        <OfficialLogo compact />
        {title && <h1 className="screen-title">{title}</h1>}
      </div>
      <div className="header-actions">
        <ScriptToggle />
        <button
          className="icon-button notification"
          aria-label={settings ? "Podešavanja" : "Obaveštenja"}
          onClick={onAction}
        >
          <Icon name={settings ? "settings" : "bell"} size={21} />
          {!settings && <i />}
        </button>
      </div>
    </header>
  )
}

function DataState({
  title,
  message,
  error = false,
  onRetry,
}: {
  title: string
  message: string
  error?: boolean
  onRetry?: () => void
}) {
  return (
    <div className={`empty-state data-state ${error ? "data-state--error" : ""}`}>
      <Icon name={error ? "close" : "spark"} size={25} />
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Pokušaj ponovo</button>}
    </div>
  )
}

function DailyQuestion({
  question,
  questionNumber,
  isToday,
  results,
  selectedAnswer,
  votePending,
  voteError,
  onVote,
  onShare,
}: {
  question: PublicQuestion
  questionNumber: number
  isToday: boolean
  results: QuestionResult[]
  selectedAnswer?: string
  votePending: boolean
  voteError?: string
  onVote: (questionId: string, optionId: string) => void
  onShare: () => void
}) {
  const voted = selectedAnswer !== undefined
  const votes = totalVotes(results)
  const currentTime = new Intl.DateTimeFormat("sr-Latn-RS", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())

  return (
    <section className={`daily-card ${voted ? "is-voted" : ""}`}>
      <div className="card-ornament ornament-left" />
      <div className="card-ornament ornament-right" />
      <span className="daily-index" aria-hidden="true">
        {String(questionNumber).padStart(2, "0")}
      </span>
      <div className="daily-head">
        <div className="eyebrow">
          <Icon name="spark" size={14} /> PITANJE {questionNumber} OD 5
        </div>
        <div className="time-chip">
          <span /> {isToday ? `UŽIVO · ${currentTime}` : "ARHIVA"}
        </div>
      </div>
      <div className="category-label">
        {question.category.toLocaleUpperCase("sr-Latn-RS")}
      </div>
      <h2>{question.title}</h2>
      {question.subtitle && questionNumber !== 5 && <p className="question-subtitle">{question.subtitle}</p>}
      {question.imagePath && (
        <figure className="question-visual">
          <img src={question.imagePath} alt={"Vizuelni prikaz za pitanje: " + question.title} loading="lazy" />
        </figure>
      )}
      <p className="question-meta">
        <Icon name="users" size={16} /> {votes.toLocaleString("sr-RS")} glasova
      </p>

      {!voted ? (
        <div className="vote-block">
          <div className="vote-prompt">
            <span>IZABERI ODGOVOR</span>
            <i />
          </div>
          <div className="vote-actions">
            {question.options.map((option, index) => (
              <button
                className={`vote-button ${index === 0 ? "vote-yes" : "vote-no"}`}
                disabled={votePending}
                key={option.id}
                onClick={() => onVote(question.id, option.id)}
              >
                <span
                  className={`vote-icon ${index === 0 ? "" : "vote-icon--no"}`}
                >
                  <Icon
                    name={index === 0 ? "check" : "arrow"}
                    size={index === 0 ? 20 : 19}
                  />
                </span>
                <span>
                  <strong>{option.label}</strong>
                  <small>
                    {votePending ? "Glas se šalje…" : "Izaberi ovaj odgovor"}
                  </small>
                </span>
                <Icon name="arrow" size={20} className="vote-arrow" />
              </button>
            ))}
          </div>
          {voteError && <p className="data-message data-message--error">{voteError}</p>}
        </div>
      ) : (
        <div className="results" aria-live="polite">
          <div className="results-head">
            <div className="voted-note">
              <span>
                <Icon name="check" size={14} />
              </span>
              Tvoj glas je zabeležen
            </div>
            <span className="live-result">
              <i /> UŽIVO
            </span>
          </div>
          {results.map((result, index) => (
            <ResultBar
              key={result.optionId}
              label={result.label}
              value={result.percentage}
              votes={result.votes.toLocaleString("sr-RS")}
              selected={selectedAnswer === result.optionId}
              color={index === 0 ? "burgundy" : "green"}
              majority={result === leadingResult(results)}
            />
          ))}
          <div className="results-footer">
            <span>
              <Icon name="users" size={16} /> {votes.toLocaleString("sr-RS")}{" "}
              glasova
            </span>
          </div>
          <button className="share-result-button" onClick={onShare}>
            <span>
              <Icon name="share" size={18} />
            </span>
            Podeli kako Srbija glasa
            <Icon name="arrow" size={17} />
          </button>
        </div>
      )}
      {!voted && (
        <div className="privacy-note">
          <span>✓</span> Glasanje je anonimno
        </div>
      )}
    </section>
  )
}

function ResultBar({
  label,
  value,
  votes,
  selected,
  color,
  majority = false,
}: {
  label: string
  value: number
  votes: string
  selected: boolean
  color: string
  majority?: boolean
}) {
  return (
    <div className={`result-row ${selected ? "is-selected" : ""}`}>
      <div className="result-label">
        <span className="result-name">
          <i className={`result-choice result-choice--${color}`}>
            {selected && <Icon name="check" size={11} />}
          </i>
          <span>
            {label}
            <small>
              {votes} glasova {majority && <b>VEĆINA</b>}
            </small>
          </span>
          {selected && <em>TVOJ IZBOR</em>}
        </span>
        <strong>{value}%</strong>
      </div>
      <div className="bar-track">
        <div
          className={`bar-fill bar-${color}`}
          style={{ "--bar-width": `${value}%` } as CSSProperties}
        />
      </div>
    </div>
  )
}

function TrendingSection({
  questions,
  resultsByQuestion,
  onOpen,
}: {
  questions: PublicQuestion[]
  resultsByQuestion: ResultsByQuestion
  onOpen: () => void
}) {
  const trending = [...questions]
    .sort(
      (left, right) =>
        totalVotes(resultsByQuestion[right.id]) -
        totalVotes(resultsByQuestion[left.id]),
    )
    .slice(0, 3)
  const accents = ["burgundy", "green", "gold"]

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <span>ŠTA SE PRIČA</span>
          <h2>U trendu</h2>
        </div>
        <button onClick={onOpen}>
          Vidi sve <Icon name="arrow" size={16} />
        </button>
      </div>
      <div className="trending-scroll">
        {trending.map((item, index) => (
          <button className="trend-card" key={item.id} onClick={onOpen}>
            <div className={`trend-number trend-${accents[index]}`}>
              0{index + 1}
            </div>
            <div className="trend-content">
              <span>{item.category.toLocaleUpperCase("sr-Latn-RS")}</span>
              <h3>{item.title}</h3>
              <p>
                <Icon name="trend" size={15} />{" "}
                {totalVotes(resultsByQuestion[item.id]).toLocaleString("sr-RS")}{" "}
                glasova
              </p>
            </div>
            <div className="round-arrow">
              <Icon name="arrow" size={17} />
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function HomeScreen({
  questions,
  dailyQuestions,
  resultsByQuestion,
  answers,
  votePending,
  voteErrors,
  loading,
  loadError,
  onRetry,
  onVote,
  setTab,
  onShare,
  selectedDay,
}: {
  questions: PublicQuestion[]
  selectedDay: string
  dailyQuestions: PublicQuestion[]
  resultsByQuestion: ResultsByQuestion
  answers: AnswersByQuestion
  votePending: string | null
  voteErrors: Record<string, string>
  loading: boolean
  loadError: string | null
  onRetry: () => void
  onVote: (questionId: string, optionId: string) => void
  setTab: (tab: Tab) => void
  onShare: (questionId: string) => void
}) {
  const firstUnansweredIndex = dailyQuestions.findIndex((question) => !answers[question.id])
  const pendingIndex = votePending
    ? dailyQuestions.findIndex((question) => question.id === votePending)
    : -1
  const lastVisibleIndex =
    pendingIndex >= 0
      ? pendingIndex
      : firstUnansweredIndex >= 0
        ? firstUnansweredIndex
        : dailyQuestions.length - 1
  const visibleDailyQuestions = dailyQuestions.slice(0, lastVisibleIndex + 1)
  const answeredToday = dailyQuestions.filter((question) => answers[question.id]).length
  const categories = Array.from(
    questions.reduce((counts, question) => {
      counts.set(question.category, (counts.get(question.category) ?? 0) + 1)
      return counts
    }, new Map<string, number>()),
  ).map(([name, count]) => ({ name, count, mark: categoryMark(name) }))
  const today = formatPortalDate(selectedDay).toLocaleUpperCase("sr-Latn-RS")
  const isToday = selectedDay === belgradeDateKey()
  const completedSelectedDay = dailyQuestions.length === 5 && dailyQuestions.every((question) => answers[question.id])
  const dayTeaser = completedSelectedDay ? dailyQuestions[4]?.subtitle : null
  return (
    <>
      <Header />
      <main className="screen-content home-content">
        <div className="welcome-row">
          <div>
            <span>{today}</span>
            <h1>Dobro došli na portal.</h1>
          </div>
          <div className="streak">
            <strong>{answeredToday}/5</strong>
            <span>
              {isToday ? "današnjih" : "tog dana"}
              <br />
              odgovora
            </span>
          </div>
        </div>
        {loading ? (
          <DataState title="Učitavanje pitanja" message="Povezujemo se sa živim podacima." />
        ) : loadError ? (
          <DataState
            error
            title="Pitanja nisu dostupna"
            message={loadError}
            onRetry={onRetry}
          />
        ) : dailyQuestions.length ? (
          <>
            <section className="daily-progress" aria-label="Napredak današnjeg paketa">
              <div>
                <span>{isToday ? "DANAŠNJI PAKET" : "IZABRANI PAKET"}</span>
                <strong>{answeredToday} / 5 odgovora</strong>
              </div>
              <div className="daily-progress-track" aria-hidden="true">
                <i style={{ width: `${Math.min(answeredToday, 5) * 20}%` }} />
              </div>
              {dailyQuestions.length < 5 && (
                <p>Za ovaj dan je objavljeno {dailyQuestions.length} od 5 pitanja. Završni profil čeka kompletan paket.</p>
              )}
            </section>
            <div className="daily-flow">
              {visibleDailyQuestions.map((question, index) => (
                <DailyQuestion
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                  isToday={isToday}
                  results={resultsByQuestion[question.id] ?? []}
                  selectedAnswer={answers[question.id]}
                  votePending={votePending === question.id}
                  voteError={voteErrors[question.id]}
                  onVote={onVote}
                  onShare={() => onShare(question.id)}
                />
              ))}
            </div>
            {dayTeaser && (
              <section className="tomorrow-teaser">
                <span>NAJAVA ZA SUTRA</span>
                <p>{dayTeaser}</p>
              </section>
            )}
          </>
        ) : (
          <DataState
            title="Za ovaj dan još nema pitanja"
            message="Izaberi drugi datum iz kalendara ili se vrati kada budu objavljena nova pitanja."
          />
        )}
        {!!questions.length && (
          <TrendingSection
            questions={questions}
            resultsByQuestion={resultsByQuestion}
            onOpen={() => setTab("explore")}
          />
        )}
        <section className="category-strip">
          <div className="section-heading compact">
            <div>
              <span>ISTRAŽI TEME</span>
              <h2>Kategorije</h2>
            </div>
          </div>
          <div className="category-pills">
            {categories.map((category) => (
              <button key={category.name} onClick={() => setTab("explore")}>
                <i>{category.mark}</i>
                <span>
                  {category.name}
                  <small>{category.count} pitanja</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

function ExploreScreen({
  questions,
  resultsByQuestion,
  saved,
  answers,
  votePending,
  voteErrors,
  loading,
  loadError,
  onToggleSave,
  onVote,
  onRetry,
  availableDays,
  onSelectDay,
}: {
  questions: PublicQuestion[]
  availableDays: string[]
  onSelectDay: (date: string) => void
  resultsByQuestion: ResultsByQuestion
  saved: string[]
  answers: AnswersByQuestion
  votePending: string | null
  voteErrors: Record<string, string>
  loading: boolean
  loadError: string | null
  onToggleSave: (id: string) => void
  onVote: (questionId: string, answerId: string) => void
  onRetry: () => void
}) {
  const [filter, setFilter] = useState("Sve")
  const [query, setQuery] = useState("")
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const filters = [
    "Sve",
    ...Array.from(new Set(questions.map((question) => question.category))),
  ]
  const visibleQuestions = questions.filter(
    (item) =>
      (filter === "Sve" || item.category === filter) &&
      item.title
        .toLocaleLowerCase("sr-Latn-RS")
        .includes(query.toLocaleLowerCase("sr-Latn-RS")),
  )
  return (
    <>
      <Header title="Istraži" />
      <main className="screen-content">
        <div className="explore-intro">
          <span>GLAS NARODA</span>
          <h2>
            O čemu Srbija
            <br />
            danas razmišlja?
          </h2>
          <p>Pronađi teme koje su ti važne i dodaj svoj glas.</p>
        </div>
        <section className="archive-calendar">
          <div className="archive-calendar-heading">
            <span>ARHIVA I KALENDAR</span>
            <h3>Izaberi dan za glasanje</h3>
            <p>Otvori dnevni paket. Ako još nisi glasao/la, počinješ od prvog pitanja.</p>
          </div>
          <div className="archive-days">
            {availableDays.map((date) => {
              const dayQuestions = questions.filter((question) => question.questionDate === date)
              const answered = dayQuestions.filter((question) => answers[question.id]).length
              const completed = dayQuestions.length === 5 && answered === 5
              return (
                <button className="archive-day" key={date} onClick={() => onSelectDay(date)}>
                  <span>{formatPortalDate(date)}</span>
                  <small>{completed ? "Završeno · pregledaj rezultate" : `${answered}/5 odgovora · nastavi paket`}</small>
                  <Icon name="arrow" size={17} />
                </button>
              )
            })}
            {!availableDays.length && <p className="archive-empty">Kalendar će se popuniti čim stignu pitanja.</p>}
          </div>
        </section>
        <label className="search-field">
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pretraži pitanja i teme"
            aria-label="Pretraži pitanja i teme"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Obriši pretragu">
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
        <div className="filter-scroll">
          {filters.map((item) => (
            <button
              className={filter === item ? "active" : ""}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="question-list">
          {loading && (
            <DataState
              title="Učitavanje pitanja"
              message="Povezujemo se sa živim podacima."
            />
          )}
          {!loading && loadError && (
            <DataState
              error
              title="Pitanja nisu dostupna"
              message={loadError}
              onRetry={onRetry}
            />
          )}
          {visibleQuestions.map((item, index) => {
            const isOpen = openQuestion === item.id
            const selectedAnswer = answers[item.id]
            const results = resultsByQuestion[item.id] ?? []
            const resultsByOption = new Map(
              results.map((result) => [result.optionId, result]),
            )
            const leading = leadingResult(results)
            const votes = totalVotes(results)
            return (
              <article
                className={`question-row ${isOpen ? "question-row--open" : ""}`}
                key={item.id}
              >
                <div className="row-top">
                  <span>{item.category}</span>
                  <button
                    className={saved.includes(item.id) ? "is-saved" : ""}
                    aria-label={
                      saved.includes(item.id)
                        ? "Ukloni iz sačuvanih"
                        : "Sačuvaj pitanje"
                    }
                    onClick={() => onToggleSave(item.id)}
                  >
                    <Icon name="bookmark" size={19} />
                  </button>
                </div>
                <h3>{item.title}</h3>
                {item.subtitle && (
                  <p className="question-subtitle">{item.subtitle}</p>
                )}
                {isOpen && item.imagePath && (
                  <figure className="question-visual question-visual--inline">
                    <img src={item.imagePath} alt={"Vizuelni prikaz za pitanje: " + item.title} loading="lazy" />
                  </figure>
                )}
                {isOpen ? (
                  <div className="inline-poll">
                    {!selectedAnswer ? (
                      <>
                        <span className="inline-prompt">
                          IZABERI JEDAN OD {item.options.length} ODGOVORA
                        </span>
                        {item.options.map((option, optionIndex) => (
                          <button
                            className="inline-option"
                            disabled={votePending === item.id}
                            key={option.id}
                            onClick={() => onVote(item.id, option.id)}
                          >
                            <i>{String.fromCharCode(65 + optionIndex)}</i>
                            <span>{option.label}</span>
                            <Icon name="arrow" size={15} />
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <div className="inline-live">
                          <span>
                            <i /> REZULTATI UŽIVO
                          </span>
                          <small>Tvoj glas je zabeležen</small>
                        </div>
                        {item.options.map((option) => {
                          const result = resultsByOption.get(option.id)
                          return (
                            <div
                              className={`inline-result ${
                                selectedAnswer === option.id ? "selected" : ""
                              }`}
                              key={option.id}
                            >
                              <div>
                                <span>
                                  {option.label}
                                  {selectedAnswer === option.id && (
                                    <b>TVOJ IZBOR</b>
                                  )}
                                </span>
                                <strong>{result?.percentage ?? 0}%</strong>
                              </div>
                              <div className="inline-track">
                                <i
                                  style={{
                                    width: `${result?.percentage ?? 0}%`,
                                  }}
                                />
                              </div>
                              <small>
                                {(result?.votes ?? 0).toLocaleString("sr-RS")}{" "}
                                glasova
                              </small>
                            </div>
                          )
                        })}
                      </>
                    )}
                    {voteErrors[item.id] && (
                      <p className="data-message data-message--error">
                        {voteErrors[item.id]}
                      </p>
                    )}
                  </div>
                ) : leading ? (
                  <div className="mini-result">
                    <div>
                      <i style={{ width: `${leading.percentage}%` }} />
                    </div>
                    <strong>
                      {leading.percentage}% kaže{" "}
                      {leading.label.toLocaleLowerCase("sr-Latn-RS")}
                    </strong>
                  </div>
                ) : (
                  <div className="mini-result mini-result--empty">
                    <strong>Još nema glasova</strong>
                  </div>
                )}
                <div className="row-footer">
                  <span>{votes.toLocaleString("sr-RS")} glasova</span>
                  <button
                    onClick={() => setOpenQuestion(isOpen ? null : item.id)}
                  >
                    {isOpen
                      ? "Zatvori"
                      : selectedAnswer
                        ? "Rezultati"
                        : "Glasaj"}{" "}
                    <Icon name={isOpen ? "close" : "arrow"} size={16} />
                  </button>
                </div>
                <span className="list-index">0{index + 1}</span>
              </article>
            )
          })}
          {!loading && !loadError && !visibleQuestions.length && (
            <div className="empty-state">
              <Icon name="search" size={25} />
              <h3>Nema pronađenih pitanja</h3>
              <p>Pokušaj sa drugim pojmom ili kategorijom.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function SavedScreen({
  questions,
  resultsByQuestion,
  saved,
  onToggleSave,
  onExplore,
}: {
  questions: PublicQuestion[]
  resultsByQuestion: ResultsByQuestion
  saved: string[]
  onToggleSave: (id: string) => void
  onExplore: () => void
}) {
  const savedQuestions = questions.filter((question) =>
    saved.includes(question.id),
  )
  return (
    <>
      <Header title="Sačuvano" />
      <main className="screen-content">
        <div className="saved-hero">
          <div className="saved-icon">
            <Icon name="bookmark" size={25} />
          </div>
          <span>TVOJA KOLEKCIJA</span>
          <h2>Pitanja za kasnije</h2>
          <p>Vrati se temama koje želiš pažljivije da razmotriš.</p>
        </div>
        <div className="saved-list">
          {savedQuestions.map((question) => (
            <article className="saved-card" key={question.id}>
              <div>
                <span>{question.category.toLocaleUpperCase("sr-Latn-RS")}</span>
                <h3>{question.title}</h3>
                <p>
                  <Icon name="users" size={15} />{" "}
                  {totalVotes(resultsByQuestion[question.id]).toLocaleString(
                    "sr-RS",
                  )}{" "}
                  glasova
                </p>
              </div>
              <button
                className="saved-remove"
                onClick={() => onToggleSave(question.id)}
                aria-label="Ukloni iz sačuvanih"
              >
                <Icon name="bookmark" size={18} />
              </button>
            </article>
          ))}
          {!savedQuestions.length && (
            <div className="empty-state saved-empty">
              <Icon name="bookmark" size={26} />
              <h3>Kolekcija je prazna</h3>
              <p>Sačuvaj zanimljiva pitanja i vrati im se kasnije.</p>
              <button onClick={onExplore}>Istraži pitanja</button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function ProfileScreen({
  questions,
  selectedDay,
  dailyQuestions,
  resultsByQuestion,
  answers,
  savedCount,
  onContinue,
}: {
  questions: PublicQuestion[]
  selectedDay: string
  dailyQuestions: PublicQuestion[]
  resultsByQuestion: ResultsByQuestion
  answers: AnswersByQuestion
  savedCount: number
  onContinue: () => void
}) {
  const [panel, setPanel] = useState<"history" | "settings" | null>(null)
  const [anonymous, setAnonymous] = useState(
    () => window.localStorage.getItem("sta-kaze-srbija:anonymous") !== "false",
  )
  const [notifications, setNotifications] = useState(
    () =>
      window.localStorage.getItem("sta-kaze-srbija:notifications") !== "false",
  )
  const voteHistory = questions
    .filter((question) => answers[question.id])
    .map((question) => ({
      question: question.title,
      answer:
        question.options.find((option) => option.id === answers[question.id])
          ?.label ?? "Odgovor",
    }))
  const categoryCounts = questions.reduce((counts, question) => {
    if (answers[question.id]) {
      counts.set(question.category, (counts.get(question.category) ?? 0) + 1)
    }
    return counts
  }, new Map<string, number>())
  const favoriteCategories = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
  const dailyAnswered = dailyQuestions.filter((question) => answers[question.id]).length
  const dailyMatches = dailyMajorityMatches(dailyQuestions, answers, resultsByQuestion)
  const dailyCategoryCounts = dailyQuestions.reduce((counts, question) => {
    if (answers[question.id]) counts.set(question.category, (counts.get(question.category) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
  const dailyTopCategory = [...dailyCategoryCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
  const completedDailyGroup =
    dailyQuestions.length === 5 && dailyAnswered === 5 && dailyMatches.ready === 5
      ? dailyVoterGroup(dailyMatches.matched)
      : null

  useEffect(() => {
    window.localStorage.setItem(
      "sta-kaze-srbija:anonymous",
      String(anonymous),
    )
  }, [anonymous])

  useEffect(() => {
    window.localStorage.setItem(
      "sta-kaze-srbija:notifications",
      String(notifications),
    )
  }, [notifications])

  return (
    <>
      <Header
        title="Profil"
        settings
        onAction={() => setPanel(panel === "settings" ? null : "settings")}
      />
      <main className="screen-content profile-content">
        <section className="profile-hero profile-hero--guest">
          <div className="avatar">
            <Icon name="user" size={24} />
          </div>
          <h2>Moj profil</h2>
          <p>Anonimno glasanje · ovaj uređaj</p>
          <div className="stats profile-stats--two">
            <div>
              <strong>{voteHistory.length}</strong>
              <span>glasova</span>
            </div>
            <div>
              <strong>{savedCount}</strong>
              <span>sačuvano</span>
            </div>
          </div>
        </section>
        {dailyQuestions.length > 0 && (
          <section className={`daily-profile-card ${completedDailyGroup ? "is-complete" : ""}`}>
            <span className="daily-profile-eyebrow">{selectedDay === belgradeDateKey() ? "DANAŠNJI REZULTAT" : `REZULTAT · ${formatPortalDate(selectedDay).toLocaleUpperCase("sr-Latn-RS")}`}</span>
            {completedDailyGroup ? (
              <>
                <div className="daily-profile-group">
                  <span aria-hidden="true">{completedDailyGroup.emoji}</span>
                  <div>
                    <h3>{completedDailyGroup.name}</h3>
                    <p>{completedDailyGroup.copy}</p>
                  </div>
                </div>
                <div className="daily-profile-stats">
                  <div><strong>{dailyAnswered}/5</strong><span>odgovora danas</span></div>
                  <div><strong>{dailyMatches.matched}/5</strong><span>izbora uz većinu</span></div>
                  <div><strong>{dailyTopCategory ?? "—"}</strong><span>najčešća tema</span></div>
                </div>
                <small>Ovo je dnevna igra poređenja odgovora, ne ozbiljna procena ličnosti.</small>
              </>
            ) : dailyQuestions.length === 5 && dailyAnswered === 5 ? (
              <>
                <h3>Pet odgovora je sačuvano</h3>
                <p>Rezultati većine trenutno nisu dostupni za {5 - dailyMatches.ready} pitanja, pa dnevnu grupu nećemo nagađati. Osveži stranicu da ponovo učitamo statistiku.</p>
              </>
            ) : (
              <>
                <h3>Još jedan korak do današnje statistike</h3>
                <p>Odgovorio/la si na {dailyAnswered} od 5 pitanja. Posle petog dobijaš svoju dnevnu grupu i pregled odgovora.</p>
                <button type="button" onClick={onContinue}>
                  Nastavi današnja pitanja
                </button>
              </>
            )}
          </section>
        )}
        {dailyQuestions.length === 5 && dailyQuestions.every((question) => answers[question.id]) && dailyQuestions[4]?.subtitle && (
          <section className="tomorrow-teaser">
            <span>NAJAVA ZA SUTRA</span>
            <p>{dailyQuestions[4].subtitle}</p>
          </section>
        )}
        <section className="voice-card">
          <div className="voice-head">
            <div>
              <span>PRIJAVA KORISNIKA</span>
              <h3>Pristupi svom nalogu</h3>
            </div>
            <Icon name="user" size={20} />
          </div>
          <p>
            Prijava je putem sigurnog email linka, bez lozinke. U ovoj verziji
            glasovi i sačuvana pitanja ostaju sačuvani samo u ovom pregledaču.
          </p>
          <a className="profile-auth-link" href={import.meta.env.BASE_URL + "prijava"}>
            Prijavi se emailom <Icon name="arrow" size={17} />
          </a>
        </section>
        <section className="profile-section">
          <div className="section-heading compact">
            <div>
              <span>NAJČEŠĆE GLASAŠ</span>
              <h2>Tvoje teme</h2>
            </div>
          </div>
          <div className="interest-grid">
            {favoriteCategories.map(([category, count]) => (
              <div key={category}>
                <span>{categoryMark(category)}</span>
                <strong>{category}</strong>
                <small>{count} {count === 1 ? "glas" : "glasa"}</small>
              </div>
            ))}
            {!favoriteCategories.length && (
              <div>
                <span>—</span>
                <strong>Još nema tema</strong>
                <small>Glasaj za prvo pitanje</small>
              </div>
            )}
          </div>
        </section>
        <button
          className={`profile-link ${panel === "history" ? "active" : ""}`}
          onClick={() => setPanel(panel === "history" ? null : "history")}
        >
          <span>
            Istorija glasanja
            <small>Pregledaj svojih {voteHistory.length} odgovora</small>
          </span>
          <Icon name="chevron" size={19} />
        </button>
        {panel === "history" && (
          <div className="profile-panel">
            <span>POSLEDNJI GLASOVI</span>
            {voteHistory.slice(0, 5).map((vote) => (
              <div key={vote.question}>
                <p>{vote.question}</p>
                <strong>{vote.answer}</strong>
              </div>
            ))}
            {!voteHistory.length && <p>Još nema potvrđenih glasova.</p>}
            <button onClick={() => setPanel(null)}>Zatvori istoriju</button>
          </div>
        )}
        <button
          className={`profile-link ${panel === "settings" ? "active" : ""}`}
          onClick={() => setPanel(panel === "settings" ? null : "settings")}
        >
          <span>
            Podešavanja privatnosti<small>Kontroliši svoje podatke</small>
          </span>
          <Icon name="chevron" size={19} />
        </button>
        {panel === "settings" && (
          <div className="profile-panel settings-panel">
            <span>PRIVATNOST I OBAVEŠTENJA</span>
            <label>
              <span>
                Anonimno glasanje
                <small>Tvoj identitet nije vidljiv drugima</small>
              </span>
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)}
              />
            </label>
            <label>
              <span>
                Dnevno pitanje<small>Podsetnik kada stigne novo pitanje</small>
              </span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(event) => setNotifications(event.target.checked)}
              />
            </label>
          </div>
        )}
        <div className="profile-access-links">
          <a href={import.meta.env.BASE_URL + "redakcija"}>Ulaz u redakciju</a>
          <small>Pristup je ograničen na vlasnički nalog.</small>
        </div>
      </main>
    </>
  )
}

function ShareSheet({
  question,
  results,
  onClose,
}: {
  question: PublicQuestion
  results: QuestionResult[]
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const leading = leadingResult(results)
  const votes = totalVotes(results)
  const shareText = `${question.title} Glasaj i ti.`
  const copy = () => {
    navigator.clipboard?.writeText(shareText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="share-sheet"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <div className="sheet-handle" />
        <div className="share-header">
          <div>
            <span>PROŠIRI RAZGOVOR</span>
            <h2 id="share-title">Podeli rezultat</h2>
          </div>
          <button onClick={onClose} aria-label="Zatvori">
            <Icon name="close" size={21} />
          </button>
        </div>
        <div className="share-preview">
          <div className="preview-brand">
            <OfficialLogo />
          </div>
          <span className="preview-kicker">
            PITANJE DANA ·{" "}
            {question.category.toLocaleUpperCase("sr-Latn-RS")}
          </span>
          <h3>{question.title}</h3>
          <div className="preview-result">
            <div>
              <strong>{leading?.percentage ?? 0}%</strong>
              <span>
                kaže
                <br />
                <b>{leading?.label ?? "—"}</b>
              </span>
            </div>
            <small>REZULTATI UŽIVO</small>
          </div>
          <div className="preview-bar">
            <i style={{ width: `${leading?.percentage ?? 0}%` }} />
          </div>
          <div className="preview-legend">
            {results.slice(0, 2).map((result) => (
              <span key={result.optionId}>
                {result.label} · {result.votes.toLocaleString("sr-RS")}
              </span>
            ))}
          </div>
          <p>{votes.toLocaleString("sr-RS")} ljudi je glasalo. A ti, šta kažeš?</p>
          <div className="preview-motif">✦</div>
        </div>
        <div className="share-options">
          <button>
            <span className="share-circle instagram">
              <Icon name="instagram" size={22} />
            </span>
            <small>Instagram</small>
          </button>
          <button>
            <span className="share-circle message">
              <Icon name="message" size={22} />
            </span>
            <small>Poruka</small>
          </button>
          <button onClick={copy}>
            <span className={`share-circle copy ${copied ? "done" : ""}`}>
              <Icon name={copied ? "check" : "copy"} size={21} />
            </span>
            <small>{copied ? "Kopirano" : "Kopiraj link"}</small>
          </button>
          <button
            onClick={() =>
              navigator.share?.({
                title: "Šta kaže Srbija?",
                text: shareText,
              })
            }
          >
            <span className="share-circle more">
              <Icon name="share" size={21} />
            </span>
            <small>Još</small>
          </button>
        </div>
      </section>
    </div>
  )
}

interface BottomNavProps {
  tab: Tab
  setTab: (tab: Tab) => void
}

interface BottomNavItem {
  id: Tab
  label: string
  icon: IconName
}

function BottomNav({ tab, setTab }: BottomNavProps) {
  const items: BottomNavItem[] = [
    { id: "home", label: "Početna", icon: "home" },
    { id: "explore", label: "Istraži", icon: "compass" },
    { id: "saved", label: "Sačuvano", icon: "bookmark" },
    { id: "profile", label: "Profil", icon: "user" },
  ]
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={tab === item.id ? "active" : ""}
          onClick={() => setTab(item.id)}
        >
          <span>
            <Icon name={item.icon} size={21} />
          </span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home")
  const [shareQuestionId, setShareQuestionId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState(belgradeDateKey)
  const [completionIntent, setCompletionIntent] = useState<string | null>(null)
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [resultsByQuestion, setResultsByQuestion] =
    useState<ResultsByQuestion>({})
  const [answers, setAnswers] =
    useState<AnswersByQuestion>(getStoredVoteChoices)
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(
        window.localStorage.getItem("sta-kaze-srbija:saved") ?? "[]",
      )
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const hasLoadedRef = useRef(false)
  const [votePending, setVotePending] = useState<string | null>(null)
  const [voteErrors, setVoteErrors] = useState<Record<string, string>>({})
  const dailyQuestions = useMemo(
    () =>
      questions
        .filter((question) => question.questionDate === selectedDay)
        .sort((left, right) => left.slug.localeCompare(right.slug, "en"))
        .slice(0, 5),
    [questions, selectedDay],
  )
  const dailyCompleted =
    dailyQuestions.length === 5 && dailyQuestions.every((question) => answers[question.id] !== undefined)

  useEffect(() => {
    if (dailyCompleted && votePending === null && completionIntent === selectedDay) {
      setTab("profile")
      setCompletionIntent(null)
    }
  }, [dailyCompleted, votePending, completionIntent, selectedDay])

  useEffect(() => {
    let cancelled = false

    async function loadPublicData() {
      if (!hasLoadedRef.current) setLoading(true)
      setLoadError(null)
      try {
        const publishedQuestions = await getAvailableQuestions()
        const resultEntries = await Promise.all(
          publishedQuestions.map(async (question) => [
            question.id,
            await getQuestionResults(question.id),
          ] as const),
        )
        if (!cancelled) {
          hasLoadedRef.current = true
          setQuestions(publishedQuestions)
          setResultsByQuestion(Object.fromEntries(resultEntries))
        }
      } catch (error) {
        if (!cancelled && !hasLoadedRef.current) {
          setQuestions([])
          setResultsByQuestion({})
          setLoadError(
            error instanceof Error
              ? error.message
              : "Živi podaci trenutno nisu dostupni.",
          )
        }
      } finally {
        if (!cancelled) {
          hasLoadedRef.current = true
          setLoading(false)
        }
      }
    }

    void loadPublicData()
    return () => {
      cancelled = true
    }
  }, [reload])

  useEffect(() => {
    const refreshPublishedQuestions = () => {
      if (document.visibilityState === "visible") {
        setReload((current) => current + 1)
      }
    }
    const refreshTimer = window.setInterval(refreshPublishedQuestions, 60_000)
    window.addEventListener("focus", refreshPublishedQuestions)
    document.addEventListener("visibilitychange", refreshPublishedQuestions)
    return () => {
      window.clearInterval(refreshTimer)
      window.removeEventListener("focus", refreshPublishedQuestions)
      document.removeEventListener("visibilitychange", refreshPublishedQuestions)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      "sta-kaze-srbija:saved",
      JSON.stringify(saved),
    )
  }, [saved])

  const changeTab = (next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleSaved = (id: string) => {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [id, ...current],
    )
  }

  const selectArchiveDay = (date: string) => {
    setSelectedDay(date)
    setCompletionIntent(null)
    changeTab("home")
  }

  const handleVote = async (questionId: string, optionId: string) => {
    if (votePending) return

    setVotePending(questionId)
    setVoteErrors((current) => {
      const next = { ...current }
      delete next[questionId]
      return next
    })

    try {
      const voterKey = getAnonymousVoterKey()
      await submitQuestionVote(questionId, optionId, voterKey)
      storeVoteChoice(questionId, optionId)

      try {
        const freshResults = await getQuestionResults(questionId)
        setResultsByQuestion((current) => ({
          ...current,
          [questionId]: freshResults,
        }))
      } catch {
        setVoteErrors((current) => ({
          ...current,
          [questionId]:
            "Glas je prihvaćen, ali osveženi rezultati trenutno nisu dostupni.",
        }))
      }
      setAnswers((current) => ({ ...current, [questionId]: optionId }))
      if (dailyQuestions.length === 5 && dailyQuestions[4].id === questionId) {
        setCompletionIntent(selectedDay)
      }
    } catch (error) {
      const code =
        error instanceof VoteSubmissionError
          ? error.code.toLocaleLowerCase("en-US")
          : "client_error"
      const messages: Record<string, string> = {
        already_voted: "Već ste glasali na ovom pitanju.",
        invalid_option: "Izabrani odgovor ne pripada ovom pitanju.",
        question_unavailable: "Ovo pitanje trenutno nije dostupno za glasanje.",
      }
      setVoteErrors((current) => ({
        ...current,
        [questionId]:
          messages[code] ??
          (error instanceof Error
            ? `Glas nije prihvaćen: ${error.message}`
            : "Glas nije prihvaćen."),
      }))
    } finally {
      setVotePending(null)
    }
  }

  return (
    <div className="page-canvas">
      <div className="app-shell">
        {tab === "home" && (
          <HomeScreen
            questions={questions}
            dailyQuestions={dailyQuestions}
            selectedDay={selectedDay}
            resultsByQuestion={resultsByQuestion}
            answers={answers}
            votePending={votePending}
            voteErrors={voteErrors}
            loading={loading}
            loadError={loadError}
            onRetry={() => {
              hasLoadedRef.current = false
              setLoading(true)
              setReload((current) => current + 1)
            }}
            onVote={(questionId, optionId) =>
              void handleVote(questionId, optionId)
            }
            setTab={changeTab}
            onShare={(questionId) => setShareQuestionId(questionId)}
          />
        )}
        {tab === "explore" && (
          <ExploreScreen
            questions={questions}
            availableDays={[...new Set(questions.map((question) => question.questionDate).filter((date): date is string => Boolean(date)))].sort((left, right) => right.localeCompare(left))}
            onSelectDay={selectArchiveDay}
            resultsByQuestion={resultsByQuestion}
            saved={saved}
            answers={answers}
            votePending={votePending}
            voteErrors={voteErrors}
            loading={loading}
            loadError={loadError}
            onToggleSave={toggleSaved}
            onVote={(questionId, optionId) =>
              void handleVote(questionId, optionId)
            }
            onRetry={() => {
              hasLoadedRef.current = false
              setLoading(true)
              setReload((current) => current + 1)
            }}
          />
        )}
        {tab === "saved" && (
          <SavedScreen
            questions={questions}
            resultsByQuestion={resultsByQuestion}
            saved={saved}
            onToggleSave={toggleSaved}
            onExplore={() => changeTab("explore")}
          />
        )}
        {tab === "profile" && (
          <ProfileScreen
            questions={questions}
            dailyQuestions={dailyQuestions}
            selectedDay={selectedDay}
            resultsByQuestion={resultsByQuestion}
            answers={answers}
            savedCount={saved.length}
            onContinue={() => changeTab("home")}
          />
        )}
        <BottomNav tab={tab} setTab={changeTab} />
        {shareQuestionId && questions.find((question) => question.id === shareQuestionId) && (
          <ShareSheet
            question={questions.find((question) => question.id === shareQuestionId)!}
            results={resultsByQuestion[shareQuestionId] ?? []}
            onClose={() => setShareQuestionId(null)}
          />
        )}
      </div>
    </div>
  )
}
