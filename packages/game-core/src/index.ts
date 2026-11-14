export type PlayerId = "player-1" | "player-2";
export type BoardCell = PlayerId | null;
export type Board = readonly BoardCell[];

export function createEmptyBoard(): Board {
  return Array<BoardCell>(9).fill(null);
}

export function getWinningPlayer(board: Board): PlayerId | null {
  if (board.length !== 9) throw new Error("A RALLYGRID board must contain exactly 9 cells.");
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ] as const;
  for (const [a, b, c] of lines) {
    const owner = board[a];
    if (owner !== null && owner !== undefined && owner === board[b] && owner === board[c]) return owner;
  }
  return null;
}

export function claimCell(board: Board, index: number, player: PlayerId): Board {
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new RangeError("Cell index must be between 0 and 8.");
  if (board.length !== 9) throw new Error("A RALLYGRID board must contain exactly 9 cells.");
  if (board[index] !== null) throw new Error("Cell is already claimed.");
  const next = [...board];
  next[index] = player;
  return next;
}
