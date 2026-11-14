# RALLYGRID — Step 02 interface

Step 02 adds a responsive React application shell with a typed screen model, reusable UI primitives, desktop and mobile navigation, local session state, notifications, a support dialog, and a responsive Phaser arena host.

## Screen destinations
Landing, main menu, mode selection, solo setup, CPU difficulty, local multiplayer, online multiplayer, matchmaking, private room, profile, statistics, leaderboards, match history, customization, settings, how-to-play, tutorial, match results, loading, connection error, and Phaser game arena.

## Integration boundaries
- Profile name, preferences, room-code flow, tutorial progress, notifications, and sample match data are client-side session state.
- Phaser canvas mounts only on the game screen and resizes responsively.
- Online matchmaking and private-room membership are demo flows pending Colyseus integration.
- Supabase authentication requires credentials and its authentication milestone.
- Match rules, turn input, scoring, and authoritative results remain in the gameplay-engine milestone.

## Responsive behavior
Desktop uses a persistent navigation rail. Smaller screens use bottom navigation, stacked panels, safe-area-aware spacing, touch-friendly controls, fullscreen support, and portrait rotation guidance.

## Validation
Run pnpm typecheck, pnpm lint, pnpm test, pnpm build, and pnpm test:e2e.
