# Accounts and Role Access

**Status:** Implemented in code, pending owner runtime verification — resident, BHW, health-center, and superuser roles exist. The private admin client on local-only port `5174` shows resident/BHW totals and supports account listing, name/email edits, archiving, restoring, and deleting archived accounts. The public web client on `5173` has no admin sign-in link or page. Database migrations and runtime behavior still need verification.

## Roles in plain language

- **Resident** — taong nakatira sa barangay at gumagamit ng health-center services. Sa MediTrack, puwede siyang mag-sign up, mag-submit ng concern o request, at makita ang sarili niyang schedule at mga sagot ng health team.
- **BHW (Barangay Health Worker)** — community health worker na tumutulong sa barangay health center. Sa MediTrack, ang BHW ay nakatalaga sa isang barangay, tumitingin ng resident records sa sakop niya, nagtatala ng home visit, at nagfo-follow up sa mga kailangang balikan.
- **Health-center staff** — tauhan ng health center na tumitingin sa mas malawak na barangay workflows, announcements, at area trend review.
- **Superuser / admin** — account na nagre-review ng bagong resident registration at gumagawa ng BHW accounts. Hindi ito nakakapasok sa resident health-record workflows.

## Implemented in code

- Public registration creates a pending resident account and household/resident record, without issuing a token. The resident cannot sign in until approval. Health-center staff can view resident/BHW accounts and change their status, but cannot create BHW accounts.
- The resident registration form requires first name, last name, birthday, age, sex, region, city/municipality, barangay, email, password, and password confirmation. Middle initial and house number/street are optional. Birthday must be today or earlier. The resident's display name is assembled from the name fields; name, birthday, age, and sex are stored in the resident record, while the address is stored with the household.
- Region, province where applicable, city/municipality, and barangay options are loaded from the Philippine geographic-code API through public Laravel `/api/locations/*` proxy routes. The API response is cached for 24 hours. House number/street is an optional local address detail. NCR has no province selection.
- Superusers sign in through the separate admin client at `http://localhost:5174/`. Docker Compose binds this port to `127.0.0.1`, so it is reachable from the host machine only and is not advertised or served on the public frontend port `5173`. The admin dashboard shows resident, BHW, pending, and archived counts, and lists searchable/filterable resident and BHW accounts. Superusers can edit account name/email, archive an account to revoke access while preserving its previous status, restore it later, or permanently delete an archived account. Deleting a resident login preserves that resident's health records. Pending registrations must be reviewed before they can be archived. The admin API also provides approve/reject actions and BHW account creation. Rejection requires a reason. Laravel restricts these routes to the superuser role, and the public login endpoint does not issue superuser sessions.
- Admin-created BHW accounts require a name, unique email, assigned barangay, region/city (and province when applicable), and an initial password with confirmation. House number/street is optional. The account is active immediately; the admin must share the initial password privately. Creation is recorded in the activity log.
- `meditrack:bootstrap-superuser` creates the initial superuser or updates the configured name and password for an existing active superuser, using private `backend/.env`. It refuses to replace an email owned by a non-superuser account.
- Sanctum bearer tokens expire after seven days. Login checks active status; protected routes recheck it. Suspending or deactivating an account revokes its tokens.
- Laravel scopes BHW records, requests, symptom reports, and household creation to the assigned barangay code; residents can access their own records. Staff changes have basic activity-log entries.

## Registration approval flow

1. A resident submits the public registration form.
2. The new registration stays pending and cannot access resident features.
3. A superuser reviews the resident's name, birthday, age, sex, and submitted household address, then approves or rejects the registration. Only an approved registration becomes active.
4. The superuser/admin creates BHW accounts and assigns each account to one barangay; there is no public BHW self-registration.

The code implements this workflow. Owner runtime verification of account creation, permissions, and registration review is still pending.

## Remaining work and decisions

- Add a password reset/change flow for BHW accounts; the current creation form sets an initial password that the admin shares privately.
- Health-center staff can update a BHW's barangay assignment after creation by choosing a new address hierarchy.
- Keep registration review separate from health-record access unless broader admin powers are explicitly approved.
- Define identity and household membership verification, account recovery, password reset, staff change reasons, and a reviewed retention policy. Public self-registration currently accepts self-declared area and identity.
- The current pilot assumes one barangay. Health-center accounts can see all areas in that deployment; multi-facility authorization is not implemented.
- Decide how household membership is verified and whether to add a phone/contact field or other verification channel. Current public registration uses self-declared identity and address.

## Authorization requirements

- Scope resident access to the authenticated resident's own records and permitted household relationships.
- Scope BHW access to the assigned barangay/area and any assignment rules approved by the project owner and health center.
- Scope health-center staff access to their authorized facility/barangay.
- Recheck authorization on every API request and every record identifier supplied by the client.
- Do not accept role, account status, barangay assignment, or approval state as trusted client input.
- Record registration approval/rejection, access changes, record edits, and area-alert review with the responsible actor.
- Do not grant health-record access only because an account can review registration submissions.

## Acceptance notes

- A pending registration cannot access resident features until a superuser approves it.
- Only a superuser/admin can create a BHW account; health-center staff and the public cannot self-register or create one.
- Only a superuser can list, edit, archive, restore, or delete resident/BHW accounts. Archived accounts cannot sign in; permanent deletion requires archiving first.
- A user cannot access another resident's report by changing a URL, API identifier, or request body.
- Suspended or deactivated accounts cannot access protected health workflows.
- Registration and login return only fields intended for the current actor and never return password/token hashes.
- A new resident cannot submit registration without the required demographic details (including a valid birthday not in the future), contact details, and geographic address selections; middle initial and house/street remain optional.
- Logout/revocation makes the relevant token or session unusable.
- Role checks are enforced in Laravel routes/policies/queries, with React used only to present the authorized workflow.
