# 1Now Quick Support — Complete Code Tutorial

Narrated slide tutorial with application screenshots. Synthetic English narration. All integrations and booking records are simulated. Caption timing is approximate.

## 00:00:00 — The app and the support problem

File / focus: 01 / PRODUCT OVERVIEW

Welcome to this complete code walkthrough of One Now Quick Support. We will connect what you see on screen to the React components, the booking rules, local storage, and the tests. The problem is simple: a vehicle booked on Turo might still appear available on another calendar. This prototype helps an operator report that concern and helps support explain the next step. Every booking and connection is simulated. The app never contacts Turo or repairs a real calendar. The narration in this tutorial is computer generated.

## 00:00:31 — How the files fit together

File / focus: 02 / ARCHITECTURE

Start with the project map. Index dot HTML supplies a root element and loads main dot JSX. Main contains the visible application and imports the rules from logic dot JS and the design from styles dot CSS. Keeping booking rules in separate functions makes them easier to test without a browser. Logic dot test verifies those functions. The browser smoke script exercises real user actions. Package dot JSON lists commands and dependencies, while the lock file records exact dependency versions. There is no server side application or database.

```text
index.html
  └─ src/main.jsx       React views and state
       ├─ src/logic.js   Booking and ticket rules
       └─ src/styles.css

src/logic.test.js        Unit tests
scripts/browser-smoke.mjs
package.json + package-lock.json
vite.config.js
```

## 00:01:07 — Install, start, test, build

File / focus: 03 / PACKAGE.JSON + VITE.CONFIG.JS

To run the downloaded project on your computer, install a supported version of Node, open a terminal in the project folder, and run npm ci. This installs the versions recorded in the lock file. Npm run dev starts Vite, which prints the local browser address, usually on port fifty one seventy three. Npm test runs the unit tests. Npm run build creates the production files in dist. Npm run preview serves that production build for local checking. The Vite configuration enables the React plugin. Read the README for the exact Node version requirements.

```text
npm ci
npm run dev

npm test
npm run build
npm run preview

// vite.config.js
export default defineConfig({
  plugins: [react()]
});
```

## 00:01:42 — React starts with application state

File / focus: 04 / SRC/MAIN.JSX · APP

React starts by rendering App into the root element. Inside App, use State remembers tickets, the selected tab, the form, validation errors, and the selected ticket identifier. The active ticket is derived by finding that identifier in the current tickets array. This is why an update from support appears in the operator view: both views read the same application state. They are two views of one local data set. Switching tabs demonstrates the two roles, but it does not provide authentication or permission enforcement.

```text
// Focused excerpts from App
const [tickets, setTickets] = useState(initial.tickets);
const [tab, setTab] = useState('operator');
const [form, setForm] = useState({...emptyForm});
const [selected, setSelected] = useState(null);

const active = tickets.find(t => t.id === selected);

createRoot(document.getElementById('root'))
  .render(<App/>);
```

## 00:02:13 — The report form is controlled by React

File / focus: 05 / SRC/MAIN.JSX · FIELD + DEMO BUTTONS

The operator form uses controlled inputs. The value shown in each input comes from the form object. When someone types or chooses an option, the change handler copies the existing form and replaces just one field. The spread operator preserves all the other answers. The reusable field helper builds labels, inputs or selects, and error messages. Demo buttons copy a predefined scenario into the same form, rather than using a separate submission path. That makes the demonstration reliable while still exercising the actual validation and ticket creation code.

```text
// Focused input excerpt
value={form[key]}
onChange={e => setForm({
  ...form,
  [key]: e.target.value
})}

// Demo button action
setForm({...d.form});
setErrors({});
```

## 00:02:47 — Validate before creating a ticket

File / focus: 06 / SRC/LOGIC.JS · VALIDATE

Validation returns an object whose keys identify fields with problems. Required answers are trimmed, so spaces alone do not count as an operator name or booking reference. The date helper checks the expected year month day format, parses the date, and compares it with the normalized result to reject impossible dates. The end date cannot be earlier than the start date. Vehicle and connection selections are checked against allowed choices. App displays these errors beside the inputs, and create Ticket validates again so the rule is also enforced outside the form.

```text
// Focused validation excerpts
if (!form[key]?.trim())
  errors[key] = 'This field is required.';

if (!errors.start && !errors.end &&
    form.end < form.start)
  errors.end = 'End date must be on or after the start date.';

return errors;
```

## 00:03:22 — Mock records and date overlaps

File / focus: 07 / SRC/LOGIC.JS · BOOKINGS + OVERLAPS

The bookings array is a small fictional data set. Tesla has a Turo reservation and an overlapping direct reservation. Jeep and Toyota have their own sample Turo reservations. The overlaps function asks whether each booking starts on or before the other booking ends. If both comparisons are true, their date ranges overlap. The dates use a consistent sortable year month day format, and validation runs before detection. Shared days count as overlaps because this prototype does not model pickup and drop off times. In production, precise time and time zone rules would need additional design.

