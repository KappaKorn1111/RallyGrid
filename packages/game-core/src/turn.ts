import type { PlayerId } from "./types.js";
export function nextServerAfterRally(loser:PlayerId):PlayerId { if(loser==="player-1")return "player-1";if(loser==="player-2")return "player-2";throw new TypeError("Invalid next server."); }
export function validateTurnOwner(player:PlayerId,expected:PlayerId):void {if(player!==expected)throw new Error(`Turn belongs to ${expected}, not ${player}.`);}
