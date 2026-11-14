import type { Board, CellOwner, PlayerId } from "./types.js";
export const BOARD_SIZE = 9;
export const WINNING_LINES: readonly (readonly [number, number, number])[] = [
 [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]
];
export function createEmptyBoard(): Board { return Array<CellOwner>(BOARD_SIZE).fill(null); }
export function assertBoard(board: Board): void {
 if (board.length !== BOARD_SIZE) throw new RangeError("Board must contain exactly 9 cells.");
 for (const cell of board) if (cell !== null && cell !== "player-1" && cell !== "player-2") throw new TypeError("Invalid board owner.");
}
export function claimCell(board: Board, index: number, player: PlayerId): Board {
 assertBoard(board);
 if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE) throw new RangeError("Cell index must be an integer from 0 through 8.");
 if (player !== "player-1" && player !== "player-2") throw new TypeError("Invalid player ownership.");
 if (board[index] !== null) throw new Error("Cell is already claimed.");
 const next = [...board]; next[index] = player; return next;
}
export function getWinningPlayer(board: Board): PlayerId | null {
 assertBoard(board);
 for (const [a,b,c] of WINNING_LINES) { const owner = board[a]; if (owner !== null && owner === board[b] && owner === board[c]) return owner; }
 return null;
}
export function isBoardFull(board: Board): boolean { assertBoard(board); return board.every(cell => cell !== null); }
export function getAvailableCells(board: Board): number[] { assertBoard(board); return board.flatMap((cell,index) => cell === null ? [index] : []); }
