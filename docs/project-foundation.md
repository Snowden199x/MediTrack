# MediTrack Project Foundation

This note records the project idea in the external Ideas folder, the technology choices shared by the project owner, and what is already present in the MediTrack repository. The pitch documents call the concept Barangay HealthLink; the current code repository is named MediTrack. Confirm the final product name before presenting or publishing the project.

See the [documentation index](README.md) for feature status and the [security overview](security.md). Implemented code has not yet been verified through migrations or runtime use by the project owner.

## Current project

The idea is a barangay level community health monitoring and follow-up website for residents, Barangay Health Workers (BHWs), and health center staff. It aims to help BHWs notice missed checkups and basic warning signs sooner, organize follow-up, and make preventive services easier for residents to access. The project is intended to support monitoring and follow-up, not diagnose illnesses.

The repository currently contains a Laravel API backend, a React web frontend, and a Docker Compose development setup.

## Problem and intended users

The pitch describes paper-based or scattered records and residents who may only visit a health center after they feel sick. Those conditions can make it harder for BHWs to track residents who need routine attention or follow up after a missed checkup.

- Residents need reminders, health center announcements, and a straightforward way to share concerns or request help.
- BHWs need household records, a follow-up list, and a way to record home visit information.
- Health center staff need a view of community needs to plan checkups, programs, and supplies.
- Priority groups include older adults, pregnant residents, children, and people with ongoing health concerns.

The pitch aligns the project primarily with UN Sustainable Development Goal 3: Good Health and Well-Being, through preventive care, community monitoring, and improved access to local health services.

## Product capabilities and ideas

The pitch and HTML prototype describe these functions. The first implementation now covers basic accounts, resident/household records, scheduling, visits, follow-ups, requests, announcements, guided reports, and private area counts. The more specialized rules below remain proposals.

- Resident and household registration, reminders, announcements, and requests for an appointment or assistance.
- BHW resident records, home visit notes, basic measurement entry, and scheduling.
- A dashboard that surfaces follow-up candidates using simple rules: repeated missed checkups, repeated abnormal measurements for an older resident, upcoming prenatal care, and upcoming child vaccination.
- Community summaries such as households monitored, checkups completed, missed visits, and response time to requests.
- Guided symptom reporting: ask follow-up questions to clarify what the resident is experiencing, then suggest an appropriate next step such as contacting a BHW or visiting the health center. Initial scope is symptom clarification and next-step guidance, not naming a disease or diagnosing.
- Area-level trend signal: aggregate similar symptom reports by area and time period, and flag an unusual increase for authorized barangay health staff to verify. The system must describe this as a signal for review, not announce that a virus or outbreak is confirmed.

## Original feature roadmap and remaining work

This roadmap records the original scope and desired acceptance behavior. Some items now exist in code; refer to each feature spec for its current status. Clinical logic, identity verification, and operational processes still need product-owner and health-team decisions.

### Phase 0 — Public landing page

- Introduce the MediTrack/Barangay HealthLink purpose and intended users before sign-in.
- Explain the planned resident and BHW workflows in plain language, without presenting planned features as currently available.
- Provide clear sign-in and account-registration entry points, subject to the account enrollment rules in the [accounts spec](features/accounts/spec.md).
- Explain that symptom reporting helps clarify a concern and guide next steps; it does not diagnose a disease.
- Use fictional/sample visuals only. Do not display real resident names, health reports, or statistics on the public page.
- See the [landing page spec](features/public/landing-page/spec.md) for scope and acceptance notes.

### Phase 1 — Accounts and resident records

- Add distinct account roles for residents, BHWs, health-center staff, and a superuser registration reviewer. The code holds resident signups as pending until review. The superuser registration-review client is a separate local-only service on port `5174`; the public web client on `5173` does not include its sign-in page or link. Runtime verification is pending.
- The superuser can review resident registrations and create BHW accounts, but cannot use health-record workflows. BHW creation requires a name, email, assigned barangay, and initial password; the admin shares that password privately. A first account is configured in private `.env`; run the bootstrap command after migrations to create or update it in the database.
- Define which staff role can view, create, update, and export each type of record before building the screens.
- Let authorized staff register a household and its residents, including barangay address and basic contact details needed for follow-up.
- Let residents see only their own record and submit updates or requests. Do not let a resident choose another resident as the prototype currently permits.
- Add server-side validation and authorization for all record operations. Keep a record of who created or changed health records and when.

### Phase 2 — Visits, schedules, and follow-up

- Give BHWs a resident list with search and filters for upcoming checkups, missed visits, and priority follow-up.
- Let authorized staff create schedules and record a completed or missed visit, visit date, worker, notes, and measurements that were actually taken.
- Keep blood pressure and temperature fields optional independently; do not silently fill a measurement that was not recorded. Validate allowed formats and ranges, and preserve measurement date and context.
- Show residents relevant upcoming reminders and allow staff to record the outcome of a follow-up instead of simply clearing a flag.
- Provide a dashboard summary for households monitored, visits completed, missed visits, follow-ups, and pending requests.

