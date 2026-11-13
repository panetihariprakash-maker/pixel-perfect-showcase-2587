# Week 1 evaluation checklist

13 November 2026. COMPLETE refers to the demonstrated Week 1 foundation, not production readiness.

| Requirement | Expected | Actual implementation / source | Evidence and result | Status |
|---|---|---|---|---|
| Plan user flow, up to five main areas | Document navigation and role boundaries | README, USER_FLOW.md; existing public routes, protected Dashboard/owner/admin | Mermaid flow and public/guest browser navigation verified; no duplicate screens created | COMPLETE |
| Google AI Studio app/navigation | Genuine Gemini API, safe key, request/response explanation | AssistantWidget, assistant API route, assistant-contract; README setup | Live generated price/capacity answer and empty approved database catalogue verified; session follow-up/Stop previously verified and cancellation covered by tests. Manual AI Studio setup screenshot outstanding | PARTIAL |
| Forms, inputs, outputs/actions | Validated submissions, feedback, actual operations | AuthForm, BookingDialog, guest and owner/admin sections | Guest sign-in/profile/request/cancel/enquiry/activity readback verified; owner database tests; email signup/confirmation and every privileged UI form not fully verified | PARTIAL |
| Connect screens to team data | Private real persistence with permission enforcement | profiles/user/guest_bookings/guest_state, owner tables, admin functions, SQL migrations | Live privacy and owner integrity tests; 12 RLS tables; staff still demo, no approved partner rows presently | PARTIAL |
| Explain learning/show foundation | Technical architecture, evidence, honest personal reflection | README, technical report, implementation report | Technical explanation supplied; student's genuine reflection/screenshots and final repository visibility must be completed | PARTIAL |

## Evaluator feedback response

| Feedback | Response | Evidence needed |
|---|---|---|
| Insufficient technical explanation | README maps modules, architecture, backend, auth, setup and limits | Review repository README rendering |
| Missing Google AI Studio details | Setup/model/security and stream workflow documented | Student's AI Studio screenshot with key fully hidden |
| Missing data-flow explanation | Mermaid diagrams plus source/table mapping and demo/real matrix | Saved guest record readback, safe schema/RLS view |
| Missing Week 1 learning reflection | Editable prompts, no invented first-person experiences | Student completes Section 8 |
| Inaccessible/insufficient GitHub README | Comprehensive committed README and linked reports | Student verifies the evaluator can access the connected repository |

## Evidence to attach before resubmission

- [ ] Your Home, rooms, signed-in Dashboard and mobile sidebar screenshots.
- [ ] Real Gemini answer and contextual follow-up with no secrets visible.
- [ ] Private profile/enquiry/activity/booking readback after refresh, with personal data hidden.
- [ ] Real email confirmation and password recovery completed from a receiving inbox.
- [ ] Google OAuth consent completed with your account.
- [ ] Owner/admin demonstration using authorized accounts, never a guest role override.
- [ ] Test summary and automatic successful build evidence; disclose full lint status.
- [ ] Your own reflection and evaluator-accessible GitHub repository link.

See WEEK-1-IMPLEMENTATION-REPORT.md for current measured checks. Do not mark unchecked evidence as collected.