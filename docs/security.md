# MediTrack Security Overview

**Reviewed:** 19 October 2026
**Scope:** Static inspection of the new Laravel API and React code. Migrations, runtime behavior, deployment, and browser behavior have not been verified by the project owner. This is not a penetration test or production certification.

## Trust boundaries

- React and any future mobile client are untrusted. Laravel validates input and decides access for every protected route.
- The database is for the application and authorized development tools, never direct client access.
- Resident identity, addresses, requests, symptom reports, visits, and measurements are sensitive. Keep them out of public pages and logs.

## Controls implemented in code

- Sanctum bearer tokens expire after seven days. Login and protected routes check active account status; account suspension/deactivation deletes existing tokens. Public registration creates resident accounts only.
- Public resident signups remain pending until a superuser approves them. Superuser routes permit registration review and BHW account creation, but do not grant access to resident health-record workflows. BHW creation validates role, email, area assignment, and credentials on Laravel; health-center staff cannot create BHW accounts. These controls have not been verified at runtime.
- The admin web client is mapped to host loopback at `127.0.0.1:5174`; it has no link or page on the public frontend port `5173`. The public login endpoint rejects superuser accounts. This limits browser access to the local host in the current Compose setup; it does not make the backend API secret, so Laravel's authentication and role checks remain required on every admin API route.
- Server route middleware separates resident, BHW, and health-center functions. Residents access their own records; BHW queries and record operations use their assigned barangay code. Health-center staff can access all areas in the current single-barangay pilot design.
- Authentication and report submission have rate limits. Passwords use Laravel's hashed cast and are hidden from serialized users.
- Activity records identify the actor, action, and record for key changes without copying raw report text into the log. The list of activity events is not yet a complete access audit.
- Area counts are health-center-only, count distinct residents, and hide groups below five. Automatic signal creation is off by default. Signals do not declare a disease or outbreak.
- The backend `.env.example` uses a local-only PostgreSQL development password that must not be reused outside local development. PostgreSQL is the only configured application database and Compose database service. The React client keeps the bearer token in session storage.

## Work required before real health data

- Verify resident identity and household membership; public self-registration currently accepts self-declared area and identity. Define who may correct or merge duplicate records.
- Run the database migrations and bootstrap the initial superuser from private environment settings. Verify pending, approved, and rejected account behavior before using the app.
- Approve notice/consent, collection purpose, retention, deletion, and resident access/correction processes with the data owner and appropriate privacy stakeholders.
- Review browser token storage, XSS defenses, HTTPS, origin policy, database access, backups, restoration, and incident response for the actual deployment. No production security setup was inspected here.
- Add password reset/account recovery and a reason/history for staff account changes. Review whether staff actions and record views need a complete audit trail.
- Have qualified health staff approve symptom questions, next-step language, area thresholds, and signal escalation. Use synthetic records for evaluation before live use.
- Decide whether sensitive text fields need application-level encryption at rest and how authorized staff would search or recover them. The current model stores them as ordinary database text.

## Open decisions

- Who owns the data and administers health-center accounts?
- Which staff roles may read identifiable reports, and how are staff area assignments verified?
- What minimum aggregation size, retention period, and escalation process are acceptable for each barangay?
- What reporting and response process applies after a suspected account compromise or accidental disclosure?

The source code is an early pilot implementation. Do not use it with real patient data until these decisions and deployment checks are complete.