### Phase 3 — Resident requests and announcements

- Allow a resident to submit a symptom concern, assistance request, or appointment request with optional details.
- Give staff an inbox with request status, assigned handler, timestamps, and a written response or next step. Let the resident see whether their request is pending, answered, or closed.
- Let authorized staff publish announcements with title, message, audience/area, and publication or expiry dates.
- Keep this as a communication workflow; do not present it as emergency or clinical consultation unless a separately approved workflow is designed.

### Phase 4 — Guided symptom clarification

- Start with a short, structured symptom intake: main concern, when it began, duration, severity as described by the resident, and follow-up questions relevant to the selected symptom category.
- Use an authored, bounded question flow reviewed by qualified health staff. Do not ask an open-ended AI model to infer a disease or invent medical guidance.
- End with a clear next step, such as contacting a BHW or visiting the health center. Any urgent escalation text and triggers must be supplied or approved by qualified health staff.
- Save the resident's answers as a report for authorized review. Let the resident correct the answers before submitting.
- Explain that the feature helps clarify symptoms and route the concern; it does not diagnose or confirm a disease.

### Phase 5 — Area-level symptom trend signals

- Group submitted reports into staff-approved symptom categories and aggregate them by a defined time window and barangay.
- Compare current counts with a baseline or another rule approved for the pilot. Decide the minimum report count, time windows, and review thresholds with health staff; do not hard-code a guessed outbreak threshold.
- Show only aggregated trend information to authorized staff. Avoid exposing names or individual report details on an area map or community dashboard.
- Label an alert as an unusual increase that needs staff verification. Record who reviewed it, what action was taken, and whether it was dismissed, monitored, or escalated through the barangay's approved process.
- Do not label a signal as a virus, disease, or confirmed outbreak, and do not publish a public warning automatically.
- Pilot with fictional or synthetic data first. Evaluate missed signals, false alarms, data completeness, and staff workload before considering real-world use.

### Later ideas to evaluate

- More detailed maternal and child health schedules.
- Medicine availability or supply monitoring.
- Nutrition tracking.
- SMS reminders or notifications, if the project has a suitable provider and a clear opt-in/operational process.
- A React Native mobile client, if a web app is not sufficient for residents or BHWs.

### Requirements to settle before a real pilot

- Confirm the final product name: the pitch and prototype use “Barangay HealthLink,” while the repository currently uses “MediTrack.”
- Verify the superuser's registration-review and BHW account-creation workflows in the app, including initial credential delivery and area assignment.
- Confirm required resident and household fields, which data is optional, and how records are corrected or removed.
- Have health staff approve symptom categories, follow-up questions, urgent escalation language, and staff response workflow.
- Agree with health staff on area aggregation, alert review thresholds, recipients, and the steps after a signal appears.
- Define access, retention, consent/notice, and audit requirements before collecting real health reports.
- Confirm the interface language and whether low-connectivity or offline use is required.

The standalone HTML prototype uses made-up sample residents and in-memory JavaScript data. Its screen flow includes Health Worker and Resident views, a dashboard, resident search/details, visit recording, follow-up actions, reminders, and resident requests that can be answered in the demo. Changes are lost when the page is reloaded; it has no backend integration or real resident data.

## Sample prototype review

Source reviewed: `Barangay-HealthLink-Prototype-1.html`. This is a useful clickable concept demo: it makes the two user views and the follow-up dashboard concrete, includes responsive layout and keyboard focus styling, and labels its resident data as fictional. This was a source review; the HTML was not launched in a browser during this review.

Before carrying its behavior into the application, account for these limitations:

- The role switch is only a view toggle. A resident can select any sample resident, so it is not authentication or access control.
- All records, messages, and counts live in JavaScript memory. They disappear on reload and are shared across the demo views in one browser session.
- “Respond” only changes a request to answered; it does not capture or show a BHW response. The “Mark followed up” action clears missed visits and advances reminders without recording who followed up, when, or what happened.
- Visit entry accepts incomplete or implausible values. A BP-only entry is also given a default temperature, and no units/range validation or measurement context is saved. Production forms need server-side validation and a reviewed data model.
- The abnormal-reading flags are illustrative code rules, not clinical guidance. Have qualified health staff review any thresholds and wording; present flags as prompts for BHW review, never as a diagnosis.
- The resident lookup lets the user choose another person's record. Real health information needs role-based authorization, careful data minimization, audit history, and an approved privacy and retention approach before live data is used.
- Requests and announcements have no status history, dates, scheduling workflow, or persistence. The demo's announcements are fixed sample text.
- The interface is English-only and uses a sample web layout. Confirm language, accessibility, and mobile-device needs with intended barangay users before finalizing the real interface.

The first code slice now includes authenticated roles, resident/household records, schedules, visits, follow-ups, requests, and announcements. Screening rules still need health-staff review and must stay outside diagnostic language.

For the symptom and area-signal ideas, have health staff review the question flow, urgent escalation wording, symptom categories, alert threshold, and staff response process before using real reports. Health information is sensitive; define access, aggregation, retention, and approved use before collecting it.

