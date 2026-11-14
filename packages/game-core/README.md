# @rallygrid/game-core

Pure TypeScript rules package shared by the browser client and authoritative server. It has no React, Phaser, DOM, browser-global, database, or transport dependency.

## Randomness and authority

The engine receives a `RandomSource` dependency. The server must inject a cryptographically secure source (for example, adapt Node's `crypto.randomInt(min, max + 1)` to `nextInt(min, max)`). Do not use a client-provided dice result as authoritative input. The core deliberately does not import Node or Web Crypto so the same deterministic engine runs in both environments.

## Lifecycle

`createMatch → rollDice → startCountdown → startRally → resolveRally | resolveDraw`. A resolved rally claims its target for the rally winner; the losing player serves next. A completed match can be reset with `startRematch`. All public operations are synchronous and state updates are atomic within the JavaScript turn, so duplicate resolution attempts are rejected.

## Serialization

Use `serializeMatch` and `restoreMatch` for versioned JSON snapshots. Use `restoreMatchEngine(snapshot, randomSource)` to rehydrate a validated snapshot into a resumable engine instance. Always validate restored snapshots at the server boundary; snapshots are state transfer, not an authentication mechanism.

## Commands

Run `pnpm --filter @rallygrid/game-core typecheck`, `pnpm test -- packages/game-core/src/game-core.test.ts`, and `pnpm --filter @rallygrid/game-core build`.


## Authoritative multiplayer server

The server registers the `rallygrid` Colyseus room. The room injects the Node `crypto.randomInt` adapter into the shared game engine, assigns player seats on join, accepts rate-limited paddle-axis inputs, advances a server-ticked rally simulation, and resolves a point only when the server simulation detects a missed paddle. Clients cannot submit dice results or choose a rally winner. Room messages: `match:roll`, `paddle:input`; server messages include `match:welcome`, `match:update`, `match:dice`, `match:rally-started`, `match:physics`, `match:rally-result`, and `match:ended`.


CI now runs for the stacked Step 03 pull request targeting `step-01-foundation`.
