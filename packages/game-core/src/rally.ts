import type { PlayerId, Rally, RallyResult } from "./types.js";
export function createRally(id:number,server:PlayerId,target:number,startedAt=0):Rally {
 if(!Number.isInteger(id)||id<1)throw new RangeError("Rally id must be a positive integer.");
 if(server!=="player-1"&&server!=="player-2")throw new TypeError("Invalid rally server.");
 if(!Number.isInteger(target)||target<0||target>8)throw new RangeError("Rally target must be between 0 and 8.");
 if(!Number.isFinite(startedAt))throw new TypeError("Invalid rally start timestamp.");
 return {id,server,receiver:server==="player-1"?"player-2":"player-1",target,startedAt,completedAt:null,result:null};
}
export function completeRally(rally:Rally,result:RallyResult,completedAt:number):Rally {
 if(rally.result!==null||rally.completedAt!==null)throw new Error("Rally has already been completed.");
 if(!Number.isFinite(completedAt)||completedAt<rally.startedAt)throw new TypeError("Invalid rally completion timestamp.");
 if(result.kind==="win"&&(result.winner===result.loser||result.cell!==rally.target))throw new TypeError("Invalid rally result.");
 return {...rally,completedAt,result};
}
