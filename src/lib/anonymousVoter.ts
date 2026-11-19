const VOTER_KEY_STORAGE = "sta-kaze-srbija:voter-key"
const VOTE_CHOICES_STORAGE = "sta-kaze-srbija:vote-choices"
const BOUND_USER_STORAGE = "sta-kaze-srbija:bound-user-id"
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getAnonymousVoterKey(): string {
  const existing = window.localStorage.getItem(VOTER_KEY_STORAGE)
  if (existing && UUID_PATTERN.test(existing)) return existing

  const voterKey = window.crypto.randomUUID()
  window.localStorage.setItem(VOTER_KEY_STORAGE, voterKey)
  return voterKey
}

export function getStoredVoteChoices(): Record<string, string> {
  try {
    const stored = window.localStorage.getItem(VOTE_CHOICES_STORAGE)
    if (!stored) return {}

    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([questionId, optionId]) =>
          UUID_PATTERN.test(questionId) &&
          typeof optionId === "string" &&
          UUID_PATTERN.test(optionId),
      ),
    )
  } catch {
    return {}
  }
}

export function storeVoteChoice(questionId: string, optionId: string): void {
  const choices = getStoredVoteChoices()
  choices[questionId] = optionId
  storeVoteChoices(choices)
}

export function storeVoteChoices(choices: Record<string, string>): void {
  const safeChoices = Object.fromEntries(
    Object.entries(choices).filter(
      ([questionId, optionId]) =>
        UUID_PATTERN.test(questionId) &&
        typeof optionId === "string" &&
        UUID_PATTERN.test(optionId),
    ),
  )
  window.localStorage.setItem(VOTE_CHOICES_STORAGE, JSON.stringify(safeChoices))
}

export function getBoundAccountId(): string | null {
  return window.localStorage.getItem(BOUND_USER_STORAGE)
}

export function setBoundAccountId(userId: string): void {
  window.localStorage.setItem(BOUND_USER_STORAGE, userId)
}

export function resetLocalGuestProfile(): void {
  window.localStorage.removeItem(VOTER_KEY_STORAGE)
  window.localStorage.removeItem(VOTE_CHOICES_STORAGE)
  window.localStorage.removeItem(BOUND_USER_STORAGE)
  window.localStorage.removeItem("sta-kaze-srbija:nickname")
}
