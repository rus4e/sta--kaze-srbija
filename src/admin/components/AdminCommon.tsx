import type { ReactNode } from "react"
import type { EditorialStatus } from "../types"

export function DemoBadge({ children = "DEMO" }: { children?: ReactNode }) {
  return <span className="admin-demo-badge">{children}</span>
}

export function StatusBadge({ status }: { status: EditorialStatus }) {
  const slug = status
    .toLocaleLowerCase("sr-Latn-RS")
    .replace(/ /g, "-")
    .replace(/č/g, "c")
  return <span className={`admin-status admin-status--${slug}`}>{status}</span>
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="admin-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}

export function PlannedAction({
  children,
  onClick,
  primary = false,
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      className={`admin-action ${primary ? "admin-action--primary" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
