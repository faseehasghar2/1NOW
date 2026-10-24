# 1Now Quick Support

A small, complete customer-support prototype for rental operators and Turo hosts. Report calendar availability concerns, review fictional reservation overlaps, and keep operators informed through investigation, resolution, and reopening.

**Unofficial prototype — demonstration data only.** No affiliation, live integration, real booking checks, external authentication, or automatic calendar changes. Never use its sample results to make real booking decisions.

## Run locally

Requires Node.js 20.19+ or 22.12+ (validated with Node 24) and npm.

```sh
npm ci
npm run dev
```

Open the address printed by Vite (normally port 5173). In a cloud development workspace, use its port-forwarding feature for port 5173. The server binds to `0.0.0.0` for cloud use. If npm cannot write its default cache, use `npm ci --cache /tmp/1now-npm-cache`.

```sh
npm test          # Node's built-in test runner
npm run build    # Production output in dist/
npm run preview  # Serve the production build, normally port 4173
```

## Features

- Three one-click scenarios with realistic fictional November 2026 bookings.
- Required-field and date validation; date-only inclusive overlap detection.
- High-priority booking-conflict escalation, medium-priority disconnected/unknown connections, and low-priority monitoring guidance.
- Unique sequential ticket IDs, priorities, explanations, recommended actions, and sample conflict details.
- Support dashboard with status changes, investigation notes, resolution documentation, and an operator-visible activity trail.
- Resolution requires a note of at least 20 characters; operators can reopen with a reason of at least 10 characters. Length is a basic guard, not a substitute for human judgment.
- localStorage persistence, clear storage error messages, and reset confirmation.
- Responsive desktop/mobile UI, keyboard-accessible controls, and reduced-motion support.

## Browser smoke check

With the development server running in another terminal:

```sh
npx playwright install chromium
npm run test:browser
```

For an installed Chromium (as in this cloud environment), use `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`. Optionally set `APP_URL` to test a different server address. This uses a fresh isolated browser profile; it does not touch your regular demo tickets. It checks the full resolution/reopen loop, all demo scenarios, required and reversed-date validation, persistence, mobile overflow, reset, corrupt storage handling, and browser runtime errors. Screenshots are written under `/tmp`.

## Three-minute Loom walkthrough

1. **0:00–0:20:** Introduce the problem and the demonstration-only disclaimer. Click **Urgent Booking Conflict** to populate the form.
2. **0:20–0:50:** Review dates and click **Check Issue & Create Ticket**. Show the ticket number, high priority, overlapping direct reservation, and human escalation guidance.
3. **0:50–1:20:** Open **Support Dashboard**, choose **Investigating**, and add: “Reviewing the two sample reservations; contacting the operator to verify vehicle availability.” Save the update.
4. **1:20–2:00:** Choose **Resolved**. Enter a clearly simulated outcome, for example: “Demo review complete: the operator confirmed the sample conflict was reviewed and agreed next steps. No external booking was changed.” Save.
5. **2:00–2:30:** Return to **Operator View**. Show the updated status, activity, and documented outcome. Explain that the operator can reopen if the problem persists.
6. **2:30–2:50:** Briefly mention the disconnected/no-known-conflict scenarios and Reset Demo Data.

## Test scenarios

| Scenario | Vehicle | Expected result |
| --- | --- | --- |
| Urgent Booking Conflict | Tesla Model 3, TU-84219, Nov 10–14 | High priority; direct booking DR-1048 overlaps Nov 12–15 |
| Calendar Disconnected | Jeep Wrangler, TU-73502, Nov 18–21 | Medium; reconnect and verify with operator |
| No Known Conflict | Toyota Corolla, TU-62031, Nov 24–27 | Low; verify synchronization and monitor |
| Unknown connection | Any nonconflicting report with Unknown selected | Medium; human verification |
| Invalid or missing dates | Blank, invalid, or reversed dates | Submission rejected |
| Undocumented resolution | Resolved with a short/empty note | Update rejected |
| Reopening | Resolved ticket with a substantive operator reason | Open; prior history and outcome retained |

The automated logic tests exercise overlaps (including shared days), vehicle filtering, all three demo priorities, unknown connections, validation, ticket numbering, immutable history, resolution guards, reopening, and serialization/corrupt storage handling.

## Data and limitations

Data stays in this browser profile under `1now-quick-support-v1`. Reset removes it. This is a single-browser prototype: no account isolation, access control, shared backend, cross-device synchronization, or notifications. Operator/support tabs demonstrate roles; they do not enforce permissions. Avoid entering personal or sensitive information. Only the supplied mock records are searched. Unknown booking references are explicitly disclosed. Shared booking days are treated as overlaps because pickup/drop-off times are not modeled. No external platform is checked, reconnected, fixed, charged, or cancelled. Text length guards cannot establish that a resolution truly happened; a human must verify and communicate it. No response-time promise is implied.

## Project structure

- `src/main.jsx`: React views and complete support workflow.
- `src/logic.js`: mock data, validation, conflict detection, ticket transitions, storage loading.
- `src/logic.test.js`: dependency-free unit tests.
- `src/styles.css`: responsive visual design.

## GitHub publishing

The npm project is named `1now-quick-support`. The supplied checkout currently belongs to `faseehasghar2/1NOW`; creating a differently named GitHub repository is a separate publishing step. Create an empty repository called `1now-quick-support`, then add it as a remote and push the prepared branch. Never commit `node_modules`, `dist`, credentials, or `.env` files. The lockfile is included for repeatable installation. No paid service or credentials are required to run this app. Browser smoke checks use Playwright as a development dependency only.
