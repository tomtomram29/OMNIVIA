import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Task, TaskStatus, TaskPriority, Client } from '../../types';
import {
  CheckSquare, Plus, Search, Calendar, User as UserIcon,
  AlertCircle, Clock, CheckCircle2, ArrowRight, MoreHorizontal,
  LayoutGrid, List, X, Check
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    clientId: '',
    dueDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [t, c] = await Promise.all([
        api.tasks.getAll(),
        api.clients.getAll(),
      ]);
      setTasks(Array.isArray(t) ? t : (t.tasks || []));
      setClients(Array.isArray(c) ? c : (c.clients || []));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.tasks.update(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tasks.create(formData);
      setShowModal(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns: { status: TaskStatus; label: string; color: string; bg: string }[] = [
    { status: 'TODO', label: 'Da Fare', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.08)' },
    { status: 'IN_PROGRESS', label: 'In Corso', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.08)' },
    { status: 'COMPLETED', label: 'Completate', color: '#34d399', bg: 'rgba(16, 185, 129, 0.08)' },
    { status: 'OVERDUE', label: 'Scadute / Ritardo', color: '#f87171', bg: 'rgba(239, 68, 68, 0.08)' },
  ];

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Attività & Kanban Board</h1>
          <p style={{ fontSize: '0.85rem' }}>Organizza le mansioni aziendali, tieni traccia delle scadenze e assegna i task al team</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Nuova Attività</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', width: '320px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cerca attività per titolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={15} /> Kanban
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            <List size={15} /> Tabella
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
            alignItems: 'start',
          }}
        >
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '400px',
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>{col.label}</span>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: '0.8rem' }}>
                      Nessun task in questa colonna
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="card"
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          backgroundColor: '#131b31',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span
                            className={`badge ${
                              t.priority === 'URGENT'
                                ? 'badge-danger'
                                : t.priority === 'HIGH'
                                ? 'badge-warning'
                                : 'badge-primary'
                            }`}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {t.priority}
                          </span>

                          {/* Quick status cycle button */}
                          <button
                            className="btn-icon"
                            style={{ padding: '3px' }}
                            title="Avanza stato"
                            onClick={() => {
                              const nextStatusMap: Record<TaskStatus, TaskStatus> = {
                                TODO: 'IN_PROGRESS',
                                IN_PROGRESS: 'COMPLETED',
                                COMPLETED: 'TODO',
                                OVERDUE: 'IN_PROGRESS',
                              };
                              handleUpdateStatus(t.id, nextStatusMap[t.status]);
                            }}
                          >
                            <ArrowRight size={14} color="#94a3b8" />
                          </button>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc', lineHeight: 1.3 }}>
                          {t.title}
                        </div>

                        {t.description && (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                            {t.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px', marginTop: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserIcon size={12} />
                            <span>{t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName.charAt(0)}.` : 'Non assegnato'}</span>
                          </div>

                          {t.dueDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: t.status === 'OVERDUE' ? '#ef4444' : '#94a3b8' }}>
                              <Clock size={12} />
                              <span>{new Date(t.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode View */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Titolo Attività</th>
                <th>Priorità</th>
                <th>Stato</th>
                <th>Assegnatario</th>
                <th>Scadenza</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{t.title}</div>
                    {t.client && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cliente: {t.client.businessName}</div>}
                  </td>
                  <td>
                    <span className={`badge ${t.priority === 'URGENT' ? 'badge-danger' : t.priority === 'HIGH' ? 'badge-warning' : 'badge-primary'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{t.status}</span>
                  </td>
                  <td>{t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '-'}</td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('it-IT') : '-'}
                  </td>
                  <td>
                    <select
                      className="input-control"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', width: '130px' }}
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value as TaskStatus)}
                    >
                      <option value="TODO">Da fare</option>
                      <option value="IN_PROGRESS">In corso</option>
                      <option value="COMPLETED">Completata</option>
                      <option value="OVERDUE">Scaduta</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Nuova Attività</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Titolo Attività</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Es. Invio documentazione fiscale a cliente"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrizione / Istruzioni</label>
                  <textarea
                    className="form-control"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Dettagli operativi per l'esecuzione..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Priorità</label>
                    <select
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    >
                      <option value="LOW">Bassa</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stato Iniziale</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    >
                      <option value="TODO">Da Fare</option>
                      <option value="IN_PROGRESS">In Corso</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Cliente Collegato (Opzionale)</label>
                    <select
                      className="form-control"
                      value={formData.clientId || ''}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    >
                      <option value="">Nessuno</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.type === 'COMPANY' ? c.businessName : `${c.firstName} ${c.lastName}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data di Scadenza</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dueDate || ''}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Crea Attività
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
