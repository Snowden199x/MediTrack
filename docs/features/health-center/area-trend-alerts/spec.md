# Area Symptom Trend Alerts

**Status:** Planned. No symptom-report storage, area aggregation, trend calculation, or alert review workflow exists in the current app.

## Goal and boundary

Help authorized barangay health staff notice an unusual increase in similar symptom reports in an area and decide whether to review it. A system alert is an unverified signal. It must not state or imply that a virus, disease, or outbreak is confirmed.

## Proposed workflow

1. Categorize reports using a symptom taxonomy reviewed by health staff.
2. Aggregate counts by approved area unit and time window. Do not show resident names or individual report details in the trend view.
3. Compare the observed count with a baseline/rule configured for the pilot and approved by health staff.
4. Create a staff-only signal that explains the category, area, time window, count, comparison, and rule version that triggered review.
5. Let an authorized reviewer record an outcome: investigate, monitor, dismiss as data noise, or escalate through the barangay's approved process.
6. Retain a review history so the team can evaluate alert usefulness and workload.

## Requirements and safeguards

- Determine alert thresholds, minimum counts, baseline windows, and response roles with health staff; keep these configurable and versioned.
- Avoid displaying granular counts where a small group could make a resident identifiable. Agree on a minimum aggregation size before real use.
- Limit the signal view to authorized staff and log access and review actions.
- Do not auto-send a public warning or tell a resident that an outbreak exists.
- Test first with fictional/synthetic reports. Assess false alerts, missed increases, reporting bias, completeness, and staff capacity before a live pilot.
- Document whether any signal must be escalated to the local health office and who has authority to do so.

## Decisions needed

- Which symptom categories count as similar for trend purposes.
- Area granularity (for example, purok or barangay) and time windows.
- Baseline method and threshold ownership.
- Minimum group size, retention, alert recipients, and escalation procedure.
- How to handle duplicate reports, residents reporting for family, and areas with low reporting volume.
