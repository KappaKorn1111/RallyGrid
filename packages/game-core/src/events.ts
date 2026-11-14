import type { GameEvent } from "./types.js";
export function createEvent<T extends GameEvent>(event: T): T { return Object.freeze({...event}) as T; }
export function assertEventSequence(events: readonly GameEvent[]): void {
 let previous = 0;
 for (const event of events) { if (!Number.isInteger(event.revision) || event.revision <= previous) throw new Error("Event revisions must be strictly increasing."); previous = event.revision; }
}
