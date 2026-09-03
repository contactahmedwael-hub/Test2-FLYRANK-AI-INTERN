# WORKFLOW.md — Vague Prompt vs. Precise Prompt

Feature: an Account Settings form (display name, email, optional password change, notification toggles), built twice from the same one-line brief, on independent branches: `round-1-vague` (single lazy prompt, accepted as-is) and `round-2-precise` (spec with file references, constraints, example behavior, and a test-then-verify step, run fresh in Cursor).

## Correctness

Round 1's `settings-form.js` is 24 lines and validates almost nothing: name is checked for literal emptiness only (`name == ''`), so `"   "` passes; email validation is `email.includes('@')`, so `"@"` alone passes; there is no confirm-password field at all despite having a password input. Round 2's `settings-form.js` (297 lines) implements the full rule set from the spec — 2–50 character name with a letters/spaces/hyphens regex, a real email pattern, password complexity (length + letter + number), and a `validateConfirmPassword` function — and is backed by `settings-form.test.js` (295 lines, 26 tests), which I cloned and ran fresh (`npm install && npx vitest run`): 26/26 passing.

## Accessibility

Round 1's labels have no `for`/`id` association at all — a screen reader gets zero programmatic link between label and input. Round 2 wires every label correctly, plus `aria-invalid`, `aria-describedby` pointing at live error text, `role="alert"` on field errors, `role="status"`/`aria-live="polite"` on the success banner, and error styling that isn't color-only (icon + background, not just a red border).

## Edge cases

Round 1 has no guard against whitespace-only input, no confirm-password requirement, and no double-submit lock (a blocking `alert()` masks this rather than solving it). Round 2's test suite explicitly covers all four edge cases the brief called out: empty submit, whitespace-only required fields, password-set-but-confirm-empty, and rapid double-submit — plus one I found by manually reviewing the logic and Cursor hadn't: clearing the password field back to empty left a false "passwords don't match" error against stale confirm-field text. I fixed the validation function and added a regression test for it.

## Review effort

Round 1 took seconds to generate and zero seconds to "review" — I just accepted it — but every bug above would have surfaced in actual use. Round 2 took longer to prompt and longer to run in Cursor, but needed almost no fix-up from me: two issues, both small. That's the mentor-tip lesson in practice — round two felt slower and was faster end-to-end once you count the debugging Round 1 would've cost.

## AI mistake caught

Round 2's committed test file was named `settings-form_test.js` (underscore) instead of `settings-form.test.js` (dot) — Vitest's default file matcher never found it. Running `npx vitest run` returned "No test files found, exiting with code 1" despite the agent's own workflow claiming to have run tests. The suite existed and was well-written; it had just never actually executed. Caught by running it myself, not by reading the code.
