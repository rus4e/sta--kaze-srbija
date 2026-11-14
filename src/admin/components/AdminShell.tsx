import { useState, type ReactNode } from "react"
import type { AdminScreen } from "../types"
import { AdminIcon } from "./AdminIcon"

interface AdminNavItem {
  id: AdminScreen
  label: string
  icon: string
}

const nav: AdminNavItem[] = [
  { id: "dashboard", label: "Kontrolna tabla", icon: "dashboard" },
  { id: "weekly", label: "Nedeljni plan", icon: "plan" },
  { id: "generator", label: "Generator pitanja", icon: "spark" },
  { id: "research", label: "Istraživanje tema", icon: "search" },
  { id: "studio", label: "Vizuelni studio", icon: "image" },
  { id: "review", label: "Urednički pregled", icon: "review" },
  { id: "calendar", label: "Kalendar", icon: "calendar" },
  { id: "analytics", label: "Analitika", icon: "chart" },
  { id: "activity", label: "Istorija aktivnosti", icon: "history" },
]

export function AdminShell({
  screen,
  setScreen,
  children,
}: {
  screen: AdminScreen
  setScreen: (screen: AdminScreen) => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const changeScreen = (next: AdminScreen) => {
    setScreen(next)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-brand">
          <img src="/sta-kaze-srbija-logo.png" alt="Šta kaže Srbija?" />
          <div>
            <strong>AI Redakcija</strong>
            <span>Urednički centar</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Zatvori meni">
            <AdminIcon name="close" />
          </button>
        </div>
        <nav>
          {nav.map((item) => (
            <button
              className={screen === item.id ? "active" : ""}
              key={item.id}
              onClick={() => changeScreen(item.id)}
            >
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-note">
          <span>FAZA 2 · DEMO</span>
          <p>
            Bez AI, baze i autentifikacije. Nijedna akcija ne objavljuje
            sadržaj.
          </p>
        </div>
        <a className="admin-back" href="./">
          <span>←</span> Nazad na javnu aplikaciju
        </a>
      </aside>
      {open && (
        <button
          className="admin-sidebar-scrim"
          onClick={() => setOpen(false)}
          aria-label="Zatvori meni"
        />
      )}
      <div className="admin-workspace">
        <div className="admin-mobile-bar">
          <button onClick={() => setOpen(true)} aria-label="Otvori meni">
            <AdminIcon name="menu" />
          </button>
          <img src="/sta-kaze-srbija-logo.png" alt="Šta kaže Srbija?" />
          <strong>AI Redakcija</strong>
        </div>
        <div className="admin-warning">
          <AdminIcon name="warning" size={17} />
          <p>
            <strong>Demonstracioni interfejs.</strong> Ruta nije autentifikovana
            i nije povezana sa Supabase bazom ili AI servisom.
          </p>
        </div>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}