## Prototype success measures and rollout ideas

The pitch suggests measuring checkups completed, flagged residents reached by BHWs, missed appointments identified, response time to assistance requests, and households with up-to-date records. Sample targets in the pitch are examples and should be set based on what a pilot can actually measure.

The proposed rollout is a small pilot with sample or volunteer households, improvements based on resident/BHW feedback, a barangay rollout with training, and possible later scaling to nearby barangays or the municipal health office. Long-term ideas include medicine availability and nutrition tracking.

## Technology choices

| Area | Current choice / direction |
| --- | --- |
| Backend | Laravel 13, PHP 8.3+, API routes in `backend/routes/api.php` |
| Web frontend | React 19, TypeScript, Vite, Tailwind CSS 4; React Router, TanStack Query, Zustand, React Hook Form, and Zod are configured for the web client |
| Database | PostgreSQL 17 in Docker Compose |
| Authentication | Laravel Sanctum bearer tokens with resident/BHW/health-center roles and scoped API routes; owner runtime verification pending |
| State management | Zustand for shared client state and TanStack Query for server state |
| Realtime | Laravel Reverb or Pusher are future options; neither is configured in the current project. |
| Mobile | React Native is a possible future client; no mobile app is present in this repository. |
| Containers | Dockerfiles for backend/frontend and root Docker Compose file for backend, frontend, admin, and PostgreSQL |

## Developer tools and environment

The project owner's working setup and preferences:

- OS: Fedora 44 with KDE Plasma
- System and developer packages: DNF
- Desktop applications: Flatpak
- Editor: VS Code
- Database GUI: DBeaver Community
- API client: Postman or Insomnia
- AI coding agent: Codex CLI
- Version control: Git, with GitHub as the intended remote/collaboration host
- SSH authentication is preferred for regular GitHub fetch/push use.
- GitHub Education benefits are available to explore for student projects.

## Hosting and deployment direction

### Current setup described by the owner

- Azure VM for hosting, provisioned through GitHub Education.
- nginx and MySQL/MariaDB are set up on the VM.
- Cloudflare Tunnel connects the domain to the VM without exposing the VM's public IP directly. Cloudflare is used for DNS, TLS, and edge protections; Azure provides the VM compute.
- Domain was obtained through the GitHub Education benefit via name.com.

Production configuration is not represented or verified in this repository yet. Treat the description above as the owner's deployment notes, not as a deployment audit.

### Other hosting options to consider later

- Render or Railway for managed application hosting with free-tier limits.
- Oracle Cloud Always Free for a self-managed VM, subject to current eligibility and limits.
- Vercel, Netlify, GitHub Pages, or Cloudflare Pages for static frontend-only projects; these do not directly host a conventional Laravel plus database application.
- InfinityFree for basic PHP hosting, with potential resource and SSH limitations.

Check current provider plans before choosing a service because free tiers and eligibility can change.

## Repository snapshot (2026-10-19)

Observed in the repository:

- Laravel API includes Sanctum authentication, role and active-account middleware, resident and staff workflows, and eleven new health-domain migrations.
- React includes a public landing page and role-specific resident and staff workspaces.
- Docker Compose defines `backend`, `frontend`, `admin`, and `postgres` services. PostgreSQL uses database `meditrack`, a persistent `postgres_data` volume, and host port `5433` mapped to container port `5432`. Frontend dependencies are installed in the image and persisted in a named `frontend_node_modules` volume.
- PostgreSQL is the only configured application database and Docker Compose service. The backend image installs PDO PostgreSQL support; MySQL and MariaDB connections are removed from Laravel's database configuration.
- The new tables cover households, residents, appointments, visits, follow-ups, requests, announcements, symptom reports, area rules/signals, and activity logs. They have not been migrated in this implementation pass.
- React Native, websocket broadcasting, and production deployment configuration remain future work.

## Configuration item to reconcile

The backend `.env.example` targets PostgreSQL at host `postgres` and port `5432`. The Compose container uses the local development password `meditrack_local` by default; if `POSTGRES_PASSWORD` is set in the root Compose `.env`, set the same value as `DB_PASSWORD` in the private `backend/.env`. This default is only for local development and must not be used outside a local environment. `docker compose down` preserves the PostgreSQL database volume. Existing MariaDB records were not copied to PostgreSQL. Automatic area alerts are off unless `MEDITRACK_AREA_ALERTS_ENABLED=true` is explicitly configured after review.

## Ideas folder note

The source material reviewed is in `/home/Snowden/Documents/BHL/Ideas/`:

- `Barangay-HealthLink-Prototype-1.html` — standalone interactive demo with sample data.
- `Barangay_HealthLink_Hackathon_Pitch.docx` — project problem, users, proposed features, SDG 3 alignment, expected outcomes, and rollout plan.
- `Hackathon_Pitch_Evaluation_Rubric_with_SDG.docx` — scoring criteria and SDG alignment guide used for the pitch.

This summary is maintained in the MediTrack repository under `docs/`. Keep product-specific additions in the project documentation and label unconfirmed requirements as proposals.
