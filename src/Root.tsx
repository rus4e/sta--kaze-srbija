import App from "./App"
import { AdminAccessGate } from "./admin/AdminAccessGate"
import { AdminApp } from "./admin/AdminApp"
import { UserAccessPage } from "./public/UserAccessPage"
import {
  getSerbianScriptPreference,
  SerbianScriptProvider,
} from "./lib/serbianScript"

export default function Root() {
  const pathname = window.location.pathname.replace(/\/+$/, "")
  const isEditorialRoute = pathname.endsWith("/redakcija")
  const isUserAccessRoute = pathname.endsWith("/prijava")
  const script = getSerbianScriptPreference()

  document.documentElement.lang = isEditorialRoute
    ? "sr-Latn"
    : script === "cyrillic"
      ? "sr-Cyrl"
      : "sr-Latn"

  if (isEditorialRoute) {
    return (
      <AdminAccessGate>
        <AdminApp />
      </AdminAccessGate>
    )
  }

  return (
    <SerbianScriptProvider>
      {isUserAccessRoute ? <UserAccessPage /> : <App />}
    </SerbianScriptProvider>
  )
}
