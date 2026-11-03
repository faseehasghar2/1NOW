import { useState } from 'react';
import './guided-check.css';

/** A self-guided checklist. Every item is manually marked by the operator. */
export default function GuidedCheck({ connection }) {
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState([false, false, false]);
  const count = done.filter(Boolean).length;
  const connectionStep = connection === 'Disconnected'
    ? 'Note that the connection is disconnected and ask support for reconnection guidance.'
    : connection === 'Connected'
      ? 'Confirm which calendar appears connected and note any unexpected availability.'
      : 'Find the calendar connection status, or choose Unknown if you are unsure.';
  const steps = [
    { title: 'Compare the booking dates', detail: 'Check the vehicle, reservation reference, and dates shown on each platform.' },
    { title: 'Check the calendar connection', detail: connectionStep },
    { title: 'Gather details for support', detail: 'Note what you see and when it happened. Avoid changing or cancelling a booking before it is reviewed.' },
  ];
  return <section className={`guided-check${expanded ? ' is-open' : ''}`} aria-labelledby="guided-heading">
    <div className="guided-intro"><span className="guided-icon" aria-hidden="true">✦</span><div><span className="guided-eyebrow">A LITTLE GUIDANCE, WHEN YOU NEED IT</span><h2 id="guided-heading">Not sure where to start?</h2><p>We know calendar issues can be frustrating. These three quick self-checks can help you prepare your report.</p></div><button type="button" className="guided-toggle" aria-expanded={expanded} aria-controls="guided-content" onClick={() => setExpanded(v => !v)}>{expanded ? 'Close guide' : 'Start guided check'} <span aria-hidden="true">{expanded ? '↑' : '→'}</span></button></div>
    {expanded && <div className="guided-content" id="guided-content"><div className="guided-progress-head"><span>Your checklist</span><strong>{count} of {steps.length} complete</strong></div><div className="guided-progress" role="progressbar" aria-label="Guided checklist progress" aria-valuemin="0" aria-valuemax={steps.length} aria-valuenow={count}><span style={{width: `${count / steps.length * 100}%`}} /></div><div className="guided-steps">{steps.map((step, i) => <label key={step.title} className={`guided-step${done[i] ? ' done' : ''}`}><input type="checkbox" checked={done[i]} onChange={() => setDone(values => values.map((value, n) => n === i ? !value : value))}/><span className="guided-checkmark" aria-hidden="true">{done[i] ? '✓' : i + 1}</span><span><b>{step.title}</b><small>{step.detail}</small></span></label>)}</div><div className="guided-footer"><span>These checks are self-reported; this tool does not access your calendars.</span><button type="button" onClick={() => setDone([false, false, false])}>Reset checklist</button></div></div>}
  </section>;
}
