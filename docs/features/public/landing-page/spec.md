# Public Landing Page

**Status:** Implemented in code — the React app has a responsive public MediTrack landing page with sign-in and resident registration entry points. Browser/device review remains with the project owner.

The page uses MediTrack as the working name. The pitch uses Barangay HealthLink, so the final brand still needs confirmation before publication.

## Purpose

Introduce the community health project to residents, Barangay Health Workers (BHWs), and health-center staff. Help visitors understand the service and reach the appropriate sign-in or account-enrollment path.

## Proposed page content

- A concise project introduction that explains the barangay-level health monitoring and follow-up purpose.
- A short explanation of who the service is for: residents, BHWs, and authorized health-center staff.
- A plain-language overview of planned capabilities, such as checkup reminders, resident reports, BHW follow-up, and community trend review. Clearly label anything unavailable as planned or coming later.
- A statement that symptom reporting is intended to clarify concerns and guide next steps, not diagnose illnesses.
- Primary actions for signing in and starting the appropriate account-registration or enrollment process.
- Optional sample screenshots or illustrations using fictional content only.
- Basic contact/help information only after the project owner confirms which real channels should be published.

## Behavior and access

- The landing page is public and must not expose resident records, private announcements, symptom reports, or staff-only dashboards.
- Sign-in and registration actions link to the actual account routes once those flows are implemented. Do not advertise a registration path that does not exist.
- Authenticated users may be directed to their role-appropriate workspace if that behavior is later approved and implemented.
- The page must work on mobile and desktop browsers and use the existing React/Vite frontend.

## Acceptance notes

- A first-time visitor can identify the project's purpose and intended users without signing in.
- Planned features are not presented as available services.
- Public content contains no real or identifiable resident health information.
- Sign-in and registration calls to action lead to the correct implemented routes, or are clearly marked unavailable until those routes exist.
- Content is readable on narrow screens, keyboard accessible, and uses clear language for the intended barangay audience.

## Decisions needed

- Confirm the final product name: the repo currently says MediTrack while the pitch/prototype says Barangay HealthLink.
- Choose the page's primary language(s) and tone for residents and staff.
- Decide whether to include a public demo link and whether its sample data/content has been reviewed.
- Confirm official project contact details before publishing them.
