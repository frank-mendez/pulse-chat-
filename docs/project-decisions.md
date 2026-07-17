# Project Decisions

This file is the durable project memory for significant architectural decisions. Add a new entry whenever a decision changes architecture, protocol, dependencies, workflow, or roadmap.

## 2026-07-17 - Use documentation-first bootstrap

Decision:

- Establish README, agent onboarding, architecture docs, protocol docs, workflow docs, roadmap, project decisions, and context handoff before scaffolding app code.

Reason:

- The project brief emphasizes maintainability, future AI agent continuity, and documentation as part of implementation.

Alternatives considered:

- Scaffold code first and document afterward.
- Keep documentation only in README.

Trade-offs:

- Slower first visible feature delivery.
- Stronger shared understanding before implementation begins.

Impact:

- Future agents have clear architecture and workflow constraints before creating code.

Future implications:

- Documentation must remain current as soon as code exists.

## 2026-07-17 - Target a pnpm/Turborepo monorepo

Decision:

- Use `apps/*` for runnable apps and `packages/*` for shared libraries, managed by pnpm workspaces and Turborepo.

Reason:

- The project needs shared contracts between frontend and backend, plus room to add shared config and utilities without duplicating code.

Alternatives considered:

- Single package repository.
- npm workspaces without Turborepo.
- Nx workspace.

Trade-offs:

- More setup than a single app.
- Clearer boundaries and task orchestration as the project grows.

Impact:

- Shared contracts can live in one package.
- Root scripts can run lint, typecheck, test, and build across packages.

Future implications:

- Maintain strict package boundaries to avoid circular dependencies and accidental app coupling.

## 2026-07-17 - Use raw `ws` instead of Socket.IO

Decision:

- Use the `ws` package for backend WebSocket support.

Reason:

- The learning goals include WebSockets and distributed systems. Raw WebSocket handling exposes connection lifecycle, heartbeats, reconnection behavior, event envelopes, and validation concerns directly.

Alternatives considered:

- Socket.IO.
- Managed real-time services.

Trade-offs:

- More protocol and reconnection work must be implemented manually.
- Better learning value and more explicit architecture.

Impact:

- The protocol must be carefully documented and tested.

Future implications:

- Horizontal scaling will require explicit Redis/pub-sub or gateway coordination later.

## 2026-07-17 - Use Zod for shared runtime validation

Decision:

- Define REST resource schemas and WebSocket event schemas with Zod in `packages/contracts`.

Reason:

- TypeScript types disappear at runtime. Zod provides runtime validation and inferred TypeScript types from the same source.

Alternatives considered:

- Handwritten type guards.
- Joi.
- io-ts.
- class-validator.

Trade-offs:

- Zod adds a dependency and schema syntax.
- It reduces duplicated type and validation definitions.

Impact:

- Server can validate incoming payloads before service logic.
- Client can defensively parse server responses and events.

Future implications:

- Contract tests should remain a core part of the test suite.

## 2026-07-17 - Keep Phase 1 in memory only

Decision:

- Do not add database, Redis, authentication, Docker, observability, or production deployment in Phase 1.

Reason:

- The initial scope focused on realtime chat fundamentals.

Alternatives considered:

- Add PostgreSQL immediately.
- Add Redis immediately for presence and pub/sub.
- Add authentication before chat.

Trade-offs:

- Server restarts lose history and presence.
- Faster path to validating WebSocket architecture.

Impact:

- Chat and user services were designed so persistence could be added later without rewriting the gateway.

Future implications:

- Persistence and scaling decisions must be recorded before implementation.

## 2026-07-17 - Implement Phase 1 as a working in-memory chat

Decision:

- Scaffold the pnpm/Turborepo monorepo and implement Phase 1 with `apps/web`, `apps/server`, `packages/contracts`, `packages/config`, and `packages/utils`.

Reason:

- The project moved from documentation/bootstrap to the first working learning slice: a global chat room using raw WebSockets and shared validated contracts.

Alternatives considered:

- Continue documentation only.
- Scaffold the monorepo without implementing chat behavior.
- Add persistence, auth, Redis, Docker, or observability immediately.

Trade-offs:

- In-memory state is simple and resets on server restart.
- The implementation remained focused on WebSocket fundamentals and avoided premature infrastructure.

Impact:

- The app supported username join, message broadcast, online users, connection state, reconnect backoff, heartbeat ping/pong, safe errors, and responsive UI.

Future implications:

- Phase 2 could add persistence and identity on top of validated contracts and service boundaries.

## 2026-07-17 - Use built package exports for shared packages

Decision:

- `@pulse-chat/contracts` and `@pulse-chat/utils` export built `dist` artifacts instead of encouraging apps to import shared package source directly.

Reason:

- Built package exports make app/package boundaries explicit and keep runtime behavior closer to how packages work outside local development.

Alternatives considered:

- Export TypeScript source files directly.
- Configure cross-package source aliases in each app.

Trade-offs:

- `pnpm dev` builds shared packages once before starting app dev servers.
- Package boundaries are cleaner and production startup is less surprising.

Impact:

- Turborepo build ordering matters and shared package builds are prerequisites for app builds/tests.

Future implications:

- If hot-reloading shared package changes becomes important, add watch-mode package builds rather than importing app-internal source paths.

## 2026-07-17 - Keep UI primitives local to the web app

Decision:

- Implement local shadcn-style `Button` and `Input` primitives inside `apps/web/src/components/ui`.

Reason:

- There is only one frontend app, so a shared `packages/ui` package would be premature.

Alternatives considered:

