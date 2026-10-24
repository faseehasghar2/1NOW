export const vehicles = ['Tesla Model 3', 'Toyota Corolla', 'Jeep Wrangler'];
export const statuses = ['Open', 'Investigating', 'Waiting for Operator', 'Resolved'];
export const bookings = [
  { vehicle: 'Tesla Model 3', source: 'Turo', reference: 'TU-84219', start: '2026-11-10', end: '2026-11-14' },
  { vehicle: 'Tesla Model 3', source: 'Direct', reference: 'DR-1048', start: '2026-11-12', end: '2026-11-15' },
  { vehicle: 'Jeep Wrangler', source: 'Turo', reference: 'TU-73502', start: '2026-11-18', end: '2026-11-21' },
  { vehicle: 'Toyota Corolla', source: 'Turo', reference: 'TU-62031', start: '2026-11-24', end: '2026-11-27' },
];
export const emptyForm = { operator: '', vehicle: '', reference: '', start: '', end: '', connection: '', available: '', details: '' };
export const demos = [
  { label: 'Urgent Booking Conflict', caption: 'Overlapping sample reservations', form: { operator: 'Alex Morgan', vehicle: vehicles[0], reference: 'TU-84219', start: '2026-11-10', end: '2026-11-14', connection: 'Connected', available: 'Yes', details: 'My Turo trip is confirmed, but these dates still appear available on the 1Now calendar.' } },
  { label: 'Calendar Disconnected', caption: 'Connection needs attention', form: { operator: 'Jordan Lee', vehicle: vehicles[2], reference: 'TU-73502', start: '2026-11-18', end: '2026-11-21', connection: 'Disconnected', available: 'Yes', details: 'The calendar connection appears disconnected. Please help verify my booked dates.' } },
  { label: 'No Known Conflict', caption: 'Verify sync and monitor', form: { operator: 'Sam Rivera', vehicle: vehicles[1], reference: 'TU-62031', start: '2026-11-24', end: '2026-11-27', connection: 'Connected', available: 'Yes', details: 'Please help confirm whether my calendar is displaying this booking correctly.' } },
];
export function overlaps(a, b) { return a.start <= b.end && b.start <= a.end; } // Inclusive date-only bookings: shared days require review.
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
export function validate(form) {
  const errors = {};
  for (const key of ['operator', 'vehicle', 'reference', 'start', 'end', 'connection', 'available']) if (!form[key]?.trim()) errors[key] = 'This field is required.';
  for (const key of ['start', 'end']) if (form[key] && !validDate(form[key])) errors[key] = 'Enter a valid calendar date.';
  if (!errors.start && !errors.end && form.end < form.start) errors.end = 'End date must be on or after the start date.';
  if (form.vehicle && !vehicles.includes(form.vehicle)) errors.vehicle = 'Choose a listed vehicle.';
  if (form.connection && !['Connected', 'Disconnected', 'Unknown'].includes(form.connection)) errors.connection = 'Choose a connection status.';
  if (form.available && !['Yes', 'No'].includes(form.available)) errors.available = 'Choose Yes or No.';
  return errors;
}
export function detect(form) {
  const matches = bookings.filter(b => b.vehicle === form.vehicle && b.source === 'Turo' && b.reference.toLowerCase() === form.reference.trim().toLowerCase() && overlaps(b, form));
  const conflicts = bookings.filter(b => b.vehicle === form.vehicle && b.reference.toLowerCase() !== form.reference.trim().toLowerCase() && overlaps(b, form));
  if (conflicts.length) return { priority: 'High', summary: 'Potential double-booking conflict', explanation: 'Overlapping reservations were found in the fictional booking records. A support specialist should review both bookings immediately.', steps: ['Escalate to a human support specialist immediately.', 'Verify both reservations and vehicle availability with the operator.', 'Agree on next steps with the operator before making any booking changes.'], conflicts, matched: !!matches.length };
  if (form.connection !== 'Connected') return { priority: 'Medium', summary: form.connection === 'Disconnected' ? 'Calendar connection disconnected' : 'Calendar connection needs verification', explanation: 'No overlapping sample reservation was found. The calendar connection needs human verification before availability can be trusted.', steps: ['Verify the connection status with the operator.', 'Guide the operator through reconnecting the calendar if needed.', 'Compare booked dates on both platforms and confirm the outcome with the operator.'], conflicts, matched: !!matches.length };
  return { priority: 'Low', summary: 'No known conflict in sample records', explanation: 'No overlapping reservation was found in the sample data. This does not verify live availability or prove synchronization is working.', steps: ['Compare the booking dates and reference on both platforms.', form.available === 'Yes' ? 'Investigate why booked dates appear available and escalate if this persists.' : 'Confirm the operator is seeing the expected availability.', 'Monitor the calendar and ask the operator to confirm the outcome.'], conflicts, matched: !!matches.length };
}
export function createTicket(form, tickets, now = new Date().toISOString()) {
  if (Object.keys(validate(form)).length) throw new Error('Please correct the form before submitting.');
  const number = Math.max(0, ...tickets.map(t => Number(t.id.replace('QS-', '')) || 0)) + 1;
  return { id: `QS-${String(number).padStart(3, '0')}`, ...Object.fromEntries(Object.entries(form).map(([k,v]) => [k, v.trim()])), ...detect(form), status: 'Open', created: now, resolution: '', history: [{ at: now, actor: 'Operator', text: 'Issue reported. Support review requested.' }] };
}
export function updateTicket(ticket, status, note, now = new Date().toISOString()) {
  if (!statuses.includes(status)) throw new Error('Choose a valid status.');
  if (status === 'Resolved' && note.trim().length < 20) throw new Error('Document a meaningful resolution (at least 20 characters), including what was verified and communicated.');
  if (status === ticket.status && !note.trim()) throw new Error('Add an investigation note or change the status.');
  return { ...ticket, status, resolution: status === 'Resolved' ? note.trim() : ticket.resolution, history: [...ticket.history, { at: now, actor: 'Support', text: `${status !== ticket.status ? `Status changed to ${status}. ` : ''}${note.trim()}` }] };
}
export function reopenTicket(ticket, reason, now = new Date().toISOString()) {
  if (ticket.status !== 'Resolved') throw new Error('Only resolved cases can be reopened.');
  if (reason.trim().length < 10) throw new Error('Please describe what is still happening (at least 10 characters).');
  return { ...ticket, status: 'Open', history: [...ticket.history, { at: now, actor: 'Operator', text: `Reopened: ${reason.trim()}` }] };
}
export const STORAGE_KEY = '1now-quick-support-v1';
export function readTickets(storage) {
  const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
  if (!Array.isArray(parsed) || parsed.some(t => !t || typeof t.id !== 'string' || !statuses.includes(t.status) || !Array.isArray(t.history) || !Array.isArray(t.steps) || !Array.isArray(t.conflicts))) throw new Error('Saved demo data could not be read. Reset demo data to start again.');
  return parsed;
}
