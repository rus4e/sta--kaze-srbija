import App from "./App"
import { AdminApp } from "./admin/AdminApp"

export default function Root() {
  const isEditorialRoute = window.location.pathname
    .replace(/\/+$/, "")
    .endsWith("/redakcija")

  return isEditorialRoute ? <AdminApp /> : <App />
}
