# BHW Visits and Follow-up

**Status:** Partial — Laravel models, migrations, API routes, and React screens now cover households, residents, appointments, visit records, and follow-ups. Migrations and runtime behavior have not been verified by the owner.

## Implemented in code

- BHWs can search residents in their assigned barangay; health-center staff can view the pilot barangay's records.
- Staff can create schedules and visits with optional blood pressure/temperature, mark appointments completed or missed, and add/close follow-up items with an action note. A missed appointment creates an open follow-up item.
- Visits marked unable to contact reject measurements. Follow-up appointment dates entered with a visit create a scheduled appointment. Activity logs record these changes.

## Remaining work

- Automatic clinical flags, repeated-miss rules, prenatal/vaccination reminders, visit correction history, and UI pagination/filter controls remain future work. Measurement values are stored as entered and do not drive clinical decisions.

## Proposed workflow

1. An authorized BHW opens the follow-up queue scoped to their permitted area.
2. The queue groups residents by the reason for review, such as a missed schedule, an upcoming checkup, or a staff-reviewed measurement rule.
3. The BHW opens a resident record and records a visit outcome, actual measurements taken, date/time, notes, and next action.
4. The system stores the actor and timestamp and updates the resident's follow-up status based on explicit workflow rules.
5. The BHW can schedule another visit or leave the case open with a reason. A flag must not disappear without a traceable action.

## Functional requirements

- Search and filter only within the BHW's authorized area and assignment scope.
- Record completed, missed, rescheduled, and unable-to-contact outcomes, subject to confirmation by the project owner/health staff.
- Store each measurement independently with its value, unit, time, and recording staff member. Missing measurements stay missing; the system must not invent defaults.
- Preserve visit history. Corrections should be traceable rather than silently overwriting a prior visit.
- Show the reason a resident appears in the queue and what action is expected next.
- Support pagination and avoid exposing bulk health records to unauthorized users.

## Safety and access boundaries

- Any abnormal measurement threshold and alert wording must be reviewed by qualified health staff before use.
- A measurement flag prompts human review; it does not diagnose a condition.
- Enforce resident, BHW, and health-center scope on the server for list, detail, create, update, and export operations.

## Decisions needed

- The visit outcome/status vocabulary and who can close a follow-up.
- Which measurements are in scope for the first release and what units/validation rules to use.
- Whether BHW assignments should cover one or multiple barangays.
- Which dashboard counts are useful and what denominator/time period they use.
