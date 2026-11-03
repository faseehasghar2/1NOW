import {test} from 'node:test';
import assert from 'node:assert/strict';
import {overlaps,demos,validate,detect,createTicket,updateTicket,reopenTicket,readTickets,STORAGE_KEY} from './logic.js';
const form = demos[0].form;
test('overlap detects intersection, containment, shared days and excludes separate dates',()=>{
 assert.equal(overlaps({start:'2026-11-10',end:'2026-11-14'},{start:'2026-11-12',end:'2026-11-15'}),true);
 assert.equal(overlaps({start:'2026-11-10',end:'2026-11-14'},{start:'2026-11-11',end:'2026-11-12'}),true);
 assert.equal(overlaps({start:'2026-11-10',end:'2026-11-14'},{start:'2026-11-14',end:'2026-11-15'}),true);
 assert.equal(overlaps({start:'2026-11-10',end:'2026-11-14'},{start:'2026-11-15',end:'2026-11-16'}),false);
});
test('all three demos validate and receive appropriate priorities',()=>{assert.deepEqual(demos.map(d=>Object.keys(validate(d.form)).length),[0,0,0]); assert.deepEqual(demos.map(d=>detect(d.form).priority),['High','Medium','Low']);});
test('Tesla conflict identifies direct reservation, excluding the reported reservation',()=>{const result=detect(form);assert.equal(result.matched,true);assert.deepEqual(result.conflicts.map(b=>b.reference),['DR-1048']);});
test('unknown connection requires verification and no conflict is invented',()=>{const r=detect({...demos[2].form,connection:'Unknown'});assert.equal(r.priority,'Medium');assert.equal(r.conflicts.length,0);});
test('missing values, invalid dates, whitespace and reversed dates are rejected',()=>{assert.ok(validate({}).operator);assert.ok(validate({...form,operator:'  '}).operator);assert.ok(validate({...form,end:'2026-11-09'}).end);assert.ok(validate({...form,start:'2026-02-30'}).start);assert.throws(()=>createTicket({...form,reference:''},[]));});
test('same-day bookings are valid and vehicle-specific',()=>{assert.deepEqual(validate({...form,end:form.start}),{});assert.equal(detect({...form,vehicle:'Toyota Corolla'}).conflicts.length,0);});
test('unmatched booking references are disclosed',()=>{assert.equal(detect({...demos[2].form,reference:'OTHER'}).matched,false);});
test('ticket numbering is unique even with reordered tickets',()=>{const a=createTicket(form,[]);const b=createTicket(form,[a]);assert.equal(a.id,'QS-001');assert.equal(b.id,'QS-002');assert.equal(createTicket(form,[b,a]).id,'QS-003');assert.equal(a.status,'Open');});
test('support notes and waiting status appear in immutable activity history',()=>{const t=createTicket(form,[]);const u=updateTicket(t,'Waiting for Operator','Please confirm both reservation dates.');assert.equal(u.status,'Waiting for Operator');assert.equal(u.history.length,2);assert.equal(t.history.length,1);assert.match(u.history[1].text,/confirm/);});
test('resolution requires meaningful documentation and accepts a documented outcome',()=>{const t=createTicket(form,[]);assert.throws(()=>updateTicket(t,'Resolved',''));assert.throws(()=>updateTicket(t,'Resolved','Fixed'));const u=updateTicket(t,'Resolved','Demo review completed; operator confirmed the agreed next steps.');assert.equal(u.status,'Resolved');assert.match(u.resolution,/operator confirmed/);});
test('operator can reopen resolved ticket with reason, preserving previous outcome',()=>{const t=updateTicket(createTicket(form,[]),'Resolved','Operator confirmed dates after a simulated manual review.');assert.throws(()=>reopenTicket(t,''));const u=reopenTicket(t,'Dates are still showing as available.');assert.equal(u.status,'Open');assert.equal(u.history.at(-1).actor,'Operator');assert.equal(u.resolution,t.resolution);assert.throws(()=>reopenTicket(u,'Still showing available'));});
test('invalid or empty support updates are rejected',()=>{const t=createTicket(form,[]);assert.throws(()=>updateTicket(t,'Invalid','Some note'));assert.throws(()=>updateTicket(t,'Open',''));});
test('persisted tickets survive serialization and corrupt storage is rejected',()=>{const tickets=[createTicket(form,[])];const storage={getItem:key=>key===STORAGE_KEY?JSON.stringify(tickets):null};assert.deepEqual(readTickets(storage),tickets);assert.throws(()=>readTickets({getItem:()=>'{bad'}));assert.throws(()=>readTickets({getItem:()=>JSON.stringify([{}])}));assert.deepEqual(readTickets({getItem:()=>null}),[]);});

