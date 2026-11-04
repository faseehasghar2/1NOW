import { statuses } from './logic';
import './kanban.css';

const priorityRank = { High: 0, Medium: 1, Low: 2 };
const columnHelp = {
  Open: 'New reports to review',
  Investigating: 'Cases being worked on',
  'Waiting for Operator': 'Awaiting operator input',
  Resolved: 'Documented outcomes'
};

export default function KanbanBoard({ tickets, selectedId, onSelect }) {
  return (
    <div className="kanban-scroll" role="region" aria-label="Support tickets Kanban board" tabIndex="0">
      <div className="kanban-board">
        {statuses.map(status => {
          const cases = tickets
            .filter(ticket => ticket.status === status)
            .sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3)
              || String(b.created || '').localeCompare(String(a.created || '')));
          return (
            <section className={'kanban-column kanban-column--' + status.toLowerCase().replaceAll(' ', '-')} key={status} aria-label={status + ': ' + cases.length + ' cases'}>
              <div className="kanban-column-head">
                <div className="kanban-heading-line">
                  <span className="kanban-stage-dot" aria-hidden="true" />
                  <h3>{status}</h3>
                  <span className="kanban-count" aria-label={cases.length + ' cases'}>{cases.length}</span>
                </div>
                <p>{columnHelp[status]}</p>
              </div>
              <div className="kanban-stack">
                {cases.length === 0
                  ? <p className="kanban-empty">No cases in this stage.</p>
                  : cases.map(ticket => (
                    <button
                      key={ticket.id}
                      type="button"
                      className={'kanban-case' + (selectedId === ticket.id ? ' is-selected' : '')}
                      aria-pressed={selectedId === ticket.id}
                      aria-label={'View case ' + ticket.id + ', ' + ticket.priority + ' priority, ' + ticket.vehicle}
                      onClick={() => onSelect(ticket.id)}
                    >
                      <span className="kanban-case-top">
                        <strong>{ticket.id}</strong>
                        <span className={'kanban-priority kanban-priority--' + ticket.priority.toLowerCase()}>{ticket.priority}</span>
                      </span>
                      <strong className="kanban-vehicle">{ticket.vehicle}</strong>
                      <span className="kanban-summary">{ticket.summary}</span>
                      <span className="kanban-case-meta">
                        <span>{ticket.operator}</span>
                        <span>{ticket.start} → {ticket.end}</span>
                      </span>
                      <span className="kanban-open-detail">View &amp; update case <span aria-hidden="true">→</span></span>
                    </button>
                  ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
