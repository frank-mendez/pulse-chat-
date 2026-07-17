# Coding Guidelines

These standards apply to all PulseChat code once the application is scaffolded.

## TypeScript

- Enable strict TypeScript in every app and package.
- Do not use `any`.
- Use `unknown` for untrusted input, then narrow through validation.
- Prefer inferred types from Zod schemas for protocol payloads.
- Use explicit return types for exported functions.
- Use discriminated unions for protocol events and domain states.
- Use exhaustive checks for event dispatch and state reducers.

## Module Design

- Prefer composition over inheritance.
- Keep modules small and focused.
- Give each module one reason to change.
- Keep business logic in services, not in transport handlers or UI components.
- Avoid global mutable state except deliberate Phase 1 in-memory registries inside server services.
- Extract utilities only after reuse is real.

## Naming Conventions

- React components: `PascalCase`.
- TypeScript types and interfaces: `PascalCase`.
- Functions, variables, properties, hooks, and service methods: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE` only for true constants.
- Files: prefer `kebab-case` for component folders and `camelCase` or suffix-based names for TypeScript modules according to local convention.
- Tests: `*.test.ts` or `*.test.tsx`.
- Schemas: `*.schema.ts`.
- Services: `*.service.ts`.
- Types: `*.types.ts`.

## Validation Strategy

- All WebSocket client-to-server payloads must be validated with Zod.
- Shared protocol schemas live in `packages/contracts`.
- Server validates incoming events before calling services.
- Client may use shared schemas for defensive parsing of server events.
- Never trust browser state, URL params, local storage, or WebSocket payloads.
- Normalize user input at the boundary, such as trimming usernames and message bodies.

## Error Handling

- Expected validation/domain failures should return protocol `error` events.
- Unexpected server failures should be logged server-side and sent as generic `INTERNAL_ERROR` events.
- Do not expose stack traces, internal module names, environment values, or dependency errors to clients.
- Use stable error codes.
- Frontend should display safe, human-readable messages.
- Prefer typed result objects for expected service failures where that keeps control flow clear.

## Import Conventions

- Apps can import from `packages/*`.
- Packages must not import from `apps/*`.
- Avoid circular dependencies.
- Prefer package exports over deep relative paths when crossing package boundaries.
- Keep type-only imports marked as `type` where applicable.
- Do not import server modules into frontend code.
- Do not import frontend modules into server code.

## Frontend Standards

- Use React function components.
- Keep route components responsible for composition, not business logic.
- Use Zustand only for WebSocket connection and real-time chat state.
- Use component-local state for simple form inputs.
- Use shadcn/ui where it fits.
- Keep chat-specific components inside `apps/web` until shared reuse is proven.
- Ensure UI has explicit loading, empty, error, connected, reconnecting, and disconnected states.
- Keep responsive behavior part of initial implementation, not a polish task.

## Backend Standards

- Keep Fastify setup separate from WebSocket gateway logic.
- Keep WebSocket event handling separate from chat and user services.
- Validate before service calls.
- Use explicit connection/client identifiers.
- Handle malformed JSON without crashing.
- Handle disconnect cleanup idempotently.
- Keep heartbeat timers lifecycle-managed.
- Bound in-memory collections in Phase 1 where practical.

## Testing Standards

- Test shared contracts with valid and invalid event payloads.
- Test chat service without WebSocket dependencies.
- Test user service without WebSocket dependencies.
- Test WebSocket gateway behavior at the protocol boundary.
- Test frontend state transitions separately from component rendering where practical.
- Add regression tests for bugs before or with the fix.

## Documentation Standards

Documentation is part of the implementation.

Update:

- `README.md` when setup, scripts, status, or architecture summary changes.
- `docs/architecture.md` when boundaries, modules, or data flow changes.
- `docs/websocket-protocol.md` when events or payloads change.
- `docs/project-decisions.md` for significant decisions.
- `docs/future-roadmap.md` when phases evolve.
- `docs/context-handoff.md` at the end of every implementation session.
