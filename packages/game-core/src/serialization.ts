import { assertBoard, getWinningPlayer } from "./board.js";
import type { GameEvent, MatchSnapshot, MatchState, PlayerId } from "./types.js";
const PLAYER_IDS: readonly string[]=["player-1","player-2"];
const STATUSES: readonly string[]=["ready","dice","countdown","rally","resolving","completed"];
export function serializeMatch(state:MatchState,events:readonly GameEvent[]=[]):string { validateMatchState(state);return JSON.stringify({state,eventSequence:events.length} satisfies MatchSnapshot); }
export function restoreMatch(serialized:string):MatchSnapshot {
 let parsed:unknown;try{parsed=JSON.parse(serialized);}catch{throw new TypeError("Serialized match is not valid JSON.");}
 if(!parsed||typeof parsed!=="object"||!("state" in parsed)||!("eventSequence" in parsed))throw new TypeError("Invalid match snapshot envelope.");
 const snapshot=parsed as MatchSnapshot;validateMatchState(snapshot.state);
 if(!Number.isInteger(snapshot.eventSequence)||snapshot.eventSequence<0)throw new TypeError("Invalid event sequence.");
 return structuredClone(snapshot);
}
export function validateMatchState(state:MatchState):void {
 if(!state||state.schemaVersion!==1||typeof state.matchId!=="string"||!state.matchId)throw new TypeError("Invalid match identity or schema version.");
 if(!STATUSES.includes(state.status)||!PLAYER_IDS.includes(state.server))throw new TypeError("Invalid match status or server.");
 assertBoard(state.board);
 if(!Array.isArray(state.players)||state.players.length!==2||state.players[0]?.id!=="player-1"||state.players[1]?.id!=="player-2")throw new TypeError("Match must contain player-1 and player-2.");
 for(const player of state.players)if(typeof player.displayName!=="string"||!Number.isInteger(player.ralliesWon)||player.ralliesWon<0)throw new TypeError("Invalid player record.");
 if(!Number.isInteger(state.rallyCount)||state.rallyCount<0||!Number.isInteger(state.revision)||state.revision<0)throw new TypeError("Invalid match counters.");
 if(state.winner!==null&&!PLAYER_IDS.includes(state.winner))throw new TypeError("Invalid winner.");
 if(state.activeRally){const r=state.activeRally;if(!Number.isInteger(r.id)||r.id<1||!PLAYER_IDS.includes(r.server)||!PLAYER_IDS.includes(r.receiver)||r.server===r.receiver||!Number.isInteger(r.target)||r.target<0||r.target>8||!Number.isFinite(r.startedAt))throw new TypeError("Invalid active rally.");if(state.board[r.target]!==null&&state.status!=="completed")throw new TypeError("Active rally target is already owned.");}
 const winner=getWinningPlayer(state.board);if(winner!==null&&state.status!=="completed")throw new TypeError("A winning board must be completed.");
 if(state.status==="completed"&&!state.outcome)throw new TypeError("Completed matches require an outcome.");
 if(state.outcome?.kind==="win"&&state.outcome.winner!==winner)throw new TypeError("Match outcome does not match board winner.");
 if(state.outcome?.kind==="draw"&&winner!==null)throw new TypeError("A drawn match cannot contain a winning line.");
}
export function isPlayerId(value:unknown):value is PlayerId{return value==="player-1"||value==="player-2";}
