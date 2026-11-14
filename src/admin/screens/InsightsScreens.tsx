import { useState } from "react"
import { demoActivities } from "../demoData"
import { AdminPageHeader, DemoBadge } from "../components/AdminCommon"
import { AdminIcon } from "../components/AdminIcon"

export function AnalyticsScreen() {
  const demoBars = [
    ["Društvo", 82],
    ["Život", 68],
    ["Kultura", 54],
    ["Posao", 47],
    ["Navike", 39],
  ]
  return (
    <>
      <AdminPageHeader
        eyebrow="STRUKTURA BUDUĆIH IZVEŠTAJA"
        title="Analitika"
        description="Primer izgleda analitičkog modula. Nijedan broj nije stvaran glas korisnika."
        action={<DemoBadge>100% DEMONSTRACIONO</DemoBadge>}
      />
      <div className="analytics-warning">
        <AdminIcon name="warning" />
        <div>
          <strong>Ovo nisu stvarni rezultati glasanja</strong>
          <p>
            Vrednosti ispod služe isključivo za pregled strukture interfejsa i
            ne predstavljaju stavove građana Srbije.
          </p>
        </div>
      </div>
      <section className="admin-stat-grid analytics-stats">
        {[
          ["Demo učesnici", "—"],
          ["Demo glasovi", "—"],
          ["Prosečan odziv", "—"],
          ["Aktivna pitanja", "—"],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Nema povezanih podataka</small>
          </article>
        ))}
      </section>
      <div className="admin-two-columns">
        <section className="admin-panel">
          <div className="admin-section-title">
            <div>
              <span>PRIMER GRAFIKA</span>
              <h2>Interesovanje po kategoriji</h2>
            </div>
            <DemoBadge>DEMO</DemoBadge>
          </div>
          <div className="demo-chart">
            {demoBars.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
                <b>{value}</b>
              </div>
            ))}
          </div>
          <p className="chart-note">
            Brojevi su proizvoljni primeri za proveru rasporeda.
          </p>
        </section>
        <section className="admin-panel">
          <div className="admin-section-title">
            <div>
              <span>BUDUĆI IZVEŠTAJ</span>
              <h2>Najuspešnija pitanja</h2>
            </div>
            <DemoBadge>BEZ PODATAKA</DemoBadge>
          </div>
          <div className="empty-report">
            <AdminIcon name="chart" size={31} />
            <h3>Stvarni glasovi nisu povezani</h3>
            <p>
              Rangiranje će biti dostupno tek kada se u Fazi 3 potvrdi postojeća
              struktura baze.
            </p>
          </div>
        </section>
      </div>
      <section className="admin-panel methodology">
        <span>METODOLOŠKA NAPOMENA</span>
        <h2>Od odziva do odgovornog tumačenja</h2>
        <p>
          Buduća analitika mora razlikovati broj glasova, broj jedinstvenih
          učesnika i reprezentativnost uzorka. Mali uzorak će biti jasno
          označen, a rezultati se neće predstavljati kao stav cele Srbije bez
          odgovarajuće metodologije.
        </p>
      </section>
    </>
  )
}

export function ActivityScreen() {
  const [filter, setFilter] = useState("Sve aktivnosti")
  const visibleActivities = demoActivities.filter((activity) => {
    if (filter === "AI predlozi") return activity.actor === "AI predlog"
    if (filter === "Uredničke izmene")
      return activity.actor === "Urednik" && activity.action.includes("izmenio")
    if (filter === "Odluke")
      return (
        activity.action.includes("odobrio") || activity.action.includes("odbio")
      )
    return true
  })
  return (
    <>
      <AdminPageHeader
        eyebrow="UREĐIVAČKI TRAG"
        title="Istorija aktivnosti"
        description="Demonstracioni pregled predloga, izmena i odluka urednika."
        action={<DemoBadge>LOKALNI DEMO ZAPISI</DemoBadge>}
      />
      <section className="admin-panel activity-full">
        <div className="activity-filter">
          {["Sve aktivnosti", "AI predlozi", "Uredničke izmene", "Odluke"].map(
            (item) => (
              <button
                className={filter === item ? "active" : ""}
                key={item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <div className="activity-timeline">
          {visibleActivities.map((activity, index) => (
            <article key={activity.id}>
              <div
                className={`timeline-icon ${
                  activity.actor === "Urednik" ? "human" : ""
                }`}
              >
                <AdminIcon
                  name={activity.actor === "Urednik" ? "edit" : "spark"}
                  size={15}
                />
              </div>
              <div>
                <span>{activity.actor}</span>
                <h2>{activity.action}</h2>
                <p>{activity.target}</p>
                <small>{activity.time}</small>
              </div>
              <DemoBadge>DEMO ZAPIS {index + 1}</DemoBadge>
            </article>
          ))}
          {!visibleActivities.length && (
            <div className="empty-report">
              <AdminIcon name="history" size={28} />
              <h3>Nema aktivnosti u ovom filteru</h3>
              <p>Demonstracioni skup nema odgovarajuće zapise.</p>
            </div>
          )}
        </div>
      </section>
      <div className="admin-alert">
        <AdminIcon name="history" />
        <p>
          <strong>Trajna istorija nije implementirana.</strong> Ovi zapisi nisu
          učitani iz baze. U Fazi 3 treba prvo proveriti postojeću šemu i
          pravila pristupa.
        </p>
      </div>
    </>
  )
}
