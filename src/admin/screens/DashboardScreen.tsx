import { demoActivities } from "../demoData"
import type { DemoPackage, DemoQuestion } from "../types"
import {
  AdminPageHeader,
  DemoBadge,
  StatusBadge,
} from "../components/AdminCommon"
import { AdminIcon } from "../components/AdminIcon"

export function DashboardScreen({
  packages,
  questions,
  onOpenWeekly,
  onOpenReview,
}: {
  packages: DemoPackage[]
  questions: DemoQuestion[]
  onOpenWeekly: () => void
  onOpenReview: () => void
}) {
  const count = (status: string) =>
    questions.filter((question) => question.status === status).length
  const stats = [
    ["Pripremljeno ove nedelje", questions.length, "35 planirano"],
    ["Čeka potvrdu", count("Čeka proveru"), "Ručna odluka"],
    ["Odobreno", count("Odobreno"), "Spremno za plan"],
    ["Zakazano", count("Zakazano"), "Europe/Belgrade"],
    ["Objavljeno", count("Objavljeno"), "Demo evidencija"],
    ["Odbijeno", count("Odbijeno"), "Sačuvano u istoriji"],
  ]

  return (
    <>
      <AdminPageHeader
        eyebrow="NEDELJA U REDAKCIJI"
        title="Kontrolna tabla"
        description="Pregled pripreme, uredničkih odluka i spremnosti paketa."
        action={<DemoBadge>DEMONSTRACIONI PODACI</DemoBadge>}
      />
      <section className="admin-stat-grid">
        {stats.map(([label, value, note], index) => (
          <article className={index === 1 ? "is-priority" : ""} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <section className="admin-panel admin-readiness">
        <div className="admin-section-title">
          <div>
            <span>STATUS PRIPREME</span>
            <h2>Narednih sedam dana</h2>
          </div>
          <button onClick={onOpenWeekly}>
            Otvori plan <AdminIcon name="arrow" size={15} />
          </button>
        </div>
        <div className="readiness-row">
          {packages.map((pack) => {
            const ready = pack.questions.filter((question) =>
              ["Odobreno", "Zakazano"].includes(question.status),
            ).length
            return (
              <button key={pack.id} onClick={onOpenWeekly}>
                <span>{pack.day.slice(0, 3)}</span>
                <div
                  className="readiness-ring"
                  style={
                    {
                      "--progress": `${ready * 20 * 3.6}deg`,
                    } as React.CSSProperties
                  }
                >
                  <i>{ready}/5</i>
                </div>
                <small>{ready === 5 ? "Spremno" : "U pripremi"}</small>
              </button>
            )
          })}
        </div>
        <div className="admin-alert">
          <AdminIcon name="warning" size={18} />
          <p>
            <strong>Nijedan paket se ne objavljuje automatski.</strong> Svih pet
            pitanja moraju biti ručno odobrena pre zakazivanja.
          </p>
        </div>
      </section>
      <div className="admin-two-columns">
        <section className="admin-panel">
          <div className="admin-section-title">
            <div>
              <span>DNEVNI PAKETI</span>
              <h2>Pregled nedelje</h2>
            </div>
          </div>
          <div className="package-mini-list">
            {packages.map((pack) => (
              <button key={pack.id} onClick={onOpenWeekly}>
                <span className="package-date">{pack.date}</span>
                <div>
                  <strong>{pack.day}</strong>
                  <small>5 pitanja · 3 + 1 + 1</small>
                </div>
                <StatusBadge
                  status={
                    pack.questions.every((q) =>
                      ["Odobreno", "Zakazano"].includes(q.status),
                    )
                      ? "Odobreno"
                      : "Čeka proveru"
                  }
                />
                <AdminIcon name="arrow" size={15} />
              </button>
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-section-title">
            <div>
              <span>TRAG PROMENA</span>
              <h2>Poslednja aktivnost</h2>
            </div>
            <button onClick={onOpenReview}>Pregledaj</button>
          </div>
          <div className="activity-list">
            {demoActivities.slice(0, 4).map((activity) => (
              <div key={activity.id}>
                <i className={activity.actor === "Urednik" ? "human" : ""}>
                  <AdminIcon
                    name={activity.actor === "Urednik" ? "edit" : "spark"}
                    size={14}
                  />
                </i>
                <p>
                  <strong>{activity.actor}</strong> {activity.action}
                  <span>{activity.target}</span>
                </p>
                <time>{activity.time}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
