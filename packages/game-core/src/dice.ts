import type { Board, DiceRoll, RandomSource } from "./types.js";
import { assertBoard, getAvailableCells } from "./board.js";
export function dieToIndex(value:number):number {
 if(!Number.isInteger(value)||value<1||value>6)throw new RangeError("Die result must be an integer from 1 through 6.");
 return value<=2?0:value<=4?1:2;
}
export function targetFromDice(die1:number,die2:number):number{return dieToIndex(die1)*3+dieToIndex(die2);}
export function validateDiceRoll(roll:{die1:number;die2:number}):void{dieToIndex(roll.die1);dieToIndex(roll.die2);}
function drawInt(random:RandomSource,min:number,max:number):number {const value=random.nextInt(min,max);if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(`Random source returned ${value}; expected an integer from ${min} through ${max}.`);return value;}
function diceForTarget(target:number):readonly [number,number]{return [Math.floor(target/3)*2+1,(target%3)*2+1];}
export function rollForAvailableTarget(board:Board,random:RandomSource):DiceRoll {
 assertBoard(board);const available=getAvailableCells(board);
 if(available.length===0)throw new Error("Cannot roll: board has no available targets.");
 if(typeof random?.nextInt!=="function")throw new TypeError("A valid random source is required.");
 if(available.length===1){const target=available[0]!;const [die1,die2]=diceForTarget(target);return{die1,die2,row:Math.floor(target/3),column:target%3,target,rerolls:0};}
 const maxAttempts=256;
 for(let rerolls=0;rerolls<maxAttempts;rerolls++){const die1=drawInt(random,1,6),die2=drawInt(random,1,6);validateDiceRoll({die1,die2});const target=targetFromDice(die1,die2);if(board[target]===null)return{die1,die2,row:dieToIndex(die1),column:dieToIndex(die2),target,rerolls};}
 const target=available[drawInt(random,0,available.length-1)]!;const [die1,die2]=diceForTarget(target);
 return{die1,die2,row:Math.floor(target/3),column:target%3,target,rerolls:maxAttempts};
}
