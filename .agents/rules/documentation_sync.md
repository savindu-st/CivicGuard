# Documentation & Progress Synchronization Rule

## Objective
Keep the system architecture documentation (`architecture.md`) and the engineering progress tracker (`progress.md`) perpetually up-to-date across all implementation sessions.

## Mandatory Behavioral Constraints

1. **Automatic Architecture Decision Updates (`architecture.md`)**:
   - Whenever an architectural decision is made, refined, or revised (such as data storage strategy, communication protocols, service boundaries, fallback algorithms, or auth models), the agent **MUST** immediately record or update the corresponding Architecture Decision Record (ADR) in `architecture.md`.
   - Whenever a service route, contract, or domain boundary is added or changed, update the relevant section in `architecture.md`.
   - Never leave architectural changes undocumented.

2. **Automatic Progress Tracking (`progress.md`)**:
   - Whenever code is implemented, a bug is fixed, a service is tested, or a task/milestone is completed:
     - Check off completed items in `progress.md` (`[x]`).
     - Update the Subsystem Health & Progress table percentages.
     - Advance the Current Phase or Overall Completion metric if applicable.
     - Append a new line to the **Change & Decision Log** with the date, description of changes, and impacted files.
   - Do this proactively in the same turn that code or configuration is modified.

3. **No User Prompting Required**:
   - Do not wait for the user to ask "update progress.md" or "document this architecture decision". Perform the updates automatically as part of the implementation workflow.
