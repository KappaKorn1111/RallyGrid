import type { Player, PlayerId } from "./types.js";
export function otherPlayer(player: PlayerId): PlayerId { if(player==="player-1") return "player-2"; if(player==="player-2") return "player-1"; throw new TypeError("Unknown player."); }
export function createPlayers(names: readonly [string,string]): readonly [Player,Player] {
 if (!names.every(name => typeof name === "string" && name.trim().length > 0)) throw new TypeError("Both players require a display name.");
 return [{id:"player-1",displayName:names[0].trim(),ralliesWon:0},{id:"player-2",displayName:names[1].trim(),ralliesWon:0}];
}
export function incrementRallyWin(players: readonly [Player,Player], winner: PlayerId): readonly [Player,Player] {
 if(winner!=="player-1" && winner!=="player-2") throw new TypeError("Invalid winning player.");
 return players.map(p=>p.id===winner?{...p,ralliesWon:p.ralliesWon+1}:p) as unknown as readonly [Player,Player];
}
