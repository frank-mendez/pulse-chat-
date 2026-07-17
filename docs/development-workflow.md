# Development Workflow

This document defines the recommended implementation workflow for PulseChat.

## Current State

The repository is in documentation/bootstrap phase. There is no app code yet. The next implementation session should scaffold the monorepo before building Phase 1 chat behavior.

## Recommended Implementation Order

1. Scaffold root workspace files:
   - `package.json`
   - `pnpm-workspace.yaml`
   - `turbo.json`
   - base `tsconfig`
   - ESLint
   - Prettier
   - Husky
   - lint-staged

2. Create shared packages:
   - `packages/contracts`
   - `packages/config`
   - `packages/utils` if needed
   - `packages/ui` only if reusable UI is justified

3. Implement WebSocket contracts:
   - Client-to-server event schemas.
   - Server-to-client event schemas.
   - Inferred TypeScript types.
   - Protocol constants.
   - Contract tests.

4. Implement backend foundation:
   - Fastify server.
   - Health route.
   - Config parsing.
   - WebSocket endpoint with `ws`.
   - Safe JSON parsing.
   - Zod validation boundary.

5. Implement backend services:
   - Chat message creation and in-memory history.
   - User registration and online presence.
   - Disconnect cleanup.
   - Heartbeat/ping-pong behavior.

6. Implement frontend foundation:
   - React/Vite app.
   - TailwindCSS.
   - shadcn/ui.
   - Routes for `/` and `/chat`.

7. Implement frontend WebSocket state:
   - Connect.
   - Join.
   - Send message.
   - Receive events.
   - Reconnect.
   - Heartbeat.
   - Error handling.

8. Implement UI components:
   - `ChatHeader`
   - `ChatMessages`
   - `MessageBubble`
   - `MessageInput`
   - `OnlineUsers`
   - `ConnectionBadge`
   - `LoadingScreen`
   - `ErrorBanner`

9. Verify:
   - Lint.
   - Typecheck.
   - Tests.
   - Build.
   - Manual local chat flow in two browser tabs.

10. Update documentation and handoff:
   - README if setup/status changed.
   - Architecture/protocol docs if implementation changed design.
   - Project decisions for major decisions.
   - Context handoff every session.

## Target Root Scripts

Once scaffolded, root scripts should include:

```json
{
  "dev": "turbo dev",
  "build": "turbo build",
  "lint": "turbo lint",
  "typecheck": "turbo typecheck",
  "test": "turbo test",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

## Feature Checklist

For each feature:

- Read `AGENTS.md` and `docs/context-handoff.md`.
- Identify relevant contracts.
- Update `packages/contracts` first if the protocol changes.
- Add or update tests for contracts.
- Implement server service logic.
- Wire service logic through WebSocket gateway.
- Implement frontend state handling.
- Implement UI.
- Cover loading, empty, error, and disconnected states.
- Run verification commands.
- Update docs.
- Overwrite `docs/context-handoff.md`.

## Testing Checklist

Minimum Phase 1 test coverage:

- Contract schemas accept valid events.
- Contract schemas reject invalid events.
- Chat service stores and returns bounded in-memory history.
- User service registers, lists, and removes users.
- Duplicate username behavior is tested.
- WebSocket gateway rejects malformed JSON.
- WebSocket gateway rejects unknown events.
- WebSocket gateway requires join before message sending.
- Heartbeat behavior is tested at the service/gateway boundary where practical.
- Frontend WebSocket store handles connect, reconnect, message, users, pong, error, and disconnect events.

## Definition of Done

A task is done when:

- The requested behavior is implemented.
- TypeScript passes.
- Lint passes.
- Relevant tests pass.
- Build passes when affected.
- New protocol behavior is represented in shared contracts.
- External input is validated.
- Errors are safe for users.
- Documentation is updated.
- `docs/context-handoff.md` is overwritten with the latest state.

## Working With AI Agents

Agents should work incrementally:

1. Explain the design.
2. Implement.
3. Run a self-review.
4. Update documentation.
5. Generate the context handoff.

Avoid scanning the whole repo unless the task truly requires it. Prefer targeted file reads and reuse existing abstractions.
