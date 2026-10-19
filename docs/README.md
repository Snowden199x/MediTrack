# MediTrack Documentation

This folder describes the current repository, implemented code, and proposed work. The 19 October 2026 implementation has been inspected statically; the owner has not run migrations or runtime checks yet.

## Start here

- [Project foundation and roadmap](project-foundation.md) — project idea, stack, repository snapshot, and implementation phases.
- [Accounts feature spec](features/accounts/spec.md) — roles, superuser registration review, and superuser-managed BHW accounts.
- [Public landing page spec](features/public/landing-page/spec.md) — public introduction page and app entry points.
- [BHW visits and follow-up spec](features/bhw/visits-and-follow-up/spec.md) — current visit records, schedules, and remaining workflow work.
- [Resident symptom reporting spec](features/resident/symptom-reporting/spec.md) — current guided intake and clinical review needed.
- [Area trend alerts spec](features/health-center/area-trend-alerts/spec.md) — staff-only aggregate review and disabled-by-default signals.
- [Security overview](security.md) — current controls and remaining decisions. This is not a penetration test or production certification.
- [Progress log](logs/PROGRESS-2026-10-19.md) — dated implementation notes and remaining work.

## Status labels

- **Implemented** — the stated behavior exists in the repository code. This does not mean production readiness or owner testing.
- **Partial** — some behavior exists, but the documented workflow is incomplete.
- **UI only / prototype** — a screen or demo exists without persistent application behavior.
- **Planned** — the behavior is proposed and no implementation was found in the current repository snapshot.

The current source code is authoritative when it differs from these docs. Update the relevant feature spec and project foundation when implementation changes materially. Keep security notes factual and date the snapshot when it is refreshed.
