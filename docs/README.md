# MediTrack Documentation

This folder describes the current repository and proposed work. Read the status on each document before treating a workflow as implemented.

## Start here

- [Project foundation and roadmap](project-foundation.md) — project idea, stack, repository snapshot, and implementation phases.
- [Accounts feature spec](features/accounts/spec.md) — proposed roles, enrollment, and account lifecycle.
- [Public landing page spec](features/public/landing-page/spec.md) — proposed public introduction page and entry points to the app.
- [BHW visits and follow-up spec](features/bhw/visits-and-follow-up/spec.md) — proposed visit records, schedules, and follow-up queue.
- [Resident symptom reporting spec](features/resident/symptom-reporting/spec.md) — guided symptom clarification and safe next-step guidance.
- [Area trend alerts spec](features/health-center/area-trend-alerts/spec.md) — aggregated symptom trends for authorized staff review.
- [Security overview](security.md) — current code snapshot, proposed controls, and remaining decisions. This is not a penetration test or production certification.

## Status labels

- **Implemented** — the stated behavior exists in the repository code. This does not mean production readiness or owner testing.
- **Partial** — some behavior exists, but the documented workflow is incomplete.
- **UI only / prototype** — a screen or demo exists without persistent application behavior.
- **Planned** — the behavior is proposed and no implementation was found in the current repository snapshot.

The current source code is authoritative when it differs from these docs. Update the relevant feature spec and project foundation when implementation changes materially. Keep security notes factual and date the snapshot when it is refreshed.
