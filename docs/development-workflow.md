# Development Workflow

This document defines the recommended implementation workflow for PulseChat.

## Current State

The repository has Phase 2 implemented: pnpm workspace, Turborepo, shared contracts, Fastify/`ws` server, REST API, secure session auth, Drizzle/PostgreSQL persistence, React/Vite client, TanStack Query, Zustand realtime state, tests, linting, formatting, and documentation.

The next phase should harden developer workflow and confidence without redesigning the Phase 2 architecture.

## Recommended Implementation Order

1. Read `AGENTS.md`, `docs/context-handoff.md`, and the task-relevant docs.

2. Update shared contracts first when REST or WebSocket behavior changes:

   - REST request schemas.
   - REST response schemas.
   - Client-to-server WebSocket event schemas.
   - Server-to-client WebSocket event schemas.
   - Inferred TypeScript types.
   - Protocol constants and error codes.
   - Contract tests.

3. Update persistence when data shape changes:

   - Drizzle schema in `apps/server/src/db/schema.ts`.
   - SQL migration in `apps/server/drizzle/`.
   - Repository interface if service needs change.
   - PostgreSQL and in-memory repository implementations.

4. Implement backend services before route or gateway wiring:

   - Auth behavior in `apps/server/src/auth`.
   - Messaging behavior in `apps/server/src/messaging`.
   - Expected failures as typed result objects.
   - Unit tests around domain behavior.

5. Wire REST routes:

   - Validate body, params, and query with Zod.
   - Authenticate with the session cookie where required.
   - Call services or repository read methods.
   - Return safe responses.
   - Add route tests.

6. Wire WebSocket behavior:

   - Authenticate connection with the session cookie.
   - Validate incoming events with shared contracts.
   - Call services.
   - Broadcast only live events.
   - Add gateway tests.

7. Implement frontend data and realtime state:

   - API client and response parsing.
   - Query keys and TanStack Query usage.
   - Zustand WebSocket state and event handling.
   - Optimistic updates and reconciliation by `clientMessageId`.

8. Implement UI components and routes:

   - Loading, empty, error, optimistic, disconnected, and reconnecting states.
   - Responsive layout.
   - Safe user-facing copy.

9. Verify:

   - `pnpm build`
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm format:check`
   - Manual local login/conversation/message flow when UI behavior changes.

10. Update documentation and handoff:

- README if setup/status changed.
- Architecture docs if boundaries, data flow, or modules changed.
- Protocol docs if WebSocket events changed.
- Project decisions for major decisions.
- Future roadmap when phase scope changes.
- Context handoff every session.

## Root Scripts

```json
{
  "dev": "pnpm build:packages && turbo dev --parallel",
  "build:packages": "turbo build --filter=@pulse-chat/contracts --filter=@pulse-chat/utils",
  "db:generate": "drizzle-kit generate --config apps/server/drizzle.config.ts",
  "db:migrate": "drizzle-kit migrate --config apps/server/drizzle.config.ts",
  "build": "turbo build",
  "lint": "turbo lint",
  "typecheck": "turbo typecheck",
  "test": "turbo test",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

## Database Workflow

Use PostgreSQL for persistent local development:

1. Copy `apps/server/.env.example` to `apps/server/.env`.
2. Set `DATABASE_URL`.
3. Update `apps/server/src/db/schema.ts` when schema changes.
4. Generate or write a migration in `apps/server/drizzle/`.
5. Run `pnpm db:migrate`.
6. Update repository tests or service tests for behavior changes.

If `DATABASE_URL` is omitted or blank, the server uses the in-memory repository. That is acceptable for tests and quick demos, but it is not persistent.

## Feature Checklist

For each feature:

- Read `AGENTS.md` and `docs/context-handoff.md`.
- Identify relevant contracts.
- Update `packages/contracts` first if the protocol changes.
- Add or update contract tests.
- Add schema/migration changes if persistent data changes.
- Implement server service logic.
- Keep persistence behind `AppRepository`.
- Wire service logic through REST routes or WebSocket gateway.
- Implement frontend API/query state.
- Implement frontend WebSocket state if live events are involved.
- Implement UI.
- Cover loading, empty, error, optimistic, connected, reconnecting, and disconnected states as relevant.
- Run verification commands.
- Update docs.
- Overwrite `docs/context-handoff.md`.

## Testing Checklist

Minimum coverage expectations:

- Contract schemas accept valid payloads.
- Contract schemas reject invalid payloads.
- Auth service registers, logs in, logs out, validates sessions, and rejects duplicate usernames.
- Messaging service creates one-to-one conversations once and dedupes repeated client messages.
- REST routes cover registration, login/session, conversation creation, message creation, and message listing.
- WebSocket gateway rejects unauthenticated connections.
- WebSocket gateway rejects malformed JSON.
- WebSocket gateway persists and broadcasts messages.
- WebSocket gateway broadcasts typing indicators and read receipts as features evolve.
- Frontend WebSocket store handles connect, reconnect, message, delivered, typing, presence, pong, error, and disconnect events.
- Frontend API client parses responses and surfaces safe errors.

## Definition of Done

A task is done when:

- The requested behavior is implemented.
- TypeScript passes.
- Lint passes.
- Relevant tests pass.
- Build passes when affected.
- Format check passes.
- New protocol behavior is represented in shared contracts.
- External input is validated.
- Errors are safe for users.
- Database changes include migrations.
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
