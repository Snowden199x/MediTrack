# Admin Symptom Reports

**Status:** Prototype — the admin page, filters, area alert rule, table and side panel are implemented with sample reports. It is not connected to a live admin API yet. Wording and grouping rules still need health-staff approval.

## Implemented in code

- The admin sidebar has a **Symptom reports** entry with a badge for the number of new sample reports.
- Summary cards show new reports, urgent reports (severe or difficulty breathing), scheduled checkups, and reports resolved in the last seven days.
- An area alert appears when the editable rule in `frontend/src/admin/symptomReportsConfig.ts` matches: at least three reports of the same concern in the same area within three days. “View these reports” filters the table to that group.
- The table shows resident, area, main concern, severity, date reported, and status. It sorts newest first, keeps unresolved severe and breathing reports at the top, and truncates long values (the full value is in the side panel).
- Filters cover resident name, concern, severity, area, and status, with an empty state and a loading state. Below 900px the table becomes one card per report.
- The side panel shows resident details, the chat answers as question-and-answer rows, notes, past reports and checkups, and actions: schedule a checkup, send advice from quick templates, mark reviewed, and mark resolved.
- Scheduling a checkup or sending advice writes an entry to the in-memory outbox in `frontend/src/shared/residentNotifications.ts`. Nothing is delivered yet; the resident news feed can read from that function later.
- Sample data (including a fever cluster in one area so the alert is visible) lives in `frontend/src/admin/symptomReportsConfig.ts`. Replace `MOCK_REPORTS` with the API response when the endpoint exists.

## Remaining work

- Add an admin endpoint for symptom reports and replace the sample data and the sidebar badge count.
- Connect the resident notification outbox to the resident page, including read state.
- Have health staff approve the grouping rule, sample templates, and urgent wording before a pilot.
- Decide how the existing “Reports and requests” page relates to this new page.

## Safety boundaries

- The page groups symptoms only. It does not name a disease, diagnose, prescribe, or generate a public warning.
- The area alert is a prompt for staff review, not a confirmed outbreak.
