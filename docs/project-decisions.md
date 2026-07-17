# Project Decisions

This file is the durable project memory for significant architectural decisions. Add a new entry whenever a decision changes architecture, protocol, dependencies, workflow, or roadmap.

## 2026-07-17 - Use documentation-first bootstrap

Decision:

- Establish README, agent onboarding, architecture docs, protocol docs, workflow docs, roadmap, project decisions, and context handoff before scaffolding app code.

Reason:

- The repository is empty except for Git metadata, and the project brief emphasizes maintainability, future AI agent continuity, and documentation as part of implementation.

Alternatives considered:

- Scaffold code first and document afterward.
- Keep documentation only in README.

Trade-offs:

- Slower first visible feature delivery.
- Stronger shared understanding before implementation begins.

Impact:

- Future agents have clear architecture and workflow constraints before creating code.
- The next task can scaffold the monorepo with fewer ambiguous choices.

Future implications:

- Documentation must remain current as soon as code exists.

## 2026-07-17 - Target a pnpm/Turborepo monorepo

Decision:

- Use `apps/*` for runnable apps and `packages/*` for shared libraries, managed by pnpm workspaces and Turborepo.

Reason:

- The project needs shared contracts between frontend and backend, plus room to add shared config, UI, and utilities without duplicating code.

Alternatives considered:

- Single package repository.
- npm workspaces without Turborepo.
- Nx workspace.

Trade-offs:

- More setup than a single app.
- Clearer boundaries and task orchestration as the project grows.

Impact:

- Shared WebSocket contracts can live in one package.
- Root scripts can run lint, typecheck, test, and build across packages.

Future implications:

- Maintain strict package boundaries to avoid circular dependencies and accidental app coupling.

## 2026-07-17 - Use raw `ws` instead of Socket.IO

Decision:

- Use the `ws` package for backend WebSocket support.

Reason:

- The learning goals explicitly include WebSockets and distributed systems. Raw WebSocket handling exposes connection lifecycle, heartbeats, reconnection behavior, event envelopes, and validation concerns directly.

Alternatives considered:

- Socket.IO.
- Managed real-time services.

Trade-offs:

- More protocol and reconnection work must be implemented manually.
- Better learning value and more explicit architecture.

Impact:

- The protocol must be carefully documented and tested.
- Client reconnect and heartbeat behavior must be intentionally built.

Future implications:

- Horizontal scaling will require explicit Redis/pub-sub or gateway coordination later.

## 2026-07-17 - Use Zod for shared runtime validation

Decision:

- Define WebSocket event schemas with Zod in `packages/contracts`.

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

- Server can validate all incoming WebSocket payloads before service logic.
- Client can defensively parse server events if needed.

Future implications:

- Contract tests should become a core part of the test suite.

## 2026-07-17 - Keep Phase 1 in memory only

Decision:

- Do not add database, Redis, authentication, Docker, observability, or production deployment in Phase 1.

Reason:

- The initial scope is intentionally focused on real-time chat fundamentals.

Alternatives considered:

- Add PostgreSQL immediately.
- Add Redis immediately for presence and pub/sub.
- Add authentication before chat.

Trade-offs:

- Server restarts lose history and presence.
- Faster path to validating WebSocket architecture.

Impact:

- Chat and user services should be designed so persistence can be added later without rewriting the gateway.

Future implications:

- Persistence and scaling decisions must be recorded before implementation.
