# Context Handoff

Last updated: 2026-07-17

## Current Phase

Phase 2 implemented: persistent authenticated one-to-one messaging.

## Completed Work

- Added REST resource schemas, conversation/message schemas, public user schemas, and expanded WebSocket event contracts in `packages/contracts`.
- Added Drizzle ORM, PostgreSQL schema, and SQL migration for users, sessions, conversations, conversation members, and messages.
- Added `AppRepository` with PostgreSQL and in-memory implementations.
- Added secure session authentication with registration, login, logout, password hashing, hashed session tokens, expiration, and revocation.
- Added REST routes for auth, `/me`, users, conversations, message history, and message creation.
- Reworked WebSocket gateway to require authenticated sessions and handle live conversation, message, typing, presence, read receipt, ping/pong, and safe error events.
- Added TanStack Query API client/query setup and Zustand realtime store updates in the web app.
- Added `/login`, `/register`, `/conversations`, and `/chat/:conversationId` routes.
- Added conversation sidebar, conversation list, avatar, typing, unread, skeleton, empty, header, and delivery-status UI components.
- Added optimistic message sending and delivery reconciliation by `clientMessageId`.
- Added `.env.example` files for server and web.
- Added root Drizzle scripts: `pnpm db:generate` and `pnpm db:migrate`.
- Updated README, AGENTS, architecture, protocol, coding guidelines, workflow, roadmap, project decisions, and this handoff.

## Files Modified

Root/tooling:

- `.gitignore`
- `.husky/pre-commit`
- `.prettierrc.json`
- `eslint.config.mjs`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `turbo.json`

Server:

- `apps/server/.env.example`
- `apps/server/drizzle.config.ts`
- `apps/server/drizzle/0001_phase_2_messaging.sql`
- `apps/server/package.json`
- `apps/server/src/auth/**`
- `apps/server/src/config/app-config.ts`
- `apps/server/src/db/schema.ts`
- `apps/server/src/messaging/**`
- `apps/server/src/repositories/**`
- `apps/server/src/server/**`
- `apps/server/src/websocket/**`
- Existing Phase 1 chat/users/validation tests remain.

Web:

- `apps/web/.env.example`
- `apps/web/package.json`
- `apps/web/src/App.tsx`
- `apps/web/src/components/chat/MessageInput.tsx`
- `apps/web/src/components/conversations/**`
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/lib/api-url.ts`
- `apps/web/src/lib/query-client.ts`
- `apps/web/src/lib/query-keys.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/routes/**`
- `apps/web/src/state/chat-store.ts`
- `apps/web/src/vite-env.d.ts`

Packages:

- `packages/contracts/src/common.schema.ts`
- `packages/contracts/src/events.schema.ts`
- `packages/contracts/src/events.schema.test.ts`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/protocol.constants.ts`
- `packages/contracts/src/resources.schema.ts`

Documentation:

- `README.md`
- `AGENTS.md`
- `docs/architecture.md`
- `docs/coding-guidelines.md`
- `docs/development-workflow.md`
- `docs/future-roadmap.md`
- `docs/project-decisions.md`
- `docs/websocket-protocol.md`
- `docs/context-handoff.md`

## Architectural Decisions

- Phase 2 uses secure cookie sessions instead of Better Auth for explicit learning, small dependency surface, and inspectable auth mechanics.
- Passwords are hashed with Node `scrypt`.
- Session tokens are random, sent only as cookies, and stored server-side only as hashes.
- PostgreSQL persistence is modeled with Drizzle schema and SQL migrations.
- Services depend on `AppRepository`, not Drizzle.
- In-memory repository remains for tests and no-database local runs.
- REST owns historical state loading and request/response workflows.
- WebSockets own only live events.
- TanStack Query owns REST server state in the frontend.
- Zustand owns WebSocket lifecycle, realtime UI state, and optimistic realtime updates.
- Legacy Phase 1 global-chat services and contracts remain for compatibility tests/reference, but new product behavior must use authenticated messaging modules.

## Breaking Changes

- Phase 2 application flow replaces anonymous global-room joins with authenticated routes and conversations.
- `message.send` WebSocket payload now requires `conversationId` and `clientMessageId`.
- Message payloads exposed to the Phase 2 UI are `PersistentMessage` objects with nested `sender` data instead of Phase 1 `ChatMessage` objects.
- WebSocket connections without a valid session now close with `UNAUTHORIZED` and code `1008`.

## Known Issues

- No CI workflow exists yet.
- No Docker Compose setup exists yet for local PostgreSQL.
- No browser-driven smoke tests exist for register/login/conversation/message flows.
- No component tests yet for the new Phase 2 UI states.
- PostgreSQL repository does not yet have integration tests against a real database.
- License is still TBD and no `LICENSE` file exists.
- Group conversations, attachments, reactions, search, Redis, observability, and production deployment remain out of scope.

## TODOs

- Add GitHub Actions workflow for `pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm format:check`.
- Add browser smoke tests for register/login/create conversation/send message across two users.
- Add component tests for auth pages, conversation list states, chat empty/loading/error states, and optimistic message states.
- Add Docker Compose or another documented local PostgreSQL setup if Phase 3 includes Docker.
- Add PostgreSQL-backed repository integration tests.
- Decide and add a license.

## Recommended Next Task

Create Phase 3 developer hardening: CI plus browser smoke coverage for the authenticated messaging flow.

## Potential Risks

- Future agents could accidentally reintroduce WebSocket history fetching instead of using REST and TanStack Query.
- In-memory and PostgreSQL repositories can drift without shared repository contract tests.
- Cookie security settings must be reviewed before any HTTPS deployment.
- Presence is process-local and will not work across multiple server instances without Redis or another coordination layer.
- Shared packages require builds before app runtime; add watch-mode package builds if shared contract iteration becomes painful.

## Questions for Future Implementation

- Should Phase 3 use Playwright for browser smoke tests?
- Should local PostgreSQL setup be Docker Compose or documented host-installed Postgres first?
- Which license should be used before public release?
- When should Better Auth or another auth system be reconsidered for password reset, OAuth, email verification, or MFA?
- Should legacy Phase 1 chat/users modules be removed once no tests or docs rely on them?
