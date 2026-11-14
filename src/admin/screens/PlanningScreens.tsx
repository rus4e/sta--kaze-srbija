import { useState } from "react"
import type { DemoPackage, DemoQuestion } from "../types"
import {
  AdminPageHeader,
  DemoBadge,
  StatusBadge,
} from "../components/AdminCommon"
import { AdminIcon } from "../components/AdminIcon"

export function WeeklyPlanScreen({ packages }: { packages: DemoPackage[] }) {
  const [openPackage, setOpenPackage] = useState(packages[0].id)
  return (
    <>
      <AdminPageHeader
        eyebrow="35 PITANJA · 7 DANA"
        title="Nedeljni plan"
        description="Svaki paket sadrži tri tekstualna, jedno ilustrovano i jedno vizuelno pitanje."
        action={<DemoBadge>DEMO PLAN</DemoBadge>}
      />
      <div className="weekly-rule">
        <div>
          <strong>35</strong>
          <span>pitanja nedeljno</span>
        </div>
        <i />
        <div>
          <strong>7</strong>
          <span>dnevnih paketa</span>
        </div>
        <i />
        <div>
          <strong>3 + 1 + 1</strong>
          <span>struktura paketa</span>
        </div>
      </div>
      <section className="weekly-packages">
        {packages.map((pack) => {
          const isOpen = openPackage === pack.id
          const typeCounts = {
            text: pack.questions.filter((q) => q.type === "Tekstualno").length,
            illustrated: pack.questions.filter((q) => q.type === "Ilustrovano")
              .length,
            visual: pack.questions.filter((q) => q.type === "Vizuelno").length,
          }
          const valid =
            typeCounts.text === 3 &&
            typeCounts.illustrated === 1 &&
            typeCounts.visual === 1
          return (
            <article
              className={`weekly-package ${isOpen ? "is-open" : ""}`}
              key={pack.id}
            >
              <button
                className="weekly-package-head"
                onClick={() => setOpenPackage(isOpen ? "" : pack.id)}
              >
                <span className="package-date">{pack.date}</span>
                <div>
                  <strong>{pack.day}</strong>
                  <small>Objava u {pack.publishTime} · Europe/Belgrade</small>
                </div>
                <div className={`validation-chip ${valid ? "valid" : ""}`}>
                  <AdminIcon name={valid ? "check" : "warning"} size={13} />
                  {valid ? "Struktura ispravna" : "Proveri paket"}
                </div>
                <AdminIcon name="arrow" size={17} />
              </button>
              {isOpen && (
                <div className="weekly-question-list">
                  <div className="structure-counts">
                    <span>
                      Tekstualna <b>{typeCounts.text}/3</b>
                    </span>
                    <span>
                      Ilustrovano <b>{typeCounts.illustrated}/1</b>
                    </span>
                    <span>
                      Vizuelno <b>{typeCounts.visual}/1</b>
                    </span>
                  </div>
                  {pack.questions.map((question, index) => (
                    <div className="weekly-question" key={question.id}>
                      <i>0{index + 1}</i>
                      <div>
                        <span>
                          {question.category} · {question.type}
                        </span>
                        <h3>{question.text}</h3>
                        <small>{question.answers.length} odgovora</small>
                      </div>
                      <StatusBadge status={question.status} />
                    </div>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </section>
    </>
  )
}

export function CalendarScreen({ packages }: { packages: DemoPackage[] }) {
  return (
    <>
      <AdminPageHeader
        eyebrow="UREĐIVAČKI RASPORED"
        title="Kalendar objavljivanja"
        description="Sedmodnevni pregled sa podrazumevanim vremenom objave u 08:00."
        action={<DemoBadge>NE OBJAVLJUJE STVARNO</DemoBadge>}
      />
      <div className="timezone-note">
        <AdminIcon name="calendar" />
        <div>
          <strong>Europe/Belgrade</strong>
          <span>Podrazumevano vreme: 08:00</span>
        </div>
      </div>
      <section className="calendar-grid">
        {packages.map((pack) => {
          const approved = pack.questions.filter((q) =>
            ["Odobreno", "Zakazano"].includes(q.status),
          ).length
          const ready = approved === 5
          return (
            <article key={pack.id} className={ready ? "ready" : ""}>
              <header>
                <span>{pack.day}</span>
                <strong>{pack.date}</strong>
              </header>
              <div className="calendar-time">
                <AdminIcon name="calendar" size={16} />
                <strong>{pack.publishTime}</strong>
              </div>
              <div className="calendar-count">
                <span>Odobreno</span>
                <strong>{approved}/5</strong>
              </div>
              <div className="calendar-progress">
                <i style={{ width: `${approved * 20}%` }} />
              </div>
              {!ready && (
                <p>
                  <AdminIcon name="warning" size={14} /> Paket nije spreman za
                  zakazivanje.
                </p>
              )}
              <button disabled={!ready}>
                {ready ? "Promeni termin" : "Zakazivanje blokirano"}
              </button>
            </article>
          )
        })}
      </section>
      <div className="admin-alert calendar-alert">
        <AdminIcon name="warning" />
        <p>
          <strong>Zaštitno pravilo:</strong> demonstracioni kalendar ne
          dozvoljava zakazivanje dok svih pet pitanja nema status „Odobreno“.
          Stvarno objavljivanje nije implementirano.
        </p>
      </div>
    </>
  )
}

export function ReviewScreen({
  questions,
  updateQuestion,
  setStatus,
}: {
  questions: DemoQuestion[]
  updateQuestion: (question: DemoQuestion) => void
  setStatus: (id: string, status: "Odobreno" | "Odbijeno") => void
}) {
  const reviewable = questions.filter((q) =>
    ["Čeka proveru", "Predlog AI", "Odobreno", "Odbijeno"].includes(q.status),
  )
  const [selectedId, setSelectedId] = useState(reviewable[0]?.id)
  const selected =
    questions.find((question) => question.id === selectedId) ?? reviewable[0]
  if (!selected) return null

  return (
    <>
      <AdminPageHeader
        eyebrow="RUČNA KONTROLA"
        title="Urednički pregled"
        description="AI predlaže. Urednik menja, odobrava ili odbija svako pitanje."
        action={<DemoBadge>LOKALNA DEMO IZMENA</DemoBadge>}
      />
      <div className="review-layout">
        <aside className="review-queue">
          <div>
            <span>RED ZA PROVERU</span>
            <strong>{reviewable.length}</strong>
          </div>
          {reviewable.map((question) => (
            <button
              className={selected.id === question.id ? "active" : ""}
              key={question.id}
              onClick={() => setSelectedId(question.id)}
            >
              <span>
                {question.category} · {question.type}
              </span>
              <p>{question.text}</p>
              <StatusBadge status={question.status} />
            </button>
          ))}
        </aside>
        <section className="question-editor">
          <header>
            <div>
              <span>UREĐIVANJE PITANJA</span>
              <h2>{selected.id}</h2>
            </div>
            <StatusBadge status={selected.status} />
          </header>
          <label>
            Tekst pitanja
            <textarea
              value={selected.text}
              onChange={(event) =>
                updateQuestion({ ...selected, text: event.target.value })
              }
            />
          </label>
          <div className="editor-row">
            <label>
              Kategorija
              <select
                value={selected.category}
                onChange={(event) =>
                  updateQuestion({ ...selected, category: event.target.value })
                }
              >
                {[
                  "Društvo",
                  "Život",
                  "Posao",
                  "Kultura",
                  "Porodica",
                  "Navike",
                  "Sport",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Tip
              <select
                value={selected.type}
                onChange={(event) =>
                  updateQuestion({
                    ...selected,
                    type: event.target.value as DemoQuestion["type"],
                  })
                }
              >
                {["Tekstualno", "Ilustrovano", "Vizuelno"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Datum
              <input
                type="date"
                value={selected.publishDate}
                onChange={(event) =>
                  updateQuestion({
                    ...selected,
                    publishDate: event.target.value,
                  })
                }
              />
            </label>
          </div>
          <fieldset>
            <legend>Ponuđeni odgovori</legend>
            {selected.answers.map((answer, index) => (
              <label className="answer-edit" key={`${selected.id}-${index}`}>
                <span>{String.fromCharCode(65 + index)}</span>
                <input
                  value={answer}
                  onChange={(event) =>
                    updateQuestion({
                      ...selected,
                      answers: selected.answers.map((item, i) =>
                        i === index ? event.target.value : item,
                      ),
                    })
                  }
                />
              </label>
            ))}
          </fieldset>
          <label>
            Zašto je pitanje zanimljivo
            <textarea
              className="small"
              value={selected.rationale}
              onChange={(event) =>
                updateQuestion({ ...selected, rationale: event.target.value })
              }
            />
          </label>
          <div className="editor-checks">
            {[
              "Jasna formulacija",
              "Odgovori su različiti",
              "Nije sugestivno",
              "Primereno širokoj publici",
            ].map((item) => (
              <span key={item}>
                <AdminIcon name="check" size={13} />
                {item}
              </span>
            ))}
          </div>
          <div className="editor-actions">
            <button
              className="reject"
              onClick={() => setStatus(selected.id, "Odbijeno")}
            >
              Odbij pitanje
            </button>
            <button disabled title="AI servis nije povezan">
              <AdminIcon name="spark" size={15} /> Regeneriši (planirano)
            </button>
            <button
              className="approve"
              onClick={() => setStatus(selected.id, "Odobreno")}
            >
              <AdminIcon name="check" size={15} /> Ručno odobri
            </button>
          </div>
          <p className="editor-disclaimer">
            Sve izmene postoje samo u memoriji browsera. Nema upisa u bazu niti
            objavljivanja.
          </p>
        </section>
      </div>
    </>
  )
}
