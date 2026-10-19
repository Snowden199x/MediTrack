# MediTrack Security Overview

**Reviewed:** 19 October 2026

**Scope:** Read-only review of the Laravel API skeleton and its current authentication endpoints. This is a code snapshot, not a penetration test, privacy assessment, or production security certification.

## Trust boundaries

- React and any future mobile client are untrusted clients. Laravel must validate requests and authorize every protected record operation.
- The database must be reachable only by the application and authorized local development tools; clients must never connect directly to MariaDB.
- Resident, household, symptom, visit, and measurement data should be treated as sensitive. Keep access restricted to the actor and authorized health staff who need it.
- Area dashboards should use reviewed aggregates and should not expose resident names or raw reports.

## Controls observed in the current code

- Laravel Sanctum is installed and API routes for `/user` and `/me` require `auth:sanctum`.
- Registration and login validate basic fields. The `User` model uses Laravel's hashed password cast and hides password and remember-token fields from serialization.
- Login checks the submitted password with Laravel's hash checker and returns a Sanctum token on success.
- Logout deletes the authenticated current access token.
- The generic registration route is public and creates a generic user/token. The inspected `User` model and auth routes do not yet define MediTrack roles, staff approval, resident ownership, or health-record authorization; do not use this starter auth flow for live health data without adding those controls.

## Required controls before real health data

- Define roles, account approval, and server-side policies for resident, BHW, and health-center access. Scope every query and operation to the authenticated actor's permitted resident/area records.
- Add request throttling and abuse controls for registration, login, and report submission; define password reset and account recovery behavior.
- Decide identity verification, resident enrollment, consent/notice, collection purpose, retention, correction, and deletion processes before collecting real reports.
- Keep health data and uploaded files private. Validate file type and size, generate safe storage names, and authorize each download.
- Record audit events for sensitive record access or changes, staff role changes, and area-signal review. Avoid logging raw symptom text or secrets unnecessarily.
- Use HTTPS in deployed environments. Keep credentials and tokens out of source control, frontend bundles, and logs. Configure production secrets outside the repository.
- Define token expiration/revocation and account deactivation behavior for any web/mobile API clients.
- Back up production data securely and document restore access and retention. Do not use production health data in development or demo fixtures.
- Review the design with the barangay/health-center data owner and appropriate privacy/security stakeholders before pilot use.

## Open security decisions

- Which organization is the data owner/controller and who can administer accounts?
- Which staff roles may see identifiable symptom/visit details versus aggregates?
- What retention period, resident notice/consent process, and access/correction process apply?
- Whether area aggregation needs a minimum group-size threshold and what staff may export.
- What operational process handles suspected account compromise or accidental disclosure?

## Limits of this review

This review only describes files inspected in the repository and does not establish that deployment settings, database access, backups, TLS, or hosting controls are configured safely. Recheck source and deployment setup when implementation begins.
