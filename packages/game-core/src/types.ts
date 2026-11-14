export type PlayerId = "player-1" | "player-2";
export type CellOwner = PlayerId | null;
export type Board = readonly CellOwner[];
export type MatchStatus = "ready" | "dice" | "countdown" | "rally" | "resolving" | "completed";
export type MatchOutcome = { kind: "win"; winner: PlayerId; loser: PlayerId } | { kind: "draw" };
export type RallyResult = { kind: "win"; winner: PlayerId; loser: PlayerId; cell: number } | { kind: "draw" };
export interface Player { readonly id: PlayerId; readonly displayName: string; readonly ralliesWon: number; }
export interface DiceRoll { readonly die1: number; readonly die2: number; readonly row: number; readonly column: number; readonly target: number; readonly rerolls: number; }
export interface Rally { readonly id: number; readonly server: PlayerId; readonly receiver: PlayerId; readonly target: number; readonly startedAt: number; readonly completedAt: number | null; readonly result: RallyResult | null; readonly nextServer: PlayerId | null; }
export interface MatchState { readonly schemaVersion: 1; readonly matchId: string; readonly status: MatchStatus; readonly players: readonly [Player, Player]; readonly board: Board; readonly server: PlayerId; readonly activeRally: Rally | null; readonly rallyCount: number; readonly winner: PlayerId | null; readonly draw: boolean; readonly outcome: MatchOutcome | null; readonly revision: number; }
export type GameEvent =
 | { type: "match.started"; matchId: string; server: PlayerId; revision: number }
 | { type: "dice.rolled"; rallyId: number; roll: DiceRoll; revision: number }
 | { type: "target.selected"; rallyId: number; target: number; revision: number }
 | { type: "rally.started"; rallyId: number; server: PlayerId; receiver: PlayerId; target: number; revision: number }
 | { type: "paddle.collision"; rallyId: number; player: PlayerId; revision: number }
 | { type: "rally.ended"; rallyId: number; result: RallyResult; nextServer: PlayerId; revision: number }
 | { type: "cell.claimed"; cell: number; player: PlayerId; revision: number }
 | { type: "match.won"; winner: PlayerId; revision: number }
 | { type: "match.drawn"; revision: number }
 | { type: "match.ended"; outcome: MatchOutcome; revision: number }
 | { type: "rematch.started"; matchId: string; server: PlayerId; revision: number };
export interface RandomSource { nextInt(minInclusive: number, maxInclusive: number): number; }
export interface MatchSnapshot { readonly state: MatchState; readonly eventSequence: number; }
