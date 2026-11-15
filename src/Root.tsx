import App from "./App"
import { AdminAccessGate } from "./admin/AdminAccessGate"
import { AdminApp } from "./admin/AdminApp"

export default function Root() {
  const isEditorialRoute = window.location.pathname
    .replace(/\/+$/, "")
    .endsWith("/redakcija")

  return isEditorialRoute ? (
    <AdminAccessGate>
      <AdminApp />
    </AdminAccessGate>
  ) : (
    <App />
  )
}