```text
export function overlaps(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

Tesla Turo:   Nov 10 ───────── Nov 14
Tesla Direct:       Nov 12 ───────── Nov 15
                    └─ overlap ─┘

Toyota and Jeep have separate sample bookings.
```

## 00:03:58 — Detection turns evidence into priority

File / focus: 08 / SRC/LOGIC.JS · DETECT

Detect first looks for a matching sample Turo reservation and then looks for overlapping records for the same vehicle, excluding the reported booking reference. A conflict takes highest priority, even when the connection is disconnected. If there is no conflict but the connection is disconnected or unknown, the result is medium priority. Otherwise the result is low priority. Each result contains an explanation and recommended next steps. The matched flag separately tells the interface whether the reported reference was found. Low priority means no known sample conflict, not proof that a real calendar is correct.

```text
// Decision flow, summarized from detect(form)
conflicts = same vehicle
          + different booking reference
          + overlapping dates

if (conflicts.length)     → High
else if (not Connected)   → Medium
else                     → Low

matched = reported Turo reference found in sample data
```

## 00:04:35 — Create a traceable support ticket

File / focus: 09 / SRC/LOGIC.JS · CREATETICKET

Create Ticket turns the submitted form into a support record. It rejects invalid input, trims the form strings, adds the detection result, and sets the initial status to Open. The identifier is one greater than the largest ticket number in the current array, formatted with leading zeroes. It is convenient for this single browser demonstration, not a globally unique identifier for a multi user service. The ticket also records a creation time and its first history entry. After a full demo reset, numbering starts again. A real shared service would need server managed identifiers and concurrency controls.

```text
// Ticket fields returned by createTicket
{
  id: 'QS-001',
  operator, vehicle, reference, start, end,
  connection, available, details,
  priority, summary, explanation, steps,
  conflicts, matched,
  status: 'Open', created, resolution: '',
  history: [{ at, actor: 'Operator', text: ... }]
}
```

## 00:05:11 — Save safely in the current browser

File / focus: 10 / SRC/MAIN.JSX + SRC/LOGIC.JS · STORAGE

Persistence uses local Storage, which stores strings in the current browser profile. JSON stringify converts the tickets array to text; JSON parse reads it back. Read Tickets performs a basic structural check on the result. If saved data is unreadable, the app shows a warning and prevents creating new tickets over it until the user resets. If writing fails, the new ticket state is not applied, and an error explains that the update was not saved. This is useful error handling, but local Storage is not a database, a secure vault, or a cross device synchronization service.

```text
// Focused persistence excerpt
localStorage.setItem(
  STORAGE_KEY,
  JSON.stringify(next)
);
setTickets(next);

// Loader
const parsed = JSON.parse(
  storage.getItem(STORAGE_KEY) || '[]'
);
```

## 00:05:46 — One ticket component, two views

File / focus: 11 / SRC/MAIN.JSX · BADGE + TICKET

The interface has three main component functions: App, Badge, and Ticket. Badge creates small status labels using CSS classes derived from its text. Ticket displays the report, detection explanation, matching reference disclosure, conflicting records, recommended next steps, resolution, and activity timeline. Its support prop controls which editing form appears. Support staff see status and note controls for unresolved cases. An operator viewing a resolved case sees the reopen form. Because this component is reused, explanations and updates remain consistent across both views. The ticket keys separate the local editing state for each ticket and role.

```text
// The same component receives different props
<Ticket ticket={active} support={false} save={save}/>
<Ticket ticket={active} support save={save}/>

// Badge maps text to a CSS class
<span className={`badge ${statusClass}`}>
  {children}
</span>

// Badge snippet is simplified for readability.
```

## 00:06:29 — Support updates preserve the history

File / focus: 12 / SRC/LOGIC.JS · UPDATETICKET

Update Ticket validates the chosen status and rejects an update that changes nothing and contains no note. It returns a new ticket object instead of modifying the old one. The history array is also copied, with the new support event appended. This immutable style helps React render updates predictably and makes tests easier to reason about. App replaces the matching ticket in its array, saves the array, and shows a confirmation. Investigating and Waiting for Operator are useful intermediate statuses: support can record progress and requests for information without pretending the concern is already resolved.

```text
// Focused update structure
return {
  ...ticket,
  status,
  resolution: status === 'Resolved'
    ? note.trim() : ticket.resolution,
  history: [
    ...ticket.history,
    { at: now, actor: 'Support', text: ... }
  ]
};
```

## 00:07:05 — Resolution requires an explanation

File / focus: 13 / SRC/LOGIC.JS · RESOLUTION GUARD

