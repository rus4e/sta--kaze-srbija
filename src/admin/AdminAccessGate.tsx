import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "../lib/supabase"
import "./admin-auth.css"

type AccessStatus = "checking" | "signed-out" | "owner" | "denied" | "error"

const AdminSignOutContext = createContext<(() => Promise<void>) | null>(null)

export function useAdminSignOut() {
  return useContext(AdminSignOutContext)
}

function isEditorialOwner(user: User | null): boolean {
  return user?.app_metadata?.editor_role === "owner"
}

export function AdminAccessGate({
  children,
}: {
  children: ReactNode
}) {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AccessStatus>("checking")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    let supabase: SupabaseClient

    try {
      supabase = getSupabaseClient()
      setClient(supabase)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Prijava trenutno nije podešena.",
      )
      setStatus("error")
      return () => {
        active = false
      }
    }

    const setAccess = (nextUser: User | null) => {
      setUser(nextUser)
      setStatus(
        !nextUser
          ? "signed-out"
          : isEditorialOwner(nextUser)
            ? "owner"
            : "denied",
      )
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setAccess(session?.user ?? null)
      setMessage("")
    })

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setMessage("Sesija nije mogla da se proveri. Osveži stranicu.")
          setStatus("error")
          return
        }
        setAccess(data.session?.user ?? null)
      })
      .catch(() => {
        if (!active) return
        setMessage("Sesija nije mogla da se proveri. Osveži stranicu.")
        setStatus("error")
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const requestSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!client || busy) return

    const normalizedEmail = email.trim().toLowerCase()
    setBusy(true)
    setMessage("")
    setSent(false)

    try {
      const { error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      })

      if (error) {
        setMessage(
          "Link nije poslat. Proveri adresu i podešavanja prijave za redakciju.",
        )
      } else {
        setSent(true)
      }
    } catch {
      setMessage("Link trenutno nije moguće poslati. Pokušaj ponovo.")
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    if (!client || busy) return
    setBusy(true)
    setMessage("")
    try {
      const { error } = await client.auth.signOut()
      if (error) setMessage("Odjava nije uspela. Pokušaj ponovo.")
    } catch {
      setMessage("Odjava nije uspela. Pokušaj ponovo.")
    } finally {
      setBusy(false)
    }
  }

  if (status === "owner" && isEditorialOwner(user)) {
    return (
      <AdminSignOutContext.Provider value={signOut}>
        {children}
      </AdminSignOutContext.Provider>
    )
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-auth-title">
        <div className="admin-auth-mark" aria-hidden="true">
          Š
        </div>
        <p className="admin-auth-eyebrow">ŠTA KAŽE SRBIJA?</p>
        <h1 id="admin-auth-title">
          {status === "denied" ? "Pristup nije odobren" : "Prijava za redakciju"}
        </h1>
        <p className="admin-auth-intro">
          Redakcija je dostupna samo vlasničkom nalogu. Prijavi se email
          linkom; javna registracija nije dostupna kroz ovu stranicu.
        </p>

        {status === "checking" && (
          <p className="admin-auth-message" role="status">
            Proveravam prijavu…
          </p>
        )}

        {status === "error" && (
          <p className="admin-auth-message is-error" role="alert">
            {message}
          </p>
        )}

        {status === "denied" && (
          <div className="admin-auth-denied">
            <p role="alert">
              Ovaj nalog nema vlasničko ovlašćenje za redakciju.
            </p>
            <button
              className="admin-auth-button"
              type="button"
              onClick={() => void signOut()}
              disabled={busy}
            >
              {busy ? "Odjavljujem…" : "Odjavi ovaj nalog"}
            </button>
            {message && (
              <p className="admin-auth-message is-error" role="alert">
                {message}
              </p>
            )}
          </div>
        )}

        {(status === "signed-out" ||
          (status === "error" && client !== null)) && (
          <form className="admin-auth-form" onSubmit={requestSignIn}>
            <label htmlFor="admin-owner-email">Email vlasničkog naloga</label>
            <input
              id="admin-owner-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ime@primer.rs"
            />
            <button
              className="admin-auth-button"
              type="submit"
              disabled={busy || !email.trim()}
            >
              {busy ? "Šaljem link…" : "Pošalji link za prijavu"}
            </button>
            {sent && (
              <p className="admin-auth-message" role="status">
                Ako postoji aktivan vlasnički nalog za unetu adresu, link za
                prijavu je poslat. Proveri i neželjenu poštu.
              </p>
            )}
            {message && status !== "error" && (
              <p className="admin-auth-message is-error" role="alert">
                {message}
              </p>
            )}
          </form>
        )}

        <a className="admin-auth-back" href={import.meta.env.BASE_URL}>
          ← Nazad na javnu aplikaciju
        </a>
      </section>
    </main>
  )
}