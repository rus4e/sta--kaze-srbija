import {
  useEffect,
  useState,
  type FormEvent,
} from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "../lib/supabase"
import { ScriptToggle } from "../lib/serbianScript"
import "../admin/admin-auth.css"

type SignInStatus = "checking" | "signed-out" | "signed-in" | "error"

export function UserAccessPage() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<SignInStatus>("checking")
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
      setMessage(error instanceof Error ? error.message : "Prijava trenutno nije podešena.")
      setStatus("error")
      return () => { active = false }
    }

    const setAccess = (nextUser: User | null) => {
      setUser(nextUser)
      setStatus(nextUser ? "signed-in" : "signed-out")
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setAccess(session?.user ?? null)
      setMessage("")
    })

    void supabase.auth.getSession()
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
    const redirectUrl = window.location.origin + window.location.pathname
    setBusy(true)
    setMessage("")
    setSent(false)

    try {
      const { error } = await client.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        setMessage(
          "Link nije poslat. Proveri adresu i dozvoljenu adresu za povratak u Supabase Auth podešavanjima.",
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

  const baseUrl = import.meta.env.BASE_URL

  return (
    <main className="admin-auth-page public-user-auth-page">
      <section className="admin-auth-card" aria-labelledby="user-auth-title">
        <div className="public-auth-heading">
          <img
            className="public-auth-logo"
            src={baseUrl + "sta-kaze-srbija-logo.png"}
            alt="Šta kaže Srbija?"
          />
          <ScriptToggle />
        </div>
        <p className="admin-auth-eyebrow">ŠTA KAŽE SRBIJA?</p>
        <h1 id="user-auth-title">Prijava korisnika</h1>
        <p className="admin-auth-intro">
          Prijavi se email linkom, bez lozinke. Ako prvi put dolaziš, potvrda
          emaila otvoriće ti nalog.
        </p>

        {status === "checking" && (
          <p className="admin-auth-message" role="status">Proveravam prijavu…</p>
        )}

        {status === "error" && (
          <p className="admin-auth-message is-error" role="alert">{message}</p>
        )}

        {status === "signed-in" && user && (
          <div className="public-auth-signed-in">
            <p className="admin-auth-message" role="status">
              Prijavljen si kao <strong>{user.email}</strong>.
            </p>
            <p className="admin-auth-intro">
              U ovoj verziji glasovi i sačuvana pitanja ostaju u ovom
              pregledaču. Prijava služi za pristup nalogu dok povezivanje
              profila ne bude uključeno.
            </p>
            <button
              className="admin-auth-button"
              type="button"
              onClick={() => void signOut()}
              disabled={busy}
            >
              {busy ? "Odjavljujem…" : "Odjavi se"}
            </button>
            {message && <p className="admin-auth-message is-error" role="alert">{message}</p>}
          </div>
        )}

        {(status === "signed-out" || (status === "error" && client !== null)) && (
          <form className="admin-auth-form" onSubmit={requestSignIn}>
            <label htmlFor="user-email">Email adresa</label>
            <input
              id="user-email"
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
                Link je poslat. Proveri pristiglu poštu i neželjenu poštu.
              </p>
            )}
            {message && status !== "error" && (
              <p className="admin-auth-message is-error" role="alert">{message}</p>
            )}
          </form>
        )}

        <a className="admin-auth-back" href={baseUrl}>← Nazad na portal</a>
        <a className="admin-auth-back public-auth-editorial-link" href={baseUrl + "redakcija"}>
          Ulaz u redakciju vlasnika
        </a>
      </section>
    </main>
  )
}
