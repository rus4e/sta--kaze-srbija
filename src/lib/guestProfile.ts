const NICKNAME_STORAGE = "sta-kaze-srbija:nickname"

const NICKNAME_PARTS = [
  "Čaršijski detektiv",
  "Dežurni meraklija",
  "Komšijski mudrac",
  "Majstor procene",
  "Svedok sa astala",
  "Čuvar poslednje sarme",
  "Pitanjski hroničar",
  "Kafanski diplomata",
] as const

export type ParticipationRank = {
  level: number
  title: string
  nextTitle: string | null
  votesToNext: number
  progress: number
}

const RANKS = [
  { level: 1, minVotes: 0, title: "Gost sa praga" },
  { level: 2, minVotes: 5, title: "Komšija od reči" },
  { level: 3, minVotes: 20, title: "Redovni za astalom" },
  { level: 4, minVotes: 50, title: "Čaršijski hroničar" },
  { level: 5, minVotes: 100, title: "Kafanski analitičar" },
  { level: 6, minVotes: 200, title: "Mudrac sa klupe" },
  { level: 7, minVotes: 400, title: "Vojvoda od klikova" },
  { level: 8, minVotes: 700, title: "Legenda čaršijskog glasanja" },
] as const

function createNickname(): string {
  const index = Math.floor(Math.random() * NICKNAME_PARTS.length)
  const suffix = Math.floor(10 + Math.random() * 90)
  return NICKNAME_PARTS[index] + " " + suffix
}

export function getGuestNickname(): string {
  const existing = window.localStorage.getItem(NICKNAME_STORAGE)?.trim()
  if (existing && existing.length <= 48) return existing

  const nickname = createNickname()
  window.localStorage.setItem(NICKNAME_STORAGE, nickname)
  return nickname
}

export function storeGuestNickname(nickname: string): void {
  const normalized = nickname.trim().slice(0, 48)
  if (normalized) window.localStorage.setItem(NICKNAME_STORAGE, normalized)
}

export function getParticipationRank(voteCount: number): ParticipationRank {
  const count = Math.max(0, Math.floor(voteCount))
  let currentIndex = 0
  for (let index = 1; index < RANKS.length; index += 1) {
    if (count < RANKS[index].minVotes) break
    currentIndex = index
  }

  const current = RANKS[currentIndex]
  const next = RANKS[currentIndex + 1]
  const votesToNext = next ? Math.max(0, next.minVotes - count) : 0
  const span = next ? next.minVotes - current.minVotes : 1
  const progress = next
    ? Math.min(100, Math.round(((count - current.minVotes) / span) * 100))
    : 100

  return {
    level: current.level,
    title: current.title,
    nextTitle: next?.title ?? null,
    votesToNext,
    progress,
  }
}
