import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "../lib/supabase"
import { ScriptToggle } from "../lib/serbianScript"
import { resetLocalGuestProfile } from "../lib/anonymousVoter"
import { syncGuestProfileToAccount } from "../data/userProfile"
import "../admin/admin-auth.css"

type SignInStatus = "checking" | "signed-out" | "signed-in" | "error"

export function UserAccessPage() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<SignInStatus>("checking")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncFailed, setSyncFailed] = useState(false)
  const [syncRetryVersion, setSyncRetryVersion] = useState(0)
  const [message, setMessage] = useState("")
  const syncStartedFor = useRef<string | null>(null)

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

  useEffect(() => {
    if (status !== "signed-in" || !client || !user || syncStartedFor.current === user.id) return
    let active = true
    syncStartedFor.current = user.id
    setSyncing(true)
    setSyncFailed(false)
    setMessage("")

    void syncGuestProfileToAccount(client, user.id)
      .then(() => {
        if (!active) return
        window.location.replace(import.meta.env.BASE_URL)
      })
      .catch(() => {
        if (!active) return
        syncStartedFor.current = null
        setSyncFailed(true)
        setMessage("Prijava je uspela, ali povezivanje glasova još nije dostupno. Tvoji odgovori ostaju na ovom uređaju.")
      })
      .finally(() => {
        if (active) setSyncing(false)
      })

    return () => { active = false }
  }, [status, client, user, syncRetryVersion])

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
      else {
        resetLocalGuestProfile()
        window.location.replace(import.meta.env.BASE_URL)
      }
    } catch {
      setMessage("Odjava nije uspela. Pokušaj ponovo.")
    } finally {
      setBusy(false)
    }
  }

  const requestOAuthSignIn = async (provider: "google" | "facebook") => {
    if (!client || busy) return
    setBusy(true)
    setMessage("")
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + window.location.pathname },
      })
      if (error) {
        setMessage("Ova prijava još nije uključena u podešavanjima portala. Možeš da nastaviš mejlom.")
      }
    } catch {
      setMessage("Prijava trenutno nije dostupna. Pokušaj mejlom.")
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
        <h1 id="user-auth-title">Prijava i registracija</h1>
        <p className="admin-auth-intro">
          Nastavi mejlom, Google-om ili Facebook-om. Prvi put? Nalog se pravi
          automatski, a tvoji anonimni odgovori povezuju se sa njim.
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
              {syncing ? "Povezujem tvoj profil i dosadašnje glasove sa nalogom…" : <>Prijavljen si kao <strong>{user.email}</strong>.</>}
            </p>
            <p className="admin-auth-intro">
              Posle povezivanja, nadimak, titula i istorija glasanja biće dostupni
              kada se prijaviš na drugom uređaju.
            </p>
            {syncFailed && (
              <button
                className="admin-auth-button"
                type="button"
                onClick={() => setSyncRetryVersion((current) => current + 1)}
                disabled={syncing}
              >
                Pokušaj ponovo povezivanje
              </button>
            )}
            <button
              className="admin-auth-button"
              type="button"
              onClick={() => void signOut()}
              disabled={busy || syncing}
            >
              {busy ? "Odjavljujem…" : "Odjavi se"}
            </button>
            {message && <p className="admin-auth-message is-error" role="alert">{message}</p>}
          </div>
        )}

        {(status === "signed-out" || (status === "error" && client !== null)) && (
          <>
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
                {busy ? "Šaljem link…" : "Nastavi mejlom"}
              </button>
              {sent && (
                <p className="admin-auth-message" role="status">
                  Link je poslat. Proveri pristiglu poštu i neželjenu poštu.
                </p>
              )}
            </form>
            <div className="public-auth-divider"><span>ili nastavi preko</span></div>
            <div className="public-auth-provider-buttons">
              <button className="public-auth-provider-button" type="button" onClick={() => void requestOAuthSignIn("google")} disabled={busy}>
                Nastavi preko Google-a
              </button>
              <button className="public-auth-provider-button" type="button" onClick={() => void requestOAuthSignIn("facebook")} disabled={busy}>
                Nastavi preko Facebook-a
              </button>
            </div>
            {message && status !== "error" && (
              <p className="admin-auth-message is-error" role="alert">{message}</p>
            )}
          </>
        )}

        <a className="admin-auth-back" href={baseUrl}>← Nazad na portal</a>
        <a className="admin-auth-back public-auth-editorial-link" href={baseUrl + "redakcija"}>
          Ulaz u redakciju vlasnika
        </a>
      </section>
    </main>
  )
}
