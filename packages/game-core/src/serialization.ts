import { assertBoard, getWinningPlayer, isBoardFull } from "./board.js";
import { assertEventSequence } from "./events.js";
import { createMatchFromState, type MatchEngine } from "./match.js";
import type { GameEvent, MatchSnapshot, MatchState, PlayerId, RandomSource } from "./types.js";
const PLAYER_IDS: readonly string[] = ["player-1", "player-2"];
const STATUSES: readonly string[] = ["ready", "dice", "countdown", "rally", "resolving", "completed"];

export function serializeMatch(state: MatchState, events: readonly GameEvent[] = []): string {
  validateMatchState(state);
  assertEventSequence(events);
  return JSON.stringify({ state, eventSequence: events.length } satisfies MatchSnapshot);
}

export function restoreMatch(serialized: string): MatchSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new TypeError("Serialized match is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || !("state" in parsed) || !("eventSequence" in parsed)) {
    throw new TypeError("Invalid match snapshot envelope.");
  }
  const snapshot = parsed as MatchSnapshot;
  validateMatchState(snapshot.state);
  if (!Number.isInteger(snapshot.eventSequence) || snapshot.eventSequence < 0) {
    throw new TypeError("Invalid event sequence.");
  }
  return { state: snapshot.state, eventSequence: snapshot.eventSequence };
}

export function restoreMatchEngine(serialized: string, random: RandomSource): MatchEngine {
  const snapshot = restoreMatch(serialized);
  return createMatchFromState(snapshot.state, random);
}

export function validateMatchState(state: MatchState): void {
  if (!state || state.schemaVersion !== 1 || typeof state.matchId !== "string" || !state.matchId) {
    throw new TypeError("Invalid match identity or schema version.");
  }
  if (!STATUSES.includes(state.status) || !PLAYER_IDS.includes(state.server)) {
    throw new TypeError("Invalid match status or server.");
  }
  assertBoard(state.board);
  if (!Array.isArray(state.players) || state.players.length !== 2 ||
      state.players[0]?.id !== "player-1" || state.players[1]?.id !== "player-2") {
    throw new TypeError("Match must contain player-1 and player-2.");
  }
  for (const player of state.players) {
    if (typeof player.displayName !== "string" || !Number.isInteger(player.ralliesWon) || player.ralliesWon < 0) {
      throw new TypeError("Invalid player record.");
    }
  }
  if (!Number.isInteger(state.rallyCount) || state.rallyCount < 0 ||
      !Number.isInteger(state.revision) || state.revision < 0) {
    throw new TypeError("Invalid match counters.");
  }
  if (state.winner !== null && !PLAYER_IDS.includes(state.winner)) throw new TypeError("Invalid winner.");
  if (typeof state.draw !== "boolean") throw new TypeError("Invalid draw flag.");
  if (state.activeRally) {
    const rally = state.activeRally;
    if (!Number.isInteger(rally.id) || rally.id < 1 ||
        !PLAYER_IDS.includes(rally.server) || !PLAYER_IDS.includes(rally.receiver) ||
        rally.server === rally.receiver || !Number.isInteger(rally.target) ||
        rally.target < 0 || rally.target > 8 || !Number.isFinite(rally.startedAt)) {
      throw new TypeError("Invalid active rally.");
    }
    if (state.board[rally.target] !== null && rally.completedAt === null) {
      throw new TypeError("Active rally target is already owned.");
    }
    if (rally.completedAt !== null && (!Number.isFinite(rally.completedAt) || rally.completedAt < rally.startedAt)) {
      throw new TypeError("Invalid rally completion timestamp.");
    }
    if (rally.completedAt === null && (rally.result !== null || rally.nextServer !== null)) {
      throw new TypeError("Incomplete rallies cannot contain a result or next server.");
    }
    if (rally.completedAt !== null && (!rally.result || !PLAYER_IDS.includes(rally.nextServer ?? ""))) {
      throw new TypeError("Completed rallies require a result and next server.");
    }
    if (rally.result?.kind === "win" && rally.nextServer !== rally.result.loser) {
      throw new TypeError("Next server must be the losing player.");
    }
    if (rally.result?.kind === "draw" && rally.nextServer !== rally.receiver) {
      throw new TypeError("A drawn rally passes serve to the receiver.");
    }
  }
  const boardWinner = getWinningPlayer(state.board);
  if (boardWinner !== null && state.status !== "completed") throw new TypeError("A winning board must be completed.");
  if (state.status === "completed" && !state.outcome) throw new TypeError("Completed matches require an outcome.");
  if (state.status !== "completed" && state.outcome !== null) throw new TypeError("Active matches cannot have a final outcome.");
  if (state.outcome?.kind === "win") {
    if (state.outcome.winner !== boardWinner || state.winner !== boardWinner ||
        state.outcome.loser !== (boardWinner === "player-1" ? "player-2" : "player-1") || state.draw) {
      throw new TypeError("Match win outcome does not match the board.");
    }
  } else if (state.outcome?.kind === "draw") {
    if (boardWinner !== null || !isBoardFull(state.board) || state.winner !== null || !state.draw) {
      throw new TypeError("Draw outcome requires a full board without a winning line.");
    }
  } else if (state.winner !== null || state.draw) {
    throw new TypeError("Winner/draw flags require a matching final outcome.");
  }
}

export function isPlayerId(value: unknown): value is PlayerId {
  return value === "player-1" || value === "player-2";
}
