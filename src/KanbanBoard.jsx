import { useState } from 'react';
import { statuses } from './logic';
import './kanban.css';

const priorityRank = { High: 0, Medium: 1, Low: 2 };
const columns = {
  Open: { short: '01', helper: 'New tickets awaiting triage' },
  Investigating: { short: '02', helper: 'Support is reviewing the issue' },
  'Waiting for Operator': { short: '03', helper: 'Waiting for customer details' },
  Resolved: { short: '04', helper: 'Resolved with a documented outcome' },
};

export default function KanbanBoard({ tickets, selectedId, onSelect, onMove }) {
  const [draggedId, setDraggedId] = useState('');
  const [overColumn, setOverColumn] = useState('');

  function dropOnColumn(event, status) {
    event.preventDefault();
    const id = draggedId || event.dataTransfer.getData('text/plain');
    setDraggedId('');
    setOverColumn('');
    if (id) onMove(id, status);
  }

  return (
    <div className="kanban-scroll" role="region" aria-label="Support tickets Kanban board" tabIndex="0">
      <div className="kanban-board">
        {statuses.map(status => {
          const cases = tickets
            .filter(ticket => ticket.status === status)
            .sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3)
              || String(b.created || '').localeCompare(String(a.created || '')));
          return (
            <section
              key={status}
              className={'kanban-column kanban-column--' + status.toLowerCase().replaceAll(' ', '-') + (overColumn === status ? ' is-drop-target' : '')}
              aria-label={status + ': ' + cases.length + ' cases'}
              onDragOver={event => { event.preventDefault(); if (overColumn !== status) setOverColumn(status); }}
              onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOverColumn(''); }}
              onDrop={event => dropOnColumn(event, status)}
            >
              <header className="kanban-column-head">
                <div className="kanban-heading-line">
                  <span className="kanban-stage-dot" aria-hidden="true" />
                  <h3>{status}</h3>
                  <span className="kanban-count" aria-label={cases.length + ' cases'}>{cases.length}</span>
                </div>
                <p>{columns[status].helper}</p>
              </header>
              <div className="kanban-stack">
                {cases.length === 0 ? (
                  <p className="kanban-empty">Drop a case here or update its status.</p>
                ) : cases.map(ticket => (
                  <button
                    key={ticket.id}
                    type="button"
                    draggable
                    onDragStart={event => {
                      setDraggedId(ticket.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', ticket.id);
                    }}
                    onDragEnd={() => { setDraggedId(''); setOverColumn(''); }}
                    className={'kanban-case kanban-case--' + ticket.priority.toLowerCase() + (selectedId === ticket.id ? ' is-selected' : '') + (draggedId === ticket.id ? ' is-dragging' : '')}
                    aria-pressed={selectedId === ticket.id}
                    aria-label={'View case ' + ticket.id + ', ' + ticket.priority + ' priority, ' + ticket.vehicle}
                    onClick={() => onSelect(ticket.id)}
                  >
                    <span className="kanban-case-top">
                      <span className="kanban-reference">{ticket.id}</span>
                      <span className={'kanban-priority kanban-priority--' + ticket.priority.toLowerCase()}>{ticket.priority} priority</span>
                    </span>
                    <strong className="kanban-vehicle">{ticket.vehicle}</strong>
                    <span className="kanban-summary">{ticket.summary}</span>
                    <span className="kanban-case-meta">
                      <span>{ticket.operator}</span>
                      <span>{ticket.start} – {ticket.end}</span>
                    </span>
                    <span className="kanban-open-detail">
                      <span className="kanban-grip" aria-hidden="true">⠿</span>
                      <span>Open case details</span>
                      <span aria-hidden="true">↗</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="kanban-column-foot">STAGE {columns[status].short}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
