# BHW Visits and Follow-up

**Status:** Planned. The standalone HTML prototype demonstrates in-memory visit entry and follow-up buttons. The Laravel app has no persistent MediTrack visit, schedule, or follow-up domain tables yet.

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
- Whether BHW assignments are per purok, household, or another health-center-defined boundary.
- Which dashboard counts are useful and what denominator/time period they use.