- Generate shadcn/ui components into a shared UI package.
- Use a heavy component library such as Material UI or Ant Design.

Trade-offs:

- UI primitives are not reusable across packages yet.
- The web app keeps full visual and accessibility control with minimal dependency surface.

Impact:

- Chat and conversation UI components stay close to the app that owns them.

Future implications:

- Create `packages/ui` only when a second app or genuine shared reuse appears.

## 2026-07-17 - Align the frontend on Vite 5 with Vitest 2

Decision:

- Use Vite 5 in `apps/web` while using Vitest 2 across the workspace.

Reason:

- Mixing Vite 6 app dependencies with Vitest 2 introduced duplicate Vite type graphs during config typechecking.

Alternatives considered:

- Upgrade Vitest to a newer major.
- Keep Vite 6 and work around type incompatibilities.

Trade-offs:

- The app is not on the newest Vite major.
- Toolchain compatibility is stable for the current phase.

Impact:

- Build, test, lint, typecheck, and format checks all pass with one compatible frontend toolchain.

Future implications:

- Upgrade Vite and Vitest together in a dedicated tooling task.

## 2026-07-17 - Implement Phase 2 as persistent authenticated messaging

Decision:

- Convert the demo chat into an authenticated one-to-one messaging app with persistent conversations, message history, REST APIs, and authenticated WebSockets.

Reason:

- Phase 2 goals explicitly prioritize authentication, PostgreSQL, Drizzle, conversations, message history, REST state loading, WebSocket integration, optimistic UI, and duplicate prevention.

Alternatives considered:

- Continue hardening the anonymous global room.
- Add Redis or Docker before identity and persistence.
- Build group chat before one-to-one chat.

Trade-offs:

- The product surface and data model became more complex.
- The architecture now has durable boundaries needed for future product features.

Impact:

- Users can register, log in, create conversations, load history, send persisted messages, and receive live updates.

Future implications:

- Future features must preserve the REST/history and WebSocket/realtime split.

## 2026-07-17 - Use secure session auth instead of Better Auth for Phase 2

Decision:

- Implement secure cookie sessions with Node `scrypt` password hashing, random session tokens, stored session token hashes, expiration, and revocation.

Reason:

- Better Auth was preferred by the brief, but explicit session auth is smaller, easier to inspect, dependency-light, and better for learning the mechanics of session validation and WebSocket authentication.

Alternatives considered:

- Better Auth.
- JWT-only authentication.
- Passwordless auth.
- OAuth-first auth.

Trade-offs:

- The project owns more auth code and must keep it carefully tested.
- The current auth surface is intentionally minimal and does not include OAuth, email verification, password reset, or MFA.

Impact:

- REST and WebSocket authentication share one cookie-based session model.
- Sensitive auth data is never exposed in public user payloads.

Future implications:

- Revisit Better Auth or another auth system when multi-provider auth, account recovery, email verification, or MFA enters scope.

## 2026-07-17 - Use Drizzle/PostgreSQL behind `AppRepository`

Decision:

- Add Drizzle ORM, PostgreSQL schema/migration, and a repository interface with PostgreSQL and in-memory implementations.

Reason:

- PostgreSQL fits users, sessions, conversations, memberships, messages, constraints, and indexes. Drizzle gives TypeScript-native schema definitions while keeping SQL migrations visible.

Alternatives considered:

- Prisma.
- Raw SQL only.
- SQLite.
- MongoDB.

Trade-offs:

- Repository implementations must stay in sync.
- Drizzle schema and SQL migrations require discipline when the data model changes.

Impact:

- Production-like runs can persist data with PostgreSQL.
- Tests and no-database local runs can use the in-memory repository without changing services.

Future implications:

- Add repository-level tests against a real PostgreSQL database when Docker or test containers enter scope.

## 2026-07-17 - Split REST historical state from WebSocket realtime events

Decision:

- REST APIs load existing state and perform request/response operations. WebSockets only handle realtime events such as live message delivery, typing, presence, read receipts, and conversation updates.

Reason:

- Fetching history through WebSockets couples connection lifecycle to data loading and makes reconnect synchronization harder. REST plus TanStack Query gives clearer caching and recovery semantics.

Alternatives considered:

- Continue using WebSockets for all chat state.
- Use REST for sends and omit live WebSocket send events.
- Adopt GraphQL subscriptions.

Trade-offs:

- The client now has two communication paths to coordinate.
- Responsibilities are clearer and easier to test.

Impact:

- Reconnect synchronization can refetch REST state while WebSockets resume live delivery.
- WebSocket handlers stay focused on realtime delivery instead of historical queries.

Future implications:

- Keep pagination, search, and historical reads in REST unless a future documented decision changes the transport model.

## 2026-07-17 - Use TanStack Query for REST state and Zustand for realtime state

Decision:

- Use TanStack Query for `/me`, users, conversations, and messages. Use Zustand for WebSocket lifecycle, presence, typing, current conversation, and optimistic realtime updates.

Reason:

- REST server state benefits from caching, invalidation, loading, and error states. WebSocket state is event-driven and needs explicit connection actions.

Alternatives considered:

- Put all state in Zustand.
- Put all state in TanStack Query.
- Use Redux Toolkit or Redux Toolkit Query.

Trade-offs:

- Developers must understand which state belongs where.
- The division keeps REST and realtime responsibilities understandable.

Impact:

- Conversation and message lists can be refreshed or invalidated through Query while live events update cached data through the Query client.

Future implications:

- Document any future state ownership changes before moving data between Query and Zustand.
