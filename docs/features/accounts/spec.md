# Accounts and Role Access

**Status:** Planned. The repository currently has generic Sanctum registration and login, but no MediTrack role model, health-center enrollment workflow, or role-specific profile flow.

## Purpose

Provide separate, authenticated workspaces for residents, Barangay Health Workers (BHWs), and authorized health-center staff. The server must decide which records an account can access; hiding a page or control in React is not authorization.

## Proposed actors

- **Resident** — views their own household/member information, submits a symptom report or request, and sees their own reminders and responses.
- **BHW** — accesses assigned or barangay-scoped resident records, records visits, reviews follow-up items, and responds to resident requests.
- **Health-center staff** — manages authorized staff membership and barangay-wide workflows, reviews area trend signals, and publishes health-center announcements.
- **System administrator** — operational role, if required; exact scope and whether this is separate from health-center staff still need a decision.

## Proposed account lifecycle

1. Resident self-registration or staff-assisted enrollment creates a resident account and links it to a verified household/member record.
2. BHW and health-center staff accounts are invited or created by an authorized person and approved before accessing health records.
3. Account status supports active, pending, suspended, and deactivated states, with a recorded reason and actor for staff changes.
4. Password reset, email/identity verification, session/token revocation, and account recovery use explicit flows that do not reveal whether another person's account exists.
5. Deactivation and deletion follow an agreed retention and health-record policy; do not silently erase required clinical or audit history.

## Authorization requirements

- Scope resident access to the authenticated resident's own records and permitted household relationships.
- Scope BHW access to the assigned barangay/area and any assignment rules approved by the project owner and health center.
- Scope health-center staff access to their authorized facility/barangay.
- Recheck authorization on every API request and every record identifier supplied by the client.
- Do not accept role, account status, barangay assignment, or approval state as trusted client input.
- Record sensitive staff actions, including access changes, record edits, and area-alert review.

## Acceptance notes

- A user cannot access another resident's report by changing a URL, API identifier, or request body.
- A pending, suspended, or deactivated staff account cannot access protected health workflows.
- Registration and login return only fields intended for the current actor and never return password/token hashes.
- Logout/revocation makes the relevant token or session unusable.
- Role checks are enforced in Laravel routes/policies/queries, with React used only to present the authorized workflow.

## Decisions needed

- Whether residents self-register, are staff-enrolled, or both.
- What proves household membership and how household relationships can be changed.
- Who approves BHW and health-center accounts, and who can suspend them.
- Whether the operational administrator is a separate role.
- Required identity/contact fields, verification channels, and data retention periods.
