import { useState } from "react"
import type { DemoPackage, DemoQuestion } from "../types"
import {
  AdminPageHeader,
  DemoBadge,
  StatusBadge,
} from "../components/AdminCommon"
import { AdminIcon } from "../components/AdminIcon"

function belgradeToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value
  return `${value("year")}-${value("month")}-${value("day")}`
}

export function WeeklyPlanScreen({ packages }: { packages: DemoPackage[] }) {
  const [openPackage, setOpenPackage] = useState(packages[0].id)
  return (
    <>
      <AdminPageHeader
        eyebrow="35 PITANJA · 7 DANA"
        title="Nedeljni plan"
        description="Nedeljni nacrti, sačuvani po danu i pripremljeni za uredničku objavu."
        action={<DemoBadge>SAČUVANO U REDAKCIJI</DemoBadge>}
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
          const valid = pack.questions.length === 5
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
                  {valid ? "5 pitanja u paketu" : "Nedostaje pitanje"}
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
        description="Termini su sačuvani u nacrtima; javna objava se uključuje ručno."
        action={<DemoBadge>RUČNA OBJAVA</DemoBadge>}
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
          const approved = pack.questions.filter((q) => ["Odobreno", "Zakazano"].includes(q.status) && (q.type === "Tekstualno" || q.assetReady)).length
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
              <button disabled>
                {ready ? "Objavi pitanja pojedinačno iz pregleda" : "Zakazivanje blokirano"}
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
  saveQuestion,
  setStatus,
  publishQuestion,
}: {
  questions: DemoQuestion[]
  updateQuestion: (question: DemoQuestion) => void
  saveQuestion: (question: DemoQuestion) => Promise<void>
  setStatus: (id: string, status: "Odobreno" | "Odbijeno") => Promise<void>
  publishQuestion: (id: string) => Promise<"Zakazano" | "Objavljeno">
}) {
  const reviewable = questions.filter((question) =>
    ["Čeka proveru", "Predlog AI", "Odobreno", "Odbijeno", "Zakazano"].includes(question.status),
  )
  const [selectedId, setSelectedId] = useState(reviewable[0]?.id)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [messageIsError, setMessageIsError] = useState(false)
  const [imageState, setImageState] = useState<{
    path: string
    status: "loaded" | "error"
  } | null>(null)
  const selected = reviewable.find((question) => question.id === selectedId) ?? reviewable[0]
  const imagePath = selected?.imagePath
  const imageStatus = !imagePath
    ? "none"
    : imageState?.path === imagePath
      ? imageState.status
      : "loading"
  const imageVerified =
    selected?.type === "Tekstualno" ||
    (selected?.assetReady === true && imageStatus === "loaded")
  const dateIsPast = !!selected && selected.publishDate < belgradeToday()

  const runStatusChange = async (status: "Odobreno" | "Odbijeno") => {
    if (!selected || busy || selected.status === "Zakazano") return
    setBusy(true)
    setMessage("")
    try {
      await saveQuestion(selected)
      await setStatus(selected.id, status)
      setMessage(status === "Odobreno" ? "Pitanje je odobreno i sačuvano kao nacrt." : "Pitanje je odbijeno i ostaje privatni nacrt.")
      setMessageIsError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Izmena nije sačuvana.")
      setMessageIsError(true)
    } finally {
      setBusy(false)
    }
  }

  const runSave = async () => {
    if (!selected || busy) return
    setBusy(true)
    setMessage("")
    try {
      await saveQuestion(selected)
      setMessage(
        selected.status === "Zakazano"
          ? "Izmene su sačuvane. Zakazani termin ostaje aktivan."
          : "Izmene su sačuvane. Pitanje ostaje nacrt.",
      )
      setMessageIsError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Izmena nije sačuvana.")
      setMessageIsError(true)
    } finally {
      setBusy(false)
    }
  }

  const runPublish = async () => {
    if (
      !selected ||
      busy ||
      selected.status !== "Odobreno" ||
      !selected.assetReady ||
      !imageVerified ||
      dateIsPast
    ) return
    const dateLabel = new Intl.DateTimeFormat("sr-Latn-RS", {
      dateStyle: "long",
      timeZone: "Europe/Belgrade",
    }).format(new Date(selected.publishDate + "T12:00:00Z"))
    const confirmed = window.confirm(
      "Potvrdi objavu pitanja " + (selected.code ?? "") + ". Biće javno dostupno " + dateLabel + " u 08:00 po vremenu Beograda. Status pitanja će preći iz nacrta u objavljeno/zakazano.",
    )
    if (!confirmed) return
    setBusy(true)
    setMessage("")
    try {
      await saveQuestion(selected)
      const status = await publishQuestion(selected.id)
      setMessage(status === "Zakazano" ? "Objava je aktivirana za izabrani termin." : "Pitanje je sada javno objavljeno.")
      setMessageIsError(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Objava nije uspela.")
      setMessageIsError(true)
    } finally {
      setBusy(false)
    }
  }

  if (!selected) {
    return (
      <>
        <AdminPageHeader
          eyebrow="RUČNA KONTROLA"
          title="Urednički pregled"
          description="Nema pitanja koja čekaju uredničku odluku."
          action={<DemoBadge>SVE JE SAČUVANO</DemoBadge>}
        />
        <div className="admin-panel">Sva pitanja su odobrena, odbijena ili zakazana.</div>
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="RUČNA KONTROLA"
        title="Urednički pregled"
        description="Pregledaj odobrene nacrte i zakazane objave; izmene zakazanih pitanja ne prekidaju termin."
        action={<DemoBadge>SAČUVANO U REDAKCIJI</DemoBadge>}
      />
      <div className="review-layout">
        <aside className="review-queue">
          <div><span>RED ZA PROVERU</span><strong>{reviewable.length}</strong></div>
          {reviewable.map((question) => (
            <button
              className={selected.id === question.id ? "active" : ""}
              key={question.id}
              onClick={() => { setSelectedId(question.id); setMessage("") }}
            >
              <span>{question.code} · {question.category} · {question.type}</span>
              <p>{question.text}</p>
              <StatusBadge status={question.status} />
            </button>
          ))}
        </aside>
        <section className="question-editor">
          <header>
            <div><span>UREĐIVANJE PITANJA</span><h2>{selected.code ?? selected.id}</h2></div>
            <StatusBadge status={selected.status} />
          </header>
          <label>
            Tekst pitanja
            <textarea value={selected.text} disabled={busy} onChange={(event) => updateQuestion({ ...selected, text: event.target.value })} />
          </label>
          {selected.type !== "Tekstualno" && (
            imagePath ? (
              <figure className="question-asset-preview">
                <img
                  src={imagePath}
                  alt={"Vizuelni prikaz za pitanje " + (selected.code ?? "")}
                  onLoad={() => setImageState({ path: imagePath, status: "loaded" })}
                  onError={() => setImageState({ path: imagePath, status: "error" })}
                />
                <figcaption>
                  <span className={`asset-verify asset-verify--${imageStatus}`} role={imageStatus === "error" ? "alert" : "status"}>
                    {imageStatus === "loaded"
                      ? selected.assetReady
                        ? "Slika je učitana sa javnog sajta."
                        : "Fajl se učitao, ali nije označen kao spreman."
                      : imageStatus === "error"
                        ? "Slika nije mogla da se učita."
                        : "Proveravam da li je slika dostupna…"}
                  </span>
                  <a href={imagePath} target="_blank" rel="noopener noreferrer">
                    Otvori originalnu sliku
                  </a>
                </figcaption>
              </figure>
            ) : (
              <div className="admin-alert">
                <AdminIcon name="image" size={16} />
                <p>Za ovo pitanje nije povezana slika na javnom sajtu.</p>
              </div>
            )
          )}
          <div className="editor-row">
            <label>
              Kategorija
              <select value={selected.category} disabled={busy} onChange={(event) => updateQuestion({ ...selected, category: event.target.value })}>
                {["Društvo", "Život", "Posao", "Kultura", "Porodica", "Navike", "Sport"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Tip
              <select value={selected.type} disabled={busy} onChange={(event) => updateQuestion({ ...selected, type: event.target.value as DemoQuestion["type"] })}>
                {["Tekstualno", "Ilustrovano", "Vizuelno"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Datum
              <input type="date" value={selected.publishDate} disabled={busy || selected.status === "Zakazano"} onChange={(event) => updateQuestion({ ...selected, publishDate: event.target.value })} />
            </label>
          </div>
          <fieldset>
            <legend>Ponuđeni odgovori</legend>
            {selected.answers.map((answer, index) => (
              <label className="answer-edit" key={selected.optionIds?.[index] ?? selected.id + "-" + index}>
                <span>{String.fromCharCode(65 + index)}</span>
                <input value={answer} disabled={busy} onChange={(event) => updateQuestion({ ...selected, answers: selected.answers.map((item, i) => i === index ? event.target.value : item) })} />
              </label>
            ))}
          </fieldset>
          <label>
            Beleška ili smernica za vizuelni materijal
            <textarea className="small" value={selected.rationale} disabled={busy} onChange={(event) => updateQuestion({ ...selected, rationale: event.target.value })} />
          </label>
          {selected.status === "Zakazano" && (
            <div className="admin-alert scheduled-edit-note">
              <AdminIcon name="calendar" size={16} />
              <p>Ovo pitanje je već zakazano. Možeš urediti tekst i odgovore; postojeći termin ostaje aktivan.</p>
            </div>
          )}
          {dateIsPast && selected.status !== "Zakazano" && (
            <div className="admin-alert past-date-warning" role="alert">
              <AdminIcon name="warning" size={16} />
              <p>Izabrani datum je prošao. Pitanje možeš sačuvati kao nacrt, ali ga neću zakazati za prošli termin.</p>
            </div>
          )}
          <div className="editor-checks">
            {["Jasna formulacija", "Odgovori su različiti", "Nije sugestivno", "Primereno širokoj publici"].map((item) => (
              <span key={item}><AdminIcon name="check" size={13} />{item}</span>
            ))}
          </div>
          <div className="editor-actions">
            <button type="button" disabled={busy} onClick={() => void runSave()}>
              {selected.status === "Zakazano" ? "Sačuvaj izmene · termin ostaje" : "Sačuvaj izmene"}
            </button>
            {selected.status !== "Zakazano" && (
              <>
                <button className="reject" type="button" disabled={busy} onClick={() => void runStatusChange("Odbijeno")}>Odbij pitanje</button>
                <button disabled title="AI servis nije povezan"><AdminIcon name="spark" size={15} /> Regeneriši (planirano)</button>
                <button className="approve" type="button" disabled={busy} onClick={() => void runStatusChange("Odobreno")}><AdminIcon name="check" size={15} /> Ručno odobri</button>
                <button className="approve" type="button" disabled={busy || selected.status !== "Odobreno" || !selected.assetReady || !imageVerified || dateIsPast} title={dateIsPast ? "Izabrani datum je prošao." : !imageVerified ? "Najpre proveri da je vizuelni fajl učitan i označen kao spreman." : "Aktiviraj javnu objavu ili zakazani termin."} onClick={() => void runPublish()}>
                  <AdminIcon name="check" size={15} /> Objavi / zakaži
                </button>
              </>
            )}
          </div>
          {message && <p className={messageIsError ? "editor-disclaimer is-error" : "editor-disclaimer"} role={messageIsError ? "alert" : "status"}>{message}</p>}
          <p className="editor-disclaimer">
            {selected.status === "Zakazano"
              ? "Promene teksta i odgovora čuvaju postojeći termin. Vizuelna pitanja proveri u prikazu slike."
              : "Pitanje se objavljuje tek posle tvoje potvrde. Termin je 08:00 po vremenu Beograda; vizuelna pitanja moraju imati učitan fajl."}
          </p>
        </section>
      </div>
    </>
  )
}