test('share summary includes a demo disclaimer, actionable ticket information and the correct resolution label',async()=>{
 const {formatTicketSummary}=await import('./logic.js');
 const ticket=createTicket(demos[0].form,[]);
 const draft=formatTicketSummary(ticket);
 assert.match(draft,/demonstration data only/);
 assert.match(draft,/QS-001.*High priority.*Open/);
 assert.match(draft,/TU-84219/);
 assert.match(draft,/Escalate to a human support specialist immediately/);
 assert.match(draft,/No live booking or calendar was checked or changed/);
 const resolved=updateTicket(ticket,'Resolved','Demo review completed; operator confirmed the agreed next steps.');
 assert.match(formatTicketSummary(resolved),/Resolution: Demo review completed/);
 const reopened=reopenTicket(resolved,'Dates are still showing as available.');
 assert.match(formatTicketSummary(reopened),/Previous resolution: Demo review completed/);
});

test('case search and status filtering find matching tickets without altering them', async () => {
 const {filterTickets}=await import('./logic.js');
 const first=createTicket(demos[0].form,[]);
 const second=createTicket(demos[1].form,[first]);
 const waiting=updateTicket(second,'Waiting for Operator','Please verify the calendar connection.');
 const tickets=[first,waiting];
 assert.deepEqual(filterTickets(tickets,' TU-84219 ').map(t=>t.id),[first.id]);
 assert.deepEqual(filterTickets(tickets,'jeep','Waiting for Operator').map(t=>t.id),[waiting.id]);
 assert.deepEqual(filterTickets(tickets,'jeep','Resolved'),[]);
 assert.equal(filterTickets(tickets,'','All statuses').length,2);
 assert.equal(tickets[1].status,'Waiting for Operator');
});

test('calendar reminder preserves inclusive booking dates and escapes user-controlled text', async () => {
 const {createCalendarReminder}=await import('./logic.js');
 const ticket={...createTicket(demos[0].form,[]),reference:'ABC,123;\\test\nnew'};
 const text=createCalendarReminder(ticket,new Date('2026-11-01T10:20:30Z'));
 assert.match(text,/DTSTART;VALUE=DATE:20261110\r\n/);
 assert.match(text,/DTEND;VALUE=DATE:20261115\r\n/);
 assert.match(text,/DTSTAMP:20261101T102030Z\r\n/);
 assert.match(text,/ABC\\,123\\;\\\\test\\nnew/);
 assert.match(text,/Demo data only/);
 assert.match(text,/TRANSP:TRANSPARENT/);
 assert.ok(text.split('\r\n').every(line=>new TextEncoder().encode(line).length<=75));
 assert.throws(()=>createCalendarReminder({...ticket,end:'9999-12-31'}));
});

test('calendar reminder handles month and leap year boundary as all-day dates', async () => {
 const {createCalendarReminder}=await import('./logic.js');
 const ticket={...createTicket(demos[0].form,[]),start:'2028-02-29',end:'2028-02-29'};
 const text=createCalendarReminder(ticket,new Date('2026-01-01T00:00:00Z'));
 assert.match(text,/DTSTART;VALUE=DATE:20280229/);
 assert.match(text,/DTEND;VALUE=DATE:20280301/);
});
