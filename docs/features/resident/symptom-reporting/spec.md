# Resident Symptom Reporting

**Status:** Partial — the React flow asks category-specific questions and saves reports through the Laravel API. Questions and next-step wording are draft content and require health-staff approval before use with real patients. Migrations and runtime behavior have not been verified by the owner.

## Implemented in code

- Residents choose a concern category, answer fixed follow-up questions, and may add onset date, self-described severity, and details. The API validates question keys and allowed choices, stores the questionnaire version, and returns a generic contact-the-health-team message.
- Residents can see their own report status; authorized BHW/health-center staff can review a report and save a note. The app does not infer a disease or prescribe treatment.

## Remaining work

- Have qualified health staff approve the questions, language, next-step text, and urgent escalation process. Add a pre-submit review/correction screen and resident notice/consent workflow. Do not treat the current generic next step as medical triage.

## Goal and boundary

Help a resident describe what they are experiencing through a short, understandable sequence of questions, then direct them to an appropriate next step. The first release clarifies symptoms and routes the concern; it does not name a disease, diagnose, prescribe, or replace a health worker.

## Proposed flow

1. Explain what information is collected and who can review it before the resident starts.
2. Ask the resident to choose or describe the main concern and when it began.
3. Ask bounded follow-up questions selected for that symptom category. Questions and answer options must be authored or approved by qualified health staff.
4. Summarize the answers and let the resident correct them.
5. Show an approved next step, such as contacting a BHW or visiting the health center. Any urgent escalation wording and conditions must be defined by qualified health staff.
6. With the resident's submission, create a report visible only to authorized staff and show the resident its submission/status.

## Requirements

- Use fixed, reviewed question flows for the initial release; do not let a generative model invent questions, diagnoses, or treatment advice.
- Keep the language simple and support the language selected for the target barangay.
- Allow “I don't know,” “not applicable,” or skipping optional questions where appropriate.
- Record report submission time, symptom onset as reported, area association needed for authorized review, and the question-flow version.
- Keep personally identifying information separate from area-level aggregate displays.
- Give staff a way to record review and follow-up without changing the resident's original answers.

## Decisions needed

- Which symptom categories and questions health staff approve for the pilot.
- What next-step messages and urgent escalation conditions are approved.
- Whether anonymous reports are allowed and how reports link to an existing resident account.
- What should happen when a resident is a child or submits on behalf of another household member.
- Which languages, reading level, and assisted-reporting options are required.
