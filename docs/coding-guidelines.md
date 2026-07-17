# Coding Guidelines

These standards apply to all PulseChat code.

## TypeScript

- Enable strict TypeScript in every app and package.
- Do not use `any`.
- Use `unknown` for untrusted input, then narrow through validation.
- Prefer inferred types from Zod schemas for protocol payloads.
- Use explicit return types for exported functions.
- Use discriminated unions for protocol events, service results, and domain states.
- Use exhaustive checks for event dispatch and state reducers.
- Keep type-only imports marked as `type`.

## Module Design

- Prefer composition over inheritance.
- Keep modules small and focused.
- Give each module one reason to change.
- Keep business logic in services, not in transport handlers or UI components.
- Keep side effects at boundaries: REST routes, WebSocket gateway, repository implementations, local storage, process config, and timers.
- Extract utilities only after reuse is real.
- Do not introduce circular dependencies.

## Naming Conventions

- React components: `PascalCase`.
- TypeScript types and interfaces: `PascalCase`.
- Functions, variables, properties, hooks, and service methods: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` only for true constants.
- Files: follow local convention. Prefer suffixes such as `*.schema.ts`, `*.service.ts`, `*.repository.ts`, `*.test.ts`, and `*.config.ts`.
- Tests: `*.test.ts` or `*.test.tsx`.

## Validation Strategy

- All REST request bodies, params, query values, and responses that cross client/server boundaries must be represented by Zod schemas where practical.
- All WebSocket client-to-server payloads must be validated with Zod.
- Shared protocol schemas live in `packages/contracts`.
- Server validates incoming events before calling services.
- Client defensively parses REST responses and server WebSocket events with shared schemas.
- Never trust browser state, URL params, local storage, cookies, REST payloads, or WebSocket payloads.
- Normalize user input at the boundary, such as trimming usernames and message bodies.

## Error Handling

- Expected validation/domain failures should return typed service results.
- REST route handlers convert expected failures into safe HTTP responses.
- WebSocket handlers convert expected failures into protocol `error` events.
- Unexpected server failures should be logged server-side and sent as generic `INTERNAL_ERROR` responses/events.
- Do not expose stack traces, internal module names, SQL details, password hashes, session token hashes, environment values, or dependency errors to clients.
- Use stable error codes.
- Frontend should display safe, human-readable messages.

## Authentication Standards

- Passwords must be hashed with `scrypt` or a documented stronger replacement.
- Raw passwords must only exist at validation/auth-service boundaries and must never be logged.
- Session tokens must be random, sent to the browser as cookies, and stored server-side only as hashes.
- Logout must revoke the current session.
- Authenticated REST requests and WebSocket connections must use the same session cookie.
- WebSocket authentication failures must return `UNAUTHORIZED` and close with policy violation code `1008`.
- Public user responses must never include password hashes, session token hashes, or internal auth fields.

## Persistence Standards

- Persistent data access must go through `AppRepository`.
- Services depend on the repository interface, not Drizzle.
- Drizzle imports must stay in the database schema and PostgreSQL repository implementation.
- Frontend code must never import database schema, repository types, or server services.
- Database schema changes require both Drizzle schema updates and migrations.
- Use constraints and indexes for uniqueness, membership lookup, message history, session lookup, and duplicate message prevention.
- Soft delete support should be preserved where schema already includes `deletedAt`.

## Import Conventions

- Apps can import from `packages/*`.
- Packages must not import from `apps/*`.
- Avoid circular dependencies.
- Prefer package exports over deep relative paths when crossing package boundaries.
- Do not import server modules into frontend code.
- Do not import frontend modules into server code.
- Do not import repository implementations into services unless wiring dependencies at the app boundary.

## Frontend Standards

- Use React function components.
- Keep route components responsible for composition, data loading, and mutations, not domain business rules.
- Use TanStack Query for REST server state.
- Use Zustand only for WebSocket lifecycle, realtime events, transient presence/typing state, and optimistic updates that reconcile with server events.
- Use component-local state for simple form inputs and UI-only toggles.
- Use local shadcn-style primitives where they fit.
- Keep chat-specific and conversation-specific components inside `apps/web` until shared reuse is proven.
- Ensure UI has explicit loading, empty, error, connected, reconnecting, disconnected, and optimistic states.
- Keep responsive behavior part of initial implementation, not a polish task.

## Backend Standards

- Keep Fastify setup separate from REST route logic.
- Keep REST route logic separate from services.
- Keep WebSocket event handling separate from services.
- Validate before service calls.
- Use explicit connection/client identifiers.
- Handle malformed JSON without crashing.
- Handle disconnect cleanup idempotently.
- Keep heartbeat timers lifecycle-managed.
- Keep persistence behind repository methods.
- Prefer typed result objects for expected service failures.

## Testing Standards

- Test shared contracts with valid and invalid event/resource payloads.
- Test auth service without Fastify dependencies.
- Test messaging service without WebSocket dependencies.
- Test REST routes at the HTTP boundary.
- Test WebSocket gateway behavior at the protocol boundary.
- Test frontend state transitions separately from component rendering where practical.
- Add regression tests for bugs before or with the fix.

## Documentation Standards

Documentation is part of the implementation.

Update:

- `README.md` when setup, scripts, status, or architecture summary changes.
- `docs/architecture.md` when boundaries, modules, data model, or data flow changes.
- `docs/websocket-protocol.md` when events or payloads change.
- `docs/project-decisions.md` for significant decisions.
- `docs/future-roadmap.md` when phases evolve.
- `docs/context-handoff.md` at the end of every implementation session.
