# Future Roadmap

PulseChat should evolve in clear phases. Do not skip phases without updating this document and recording the decision in `docs/project-decisions.md`.

## Phase 0: Documentation and Bootstrap

Status: complete.

Goals:

- Establish project goals.
- Document target architecture.
- Document WebSocket protocol.
- Document coding standards.
- Document development workflow.
- Create agent handoff strategy.

Exit criteria:

- Documentation exists and reflects repo state.
- Next implementation task is clear.

## Phase 1: In-Memory Global Chat

Status: implemented.

Scope:

- Anonymous username join.
- Single global room.
- In-memory messages and online users.
- No authentication.
- No database.
- No Redis.
- No Docker.
- No observability stack.
- No production deployment.

Features:

- Enter username.
- Connect to WebSocket server.
- Join a single global chat room.
- Send messages.
- Receive messages.
- Show connected users.
- Show connection status.
- Auto reconnect.
- Ping/pong heartbeat.
- Basic error handling.
- Responsive UI.

Technical goals:

- pnpm/Turborepo monorepo.
- Shared Zod contracts.
- Fastify + `ws` backend.
- React/Vite frontend.
- Zustand WebSocket state.
- Focused tests for contracts, services, gateway, and frontend state.

## Phase 2: Persistent Authenticated Messaging

Status: implemented.

Scope:

- Authentication.
- PostgreSQL.
- Drizzle ORM.
- One-to-one conversations.
- Message persistence.
- Message history through REST.
- Authenticated REST requests.
- Authenticated WebSockets.
- Optimistic UI.
- Duplicate prevention through `clientMessageId`.
- TanStack Query for REST server state.
- Zustand for WebSocket and realtime state.

Completed features:

- Registration, login, logout, `/me`, and protected frontend routes.
- Secure password hashing.
- Hashed session tokens stored server-side.
- Cookie-based session persistence.
- Drizzle schema and SQL migration for users, sessions, conversations, members, and messages.
- Repository interface with PostgreSQL and in-memory implementations.
- User search.
- One-to-one conversation creation.
- Conversation list.
- Message history.
- Message creation through REST.
- Live message delivery through WebSockets.
- Delivery confirmation.
- Typing indicators.
- Presence events.
- Read receipt events.
- Frontend conversation sidebar and chat route.

Not included:

- Redis.
- Docker.
- Observability.
- Horizontal scaling.
- Kubernetes.
- Production deployment optimization.
- Group conversations.
- Attachments.
- Reactions.
- Full text search.

## Phase 3: Developer Hardening

Status: planned.

Potential scope:

- CI workflow for install, build, typecheck, lint, test, and format check.
- Browser smoke tests for register/login/conversation/message flows.
- Component tests for core UI states.
- More REST and WebSocket negative-path coverage.
- Optional Docker Compose for local PostgreSQL.
- Better frontend error boundaries.
- Seed script for local demo users.

## Phase 4: Rooms, Authorization, and Product Depth

Status: planned.

Potential scope:

- Group conversations.
- Conversation membership invitations.
- Richer authorization boundaries.
- User profiles.
- Message history pagination.
- Message editing and soft deletion.
- Moderation primitives.
- Search.

## Phase 5: Distributed Real-Time Infrastructure

Status: planned.

Potential scope:

- Redis-backed pub/sub.
- Multi-instance WebSocket broadcast.
- Presence synchronization.
- Backpressure and rate limiting.
- Horizontal scaling tests.
- Load testing.

## Phase 6: Observability and Production Deployment

Status: planned.

Potential scope:

- Vercel deployment for web app.
- Railway deployment for server.
- Neon PostgreSQL or equivalent hosted database.
- Metrics, logs, traces, and dashboards.
- Operational runbooks.
- Security hardening.
- Production CORS/origin policy.
- Release workflow.

## Roadmap Rules

- Keep the current phase focused.
- Record major phase changes in `docs/project-decisions.md`.
- Update `README.md` current status when phases change.
- Update `docs/context-handoff.md` every session.
- Treat documentation as part of the implementation.
