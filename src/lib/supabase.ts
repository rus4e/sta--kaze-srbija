import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SupabaseConfigurationError"
  }
}

export function getSupabaseClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!url || !anonKey) {
    throw new SupabaseConfigurationError(
      "Supabase konfiguracija nedostaje. Podesite VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.",
    )
  }

  let projectUrl: URL
  try {
    projectUrl = new URL(url)
  } catch {
    throw new SupabaseConfigurationError(
      "VITE_SUPABASE_URL nije ispravan URL Supabase projekta.",
    )
  }

  if (
    projectUrl.protocol !== "https:" ||
    (projectUrl.pathname !== "" && projectUrl.pathname !== "/") ||
    projectUrl.search ||
    projectUrl.hash
  ) {
    throw new SupabaseConfigurationError(
      "VITE_SUPABASE_URL mora biti osnovni HTTPS URL projekta, bez /rest/v1 ili druge putanje.",
    )
  }

  if (!client) {
    client = createClient(projectUrl.origin, anonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  }

  return client
}
