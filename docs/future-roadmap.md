# Future Roadmap

PulseChat should evolve in clear phases. Do not skip phases without updating this document and recording the decision in `docs/project-decisions.md`.

## Phase 0: Documentation and Bootstrap

Status: in progress.

Goals:

- Establish project goals.
- Document target architecture.
- Document WebSocket protocol.
- Document coding standards.
- Document development workflow.
- Create agent handoff strategy.

Exit criteria:

- Documentation exists and reflects current repo state.
- Next implementation task is clear.

## Phase 1: In-Memory Global Chat

Status: planned.

Scope:

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

## Phase 2: Local Developer Hardening

Status: planned.

Potential scope:

- Dockerfile for server.
- Docker Compose for local development if useful.
- CI workflow for lint, typecheck, test, and build.
- More complete test coverage.
- Structured server logging.
- Better frontend error boundaries.
- Local environment example files.

## Phase 3: Persistence and Identity

Status: planned.

Potential scope:

- PostgreSQL with Neon as future hosted target.
- Message persistence.
- User accounts or lightweight identity.
- Database migrations.
- Repository/data-access layer.
- History pagination.
- Session restoration.

## Phase 4: Rooms and Authorization

Status: planned.

Potential scope:

- Multiple chat rooms.
- Room membership.
- Room-level authorization.
- Direct messages.
- User profiles.
- Moderation primitives.

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
- Neon PostgreSQL.
- Grafana Cloud dashboards.
- Metrics, logs, traces.
- Operational runbooks.
- Security hardening.
- Production CORS/origin policy.
- Release workflow.

## Roadmap Rules

- Keep Phase 1 small and focused.
- Record major phase changes in `docs/project-decisions.md`.
- Update `README.md` current status when phases change.
- Update `docs/context-handoff.md` every session.
- Treat documentation as part of the implementation.
