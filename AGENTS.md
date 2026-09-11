# Civic Guard — Agent Instructions & Behavioral Rules

## 1. Documentation & Decision Synchronization (MANDATORY)

Every AI coding session in this repository must adhere to the following documentation protocols:

- **Architecture Decisions**: Any new or modified architectural decision, design pattern, inter-service contract, or infrastructure adjustment MUST immediately be recorded in [`architecture.md`](file:///home/savindust/Documents/projects/civic%20guard/CivicGuard/architecture.md). Include new ADRs (Architecture Decision Records) using the standard format:
  - Date
  - Status (Proposed, Accepted, Deprecated)
  - Context
  - Decision
  - Consequences
- **Progress Tracking**: Any task, feature, service implementation, bugfix, or test verification MUST immediately be updated in [`progress.md`](file:///home/savindust/Documents/projects/civic%20guard/CivicGuard/progress.md):
  - Mark completed checklist items (`- [x]`).
  - Update subsystem progress percentages in the Health Dashboard.
  - Append an entry to the **Change & Decision Log** documenting the date, author, summary, and impacted files.
- **Proactive Execution**: These updates must happen **automatically** within the same turn as the code or design change, without waiting for the user to request it.

## 2. Microservice & Architecture Principles
- Services are located in `backend/services/*` and share types/utilities from `backend/shared` using npm workspaces.
- Supabase PostgreSQL and Storage are used for persistence with `SUPABASE_SERVICE_ROLE_KEY`.
- Inter-service communications use direct HTTP RPC with graceful error handling and retry.
- Real-time updates route through `notification-service` via Socket.IO with role/ward rooms.
- Incident resolutions must include a photo proof before roads are reopened on public maps.
