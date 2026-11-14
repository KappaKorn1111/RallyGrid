import type { MatchStatus } from "./types.js";
const TRANSITIONS:Record<MatchStatus,readonly MatchStatus[]>={ready:["dice"],dice:["countdown"],countdown:["rally"],rally:["resolving"],resolving:["dice","completed"],completed:["ready"]};
export function canTransition(from:MatchStatus,to:MatchStatus):boolean{return TRANSITIONS[from]?.includes(to)??false;}
export function validateTransition(from:MatchStatus,to:MatchStatus):void{if(!canTransition(from,to))throw new Error(`Invalid match transition: ${from} -> ${to}.`);}
