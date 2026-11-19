import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getAnonymousVoterKey,
  getBoundAccountId,
  getStoredVoteChoices,
  resetLocalGuestProfile,
  setBoundAccountId,
  storeVoteChoices,
} from "../lib/anonymousVoter"
import { getGuestNickname, storeGuestNickname } from "../lib/guestProfile"

type LinkProfileResponse = {
  ok?: boolean
  reason?: string
  nickname?: string
  linked_votes?: number
}

type VoteHistoryRow = {
  question_id?: unknown
  option_id?: unknown
}

export async function syncGuestProfileToAccount(
  client: SupabaseClient,
  userId: string,
): Promise<{ nickname: string; voteCount: number }> {
  const previousUserId = getBoundAccountId()
  if (previousUserId && previousUserId !== userId) {
    resetLocalGuestProfile()
  }

  const voterKey = getAnonymousVoterKey()
  const localNickname = getGuestNickname()
  const { data: linkData, error: linkError } = await client.rpc(
    "link_guest_profile",
    { p_voter_key: voterKey, p_nickname: localNickname },
  )

  if (linkError) throw linkError
  const link = linkData as LinkProfileResponse | null
  if (!link?.ok) {
    throw new Error(link?.reason ?? "Profil nije mogao da se poveže sa nalogom.")
  }

  const nickname =
    typeof link.nickname === "string" && link.nickname.trim()
      ? link.nickname.trim()
      : localNickname
  storeGuestNickname(nickname)

  const { data: historyData, error: historyError } = await client.rpc(
    "get_my_vote_history",
  )
  if (historyError) throw historyError

  const remoteChoices = Object.fromEntries(
    ((historyData ?? []) as VoteHistoryRow[])
      .filter(
        (row) =>
          typeof row.question_id === "string" &&
          typeof row.option_id === "string",
      )
      .map((row) => [row.question_id as string, row.option_id as string]),
  )
  const mergedChoices = { ...getStoredVoteChoices(), ...remoteChoices }
  storeVoteChoices(mergedChoices)
  setBoundAccountId(userId)

  return { nickname, voteCount: Object.keys(mergedChoices).length }
}