A support tool should not close a case without explaining the outcome. The resolution guard requires at least twenty trimmed characters before a ticket can become Resolved. The interface asks what was verified and communicated. The same note is stored as the documented resolution and added to the activity trail. This minimum length is a basic guard, not a quality guarantee. A human must still confirm the facts and agree on next steps with the operator. In a demonstration, clearly describe the outcome as simulated. Saving a resolution does not update a calendar or change a reservation.

```text
if (status === 'Resolved' &&
    note.trim().length < 20) {
  throw new Error(
    'Document a meaningful resolution ...'
  );
}

// A saved resolution is visible to the operator.
// No external platform is changed by this action.
```

## 00:07:41 — Reopening closes the feedback loop

File / focus: 14 / SRC/LOGIC.JS · REOPENTICKET

Reopen Ticket is the final part of the customer support loop. It accepts only resolved cases and requires at least ten trimmed characters describing what is still happening. The returned ticket changes back to Open and adds an operator event to the history. The old resolution is preserved, and the interface labels it as a previous resolution while the issue is open again. Support can see what was already attempted before deciding the next action. The reopening form does not automatically fix or escalate a real booking; it records a clear request for further human investigation.

```text
if (ticket.status !== 'Resolved') throw new Error(...);
if (reason.trim().length < 10) throw new Error(...);

return {
  ...ticket,
  status: 'Open',
  history: [
    ...ticket.history,
    { at: now, actor: 'Operator',
      text: `Reopened: ${reason.trim()}` }
  ]
};
```

## 00:08:15 — Responsive design and demo reset

File / focus: 15 / SRC/STYLES.CSS + RESET HANDLER

Styles dot CSS supplies the cream background, orange primary actions, rounded cards, grids, tables, and priority badges. Media queries adjust spacing and switch the operator workspace to one column on small screens. Focus styles help keyboard users, field errors use accessibility attributes, and a reduced motion rule disables transitions when requested. Reset Demo Data opens a confirmation dialog with keyboard handling. Confirming removes the application storage key and clears local React state. Cancelling keeps the tickets. These features improve usability, although the project has not undergone a full accessibility audit.

```text
/* Focused responsive rule */
@media (max-width: 700px) {
  .workspace-grid { grid-template-columns: 1fr; }
}

/* Motion preference */
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}

// Reset removes only the app storage key.
```

## 00:08:56 — Test rules and real user workflows

File / focus: 16 / UNIT TESTS + BROWSER SMOKE TEST

The thirteen unit tests use Node's built in test runner. They check overlapping dates, the three priorities, unknown connections, validation, ticket numbering, history, resolution, reopening, and stored data handling. The Playwright smoke test launches an isolated Chromium profile and clicks through the real interface. It checks required fields, an urgent ticket, investigation, the resolution guard, reopening, reload persistence, other scenarios, mobile overflow, reset, and corrupt data handling. The production build was also checked with the browser script. These checks passed during implementation. They do not prove every browser works; Firefox and Safari were not tested.

```text
npm test
npm run build

# Run while the dev server is active:
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser

# Or install Playwright Chromium first:
npx playwright install chromium
npm run test:browser
```

## 00:09:38 — A reliable demonstration sequence

File / focus: 17 / FROM FIRST REPORT TO FOLLOW-UP

For your assessment recording, tell a simple support story. Load the urgent demo and submit the report. Explain that the sample direct reservation overlaps the Turo booking, so a human should review it immediately. Move to the dashboard, record an investigation note, and save it. Then document a clearly simulated outcome and resolve the case. Return to the operator view and show the shared timeline and resolution. Finish by explaining how the operator can reopen the ticket. The README has a timed sequence for a separate walkthrough under three minutes; this longer tutorial is for understanding the code.

```text
1. Urgent Booking Conflict demo
2. Check Issue & Create Ticket
3. Explain High priority and DR-1048 overlap
4. Support Dashboard → Investigating → save note
5. Resolved → explain simulated outcome → save
6. Operator View → review the outcome
7. Reopen if the issue remains unresolved
```

## 00:10:15 — What to remember and where to extend

File / focus: 18 / WRAP-UP + LIMITATIONS

You now have the full code map. React handles the views and state, pure functions handle booking and ticket rules, local Storage preserves the demo, and tests verify the important paths. If this became a real product, it would need authenticated roles, a shared backend, trustworthy integration data, stronger data validation, and proper privacy controls. Those are outside this prototype. For this assessment, the most important design choice is the complete support loop: explain uncertainty, escalate booking conflicts, document the outcome, and let the operator tell you when the issue is still unresolved. The source and README are in your GitHub repository.

```text
Report → Validate → Detect → Create → Persist
                         ↓
               Investigate → Resolve
                         ↑        ↓
                         └─ Reopen

README.md: setup, scenarios, tests, limitations
GitHub: faseehasghar2/1NOW
No real integrations or customer data required.
```
