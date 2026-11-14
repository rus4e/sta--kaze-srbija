import { useState } from "react"
import {
  AdminPageHeader,
  DemoBadge,
  PlannedAction,
} from "../components/AdminCommon"
import { AdminIcon } from "../components/AdminIcon"

function DemoNotice({ text }: { text: string }) {
  return (
    <div className="inline-demo-notice">
      <DemoBadge>DEMO</DemoBadge>
      <p>{text}</p>
    </div>
  )
}

export function GeneratorScreen() {
  const [mode, setMode] = useState("Pojedinačno pitanje")
  const [notice, setNotice] = useState("")
  return (
    <>
      <AdminPageHeader
        eyebrow="AI POMOĆNIK · NIJE POVEZAN"
        title="Generator pitanja"
        description="Predviđen interfejs za pripremu pitanja. U ovoj fazi ne šalje AI zahteve."
        action={<DemoBadge>BEZ AI POZIVA</DemoBadge>}
      />
      <div className="generator-layout">
        <section className="admin-panel generator-form">
          <div className="generator-tabs">
            {["Pojedinačno pitanje", "Dnevni paket", "Cela nedelja"].map(
              (item) => (
                <button
                  className={mode === item ? "active" : ""}
                  key={item}
                  onClick={() => setMode(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <div className="form-grid">
            <label>
              Kategorija
              <select>
                <option>Sve kategorije</option>
                <option>Društvo</option>
                <option>Život</option>
                <option>Kultura</option>
                <option>Posao</option>
              </select>
            </label>
            <label>
              Tip pitanja
              <select>
                <option>Automatski izbor</option>
                <option>Tekstualno</option>
                <option>Ilustrovano</option>
                <option>Vizuelno</option>
              </select>
            </label>
            <label>
              Ton
              <select defaultValue="Balansiran">
                <option>Balansiran</option>
                <option>Ozbiljan</option>
                <option>Duhovit</option>
                <option>Svakodnevni</option>
              </select>
            </label>
            <label>
              Izvor inspiracije
              <select>
                <option>Večne i aktuelne teme</option>
                <option>Večne teme</option>
                <option>Aktuelne teme</option>
              </select>
            </label>
          </div>
          <label className="generator-context">
            Urednički kontekst
            <textarea placeholder="Dodatna smernica za temu, publiku ili ton..." />
          </label>
          <DemoNotice
            text={`${mode} bi se generisalo tek nakon povezivanja bezbednog serverskog AI servisa.`}
          />
          <PlannedAction
            primary
            onClick={() =>
              setNotice(
                "AI servis nije povezan. Nijedan zahtev nije poslat i sadržaj nije generisan.",
              )
            }
          >
            <AdminIcon name="spark" size={16} /> Pripremi predlog
          </PlannedAction>
          {notice && <p className="action-feedback">{notice}</p>}
        </section>
        <aside className="admin-panel quality-panel">
          <span>AUTOMATSKE PROVERE</span>
          <h2>Kontrola kvaliteta</h2>
          {[
            "Jasnoća i razumljivost",
            "Različiti i logični odgovori",
            "Moguća dvosmislenost",
            "Sličnost sa starim pitanjima",
            "Sugestivna formulacija",
            "Gramatika i ekavica",
            "Primerenost publici",
          ].map((item) => (
            <div key={item}>
              <i>
                <AdminIcon name="check" size={13} />
              </i>
              <span>{item}</span>
              <small>planirano</small>
            </div>
          ))}
          <p>
            Ove provere nisu aktivne dok AI servis i arhiva pitanja nisu
            povezani.
          </p>
        </aside>
      </div>
      <section className="admin-panel generated-placeholder">
        <AdminIcon name="spark" size={29} />
        <div>
          <span>PROSTOR ZA PREDLOG</span>
          <h2>Generisani sadržaj će se pojaviti ovde</h2>
          <p>
            Svaki predlog će prvo dobiti status „Predlog AI“ i nikada neće biti
            automatski odobren.
          </p>
        </div>
      </section>
    </>
  )
}

export function ResearchScreen() {
  const [filter, setFilter] = useState("Sve")
  const themes = [
    {
      type: "Večna tema",
      title: "Kako se menja komšijska solidarnost",
      summary:
        "Svakodnevni odnosi, poverenje i pomoć među ljudima u istom kraju.",
      source: "Bez spoljnog izvora · urednička inspiracija",
      verified: "Nije činjenica — tema za diskusiju",
    },
    {
      type: "Večna tema",
      title: "Granica između posla i privatnog vremena",
      summary:
        "Navike vezane za poruke, pozive i dostupnost nakon radnog vremena.",
      source: "Bez spoljnog izvora · urednička inspiracija",
      verified: "Nije činjenica — tema za diskusiju",
    },
    {
      type: "Aktuelna tema",
      title: "Primer teme zasnovane na javnoj raspravi",
      summary:
        "Demonstracioni prikaz mesta na kom bi se nalazio proveren sažetak događaja.",
      source: "DEMO · stvarni izvor nije povezan",
      verified: "Nepotvrđeno — ne koristiti kao činjenicu",
    },
    {
      type: "Aktuelna tema",
      title: "Primer institucionalne objave",
      summary:
        "Ovde bi se prikazali datum, kontekst, institucija i direktan link.",
      source: "DEMO · nema stvarnog linka",
      verified: "Čeka proveru izvora",
    },
  ]
  return (
    <>
      <AdminPageHeader
        eyebrow="VEČNE + AKTUELNE TEME"
        title="Istraživanje tema"
        description="Urednički prostor za proverene izvore i ideje iz svakodnevnog života u Srbiji."
        action={<DemoBadge>IZVORI NISU POVEZANI</DemoBadge>}
      />
      <div className="research-filters">
        {["Sve", "Večna tema", "Aktuelna tema"].map((item) => (
          <button
            className={filter === item ? "active" : ""}
            key={item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="research-grid">
        {themes
          .filter((theme) => filter === "Sve" || theme.type === filter)
          .map((theme, index) => (
            <article
              key={theme.title}
              className={theme.type === "Aktuelna tema" ? "current" : ""}
            >
              <header>
                <span>{theme.type}</span>
                <DemoBadge>DEMO {String(index + 1).padStart(2, "0")}</DemoBadge>
              </header>
              <h2>{theme.title}</h2>
              <p>{theme.summary}</p>
              <dl>
                <div>
                  <dt>Izvor i datum</dt>
                  <dd>{theme.source}</dd>
                </div>
                <div>
                  <dt>Procena provere</dt>
                  <dd className="verification">
                    <AdminIcon name="warning" size={13} />
                    {theme.verified}
                  </dd>
                </div>
              </dl>
              <div className="research-proposal">
                <span>PREDLOG PITANJA</span>
                <p>Kako biste vi formulisali stav o ovoj temi?</p>
              </div>
              <button disabled>Originalni izvor nije dostupan</button>
            </article>
          ))}
      </div>
    </>
  )
}

export function VisualStudioScreen() {
  const [notice, setNotice] = useState("")
  const cards = [
    [
      "Ilustrovano pitanje",
      "Kako izgleda idealna pauza na poslu?",
      "Skica ilustracije",
    ],
    [
      "Vizuelno pitanje",
      "Koji javni prostor deluje najprijatnije?",
      "Mreža fotografija",
    ],
    [
      "Ilustrovano pitanje",
      "Šta za vas simbolizuje gostoprimstvo?",
      "Stilska ilustracija",
    ],
  ]
  return (
    <>
      <AdminPageHeader
        eyebrow="ILUSTRACIJE I VIZUELNA PITANJA"
        title="Vizuelni studio"
        description="Pregled predviđenih vizuelnih materijala pre uredničkog odobravanja."
        action={<DemoBadge>BEZ GENERISANJA SLIKA</DemoBadge>}
      />
      <DemoNotice text="Prikazane površine su placeholderi, ne generisane ilustracije. Nijedan servis za slike nije povezan." />
      <div className="studio-grid">
        {cards.map((card, index) => (
          <article key={card[1]}>
            <div className={`studio-canvas motif-${index + 1}`}>
              <div className="studio-pattern" />
              <span>
                <AdminIcon name="image" size={26} />
                {card[2]}
              </span>
              <DemoBadge>PLACEHOLDER</DemoBadge>
            </div>
            <div className="studio-card-content">
              <span>{card[0]}</span>
              <h2>{card[1]}</h2>
              <p>
                Čitljivo na mobilnom · bez teksta u slici · ne otkriva odgovor
              </p>
              <div>
                <button
                  onClick={() =>
                    setNotice(
                      "Zamena materijala je predviđena nakon povezivanja skladišta.",
                    )
                  }
                >
                  Zameni
                </button>
                <button
                  onClick={() =>
                    setNotice(
                      "Regenerisanje nije aktivno bez serverskog AI servisa.",
                    )
                  }
                >
                  <AdminIcon name="spark" size={14} /> Regeneriši
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {notice && <p className="action-feedback studio-feedback">{notice}</p>}
    </>
  )
}
