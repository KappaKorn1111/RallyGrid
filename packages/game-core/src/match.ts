import { createEmptyBoard, claimCell, getWinningPlayer, isBoardFull } from "./board.js";
import { rollForAvailableTarget } from "./dice.js";
import { createEvent } from "./events.js";
import { createPlayers, incrementRallyWin, otherPlayer } from "./players.js";
import type { GameEvent, MatchOutcome, MatchState, PlayerId, RandomSource, RallyResult } from "./types.js";
export interface CreateMatchOptions { matchId: string; playerNames?: readonly [string,string]; firstServer?: PlayerId; }
export interface MatchEngine { readonly state: MatchState; readonly events: readonly GameEvent[]; rollDice(): void; startCountdown(): void; startRally(now?:number): void; recordPaddleCollision(player:PlayerId):void; resolveRally(winner:PlayerId, now?:number):void; resolveDraw(now?:number):void; startRematch(matchId:string,firstServer?:PlayerId):void; }
const validStatuses = ["ready","dice","countdown","rally","resolving","completed"] as const;
export function isValidTransition(from: MatchState["status"], to: MatchState["status"]): boolean {
 const map: Record<MatchState["status"], readonly MatchState["status"][]> = {ready:["dice"],dice:["countdown"],countdown:["rally"],rally:["resolving"],resolving:["dice","completed"],completed:["ready"]};
 return map[from].includes(to);
}
export function assertTransition(from: MatchState["status"],to:MatchState["status"]):void { if(!validStatuses.includes(from)||!validStatuses.includes(to)||!isValidTransition(from,to)) throw new Error(`Invalid match transition: ${from} -> ${to}.`); }
export function createMatch(options:CreateMatchOptions,random:RandomSource):MatchEngine {
 if(!options.matchId.trim()) throw new TypeError("matchId is required.");
 const firstServer=options.firstServer??"player-1";
 if(firstServer!=="player-1"&&firstServer!=="player-2") throw new TypeError("Invalid initial server.");
 let state:MatchState={schemaVersion:1,matchId:options.matchId,status:"ready",players:createPlayers(options.playerNames??["Player 1","Player 2"]),board:createEmptyBoard(),server:firstServer,activeRally:null,rallyCount:0,winner:null,draw:false,outcome:null,revision:0};
 let events:GameEvent[]=[];
 const emit=(event:GameEvent)=>{events=[...events,createEvent(event)];};
 const transition=(to:MatchState["status"])=>{assertTransition(state.status,to);state={...state,status:to,revision:state.revision+1};};
 const api:MatchEngine={
  get state(){return state;},get events(){return events;},
  rollDice(){ if(state.status!=="ready"&&state.status!=="resolving") throw new Error("Dice can only be rolled before a rally or after a rally resolves."); if(state.status==="resolving") transition("dice"); else transition("dice");
   const roll=rollForAvailableTarget(state.board,random); const rallyId=state.rallyCount+1;
   emit({type:"dice.rolled",rallyId,roll,revision:state.revision+1});
   emit({type:"target.selected",rallyId,target:roll.target,revision:state.revision+2});
   state={...state,revision:state.revision+2,activeRally:{id:rallyId,server:state.server,receiver:otherPlayer(state.server),target:roll.target,startedAt:0,completedAt:null,result:null}};
  },
  startCountdown(){transition("countdown");},
  startRally(now=Date.now()){if(!Number.isFinite(now))throw new TypeError("Invalid rally timestamp.");if(!state.activeRally)throw new Error("No target has been selected.");transition("rally");state={...state,activeRally:{...state.activeRally,startedAt:now}};emit({type:"rally.started",rallyId:state.activeRally.id,server:state.activeRally.server,receiver:state.activeRally.receiver,target:state.activeRally.target,revision:state.revision+1});state={...state,revision:state.revision+1};},
  recordPaddleCollision(player){if(state.status!=="rally"||!state.activeRally)throw new Error("Paddle collisions are only valid during an active rally.");if(player!=="player-1"&&player!=="player-2")throw new TypeError("Invalid player.");emit({type:"paddle.collision",rallyId:state.activeRally.id,player,revision:state.revision+1});state={...state,revision:state.revision+1};},
  resolveRally(winner,now=Date.now()){if(state.status!=="rally"||!state.activeRally)throw new Error("There is no unresolved active rally.");if(winner!=="player-1"&&winner!=="player-2")throw new TypeError("Invalid rally winner.");if(!Number.isFinite(now)||now<state.activeRally.startedAt)throw new TypeError("Invalid rally completion timestamp.");transition("resolving");const rally=state.activeRally;const loser=otherPlayer(winner);const board=claimCell(state.board,rally.target,winner);const result:RallyResult={kind:"win",winner,loser,cell:rally.target};const lineWinner=getWinningPlayer(board);const full=isBoardFull(board);const outcome:MatchOutcome|null=lineWinner?{kind:"win",winner:lineWinner,loser:otherPlayer(lineWinner)}:full?{kind:"draw"}:null;const nextServer=loser;
   state={...state,board,players:incrementRallyWin(state.players,winner),rallyCount:state.rallyCount+1,server:nextServer,activeRally:{...rally,completedAt:now,result},winner:outcome?.kind==="win"?outcome.winner:null,draw:outcome?.kind==="draw",outcome,revision:state.revision+1};
   emit({type:"rally.ended",rallyId:rally.id,result,nextServer,revision:state.revision+1});emit({type:"cell.claimed",cell:rally.target,player:winner,revision:state.revision+2});
   state={...state,revision:state.revision+2};
   if(outcome){transition("completed");if(outcome.kind==="win")emit({type:"match.won",winner:outcome.winner,revision:state.revision+1});else emit({type:"match.drawn",revision:state.revision+1});emit({type:"match.ended",outcome,revision:state.revision+2});state={...state,revision:state.revision+2};}
  },
  resolveDraw(now=Date.now()){if(state.status!=="rally"||!state.activeRally)throw new Error("There is no unresolved active rally.");if(!Number.isFinite(now)||now<state.activeRally.startedAt)throw new TypeError("Invalid rally completion timestamp.");transition("resolving");const rally=state.activeRally;const result:RallyResult={kind:"draw"};state={...state,rallyCount:state.rallyCount+1,server:otherPlayer(rally.server),activeRally:{...rally,completedAt:now,result},revision:state.revision+1};emit({type:"rally.ended",rallyId:rally.id,result,nextServer:state.server,revision:state.revision+1});state={...state,revision:state.revision+1};if(isBoardFull(state.board)){const outcome:MatchOutcome={kind:"draw"};state={...state,draw:true,outcome};transition("completed");emit({type:"match.drawn",revision:state.revision+1});emit({type:"match.ended",outcome,revision:state.revision+2});state={...state,revision:state.revision+2};}},
  startRematch(matchId,firstServer=state.server){if(state.status!=="completed")throw new Error("A rematch can only start after match completion.");if(!matchId.trim())throw new TypeError("matchId is required.");if(firstServer!=="player-1"&&firstServer!=="player-2")throw new TypeError("Invalid initial server.");const names=[state.players[0].displayName,state.players[1].displayName] as const;const players=createPlayers(names);state={schemaVersion:1,matchId,status:"ready",players,board:createEmptyBoard(),server:firstServer,activeRally:null,rallyCount:0,winner:null,draw:false,outcome:null,revision:state.revision+1};events=[];emit({type:"rematch.started",matchId,server:firstServer,revision:state.revision+1});state={...state,revision:state.revision+1};}
 };
 return api;
}
