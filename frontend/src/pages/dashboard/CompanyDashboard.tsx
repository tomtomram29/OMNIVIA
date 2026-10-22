import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Task, Invoice, Quote, CalendarEvent } from '../../types';
import {
  TrendingUp, Clock, CheckCircle2, AlertCircle, FileText,
  Calendar as CalendarIcon, ArrowUpRight, Plus, Users, DollarSign
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenQuickAction: (action: 'quote' | 'invoice' | 'task' | 'client') => void;
}

export const CompanyDashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenQuickAction }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, i, q, e] = await Promise.all([
          api.tasks.getAll(),
          api.invoices.getAll(),
          api.quotes.getAll(),
          api.calendar.getEvents(),
        ]);
        setTasks(Array.isArray(t) ? t : (t.tasks || []));
        setInvoices(Array.isArray(i) ? i : (i.invoices || []));
        setQuotes(Array.isArray(q) ? q : (q.quotes || []));
        setEvents(Array.isArray(e) ? e : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
  const overdueTasksCount = tasks.filter((t) => t.status === 'OVERDUE').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pendingQuotesCount = quotes.filter((q) => q.status === 'SENT' || q.status === 'PENDING').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Welcome & Quick Actions Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>
            Benvenuto nel centro di controllo OMNIVIA
          </h1>
          <p style={{ fontSize: '0.9rem' }}>
            Ecco il riepilogo operativo della tua azienda: fatturato, stato commesse e scadenze di oggi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onOpenQuickAction('quote')}>
            <Plus size={16} />
            <span>Nuovo Preventivo</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenQuickAction('invoice')}>
            <Plus size={16} />
            <span>Emetti Fattura</span>
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenQuickAction('task')}>
            <Plus size={16} />
            <span>Nuova Attività</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
        }}
      >
        {/* KPI 1 */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Fatturato Incassato</div>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                €{totalCollected.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
              }}
            >
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#10b981' }}>
            <TrendingUp size={14} />
            <span>+18.4% rispetto al mese precedente</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Da Incassare (Crediti)</div>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                €{totalPending.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
              }}
            >
              <Clock size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span>{invoices.filter((i) => i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID').length} fatture aperte in scadenza</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Attività in Corso</div>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                {inProgressTasksCount} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {tasks.length}</span>
              </h2>
            </div>
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            {overdueTasksCount > 0 ? (
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {overdueTasksCount} attività scadute richiedono attenzione
              </span>
            ) : (
              <span style={{ color: '#10b981' }}>Nessuna attività in ritardo</span>
            )}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Preventivi Pendenti</div>
              <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                {pendingQuotesCount}
              </h2>
            </div>
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: '#22d3ee',
              }}
            >
              <FileText size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <span>In attesa di approvazione cliente</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chart + Task/Calendar Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '22px' }}>
        {/* Financial Flow Overview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>Andamento Fatturato Mensile</h3>
              <p style={{ fontSize: '0.8rem' }}>Raffronto tra fatturato emesso e incassi registrati (ultimi 6 mesi)</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('invoices')}>
              Vedi tutte <ArrowUpRight size={14} />
            </button>
          </div>

          {/* SaaS Bar Chart visualization */}
          <div
            style={{
              height: '220px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '18px',
              padding: '20px 10px 10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {[
              { month: 'Mag', issued: 4200, paid: 3800 },
              { month: 'Giu', issued: 5600, paid: 5200 },
              { month: 'Lug', issued: 6100, paid: 5800 },
              { month: 'Ago', issued: 3400, paid: 3400 },
              { month: 'Set', issued: 7800, paid: 6900 },
              { month: 'Ott', issued: 8500, paid: 7200 },
            ].map((m, idx) => {
              const maxVal = 9000;
              const issuedHeight = (m.issued / maxVal) * 160;
              const paidHeight = (m.paid / maxVal) * 160;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '170px' }}>
                    {/* Issued bar */}
                    <div
                      title={`Emesso: €${m.issued}`}
                      style={{
                        width: '18px',
                        height: `${issuedHeight}px`,
                        background: 'rgba(99, 102, 241, 0.35)',
                        borderTop: '2px solid #818cf8',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                      }}
                    />
                    {/* Paid bar */}
                    <div
                      title={`Incassato: €${m.paid}`}
                      style={{
                        width: '18px',
                        height: `${paidHeight}px`,
                        background: 'linear-gradient(to top, #059669, #10b981)',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                        transition: 'height 0.4s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{m.month}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.5)' }} />
              <span style={{ color: '#94a3b8' }}>Fatturato Emesso</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
              <span style={{ color: '#94a3b8' }}>Incassi Reali</span>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks & Appointments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Upcoming Calendar Events */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={18} color="#6366f1" />
                Appuntamenti Imminenti
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('calendar')}>
                Calendario
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '16px 0' }}>
                  Nessun appuntamento in programma.
                </div>
              ) : (
                events.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderLeft: `3px solid ${evt.color || '#6366f1'}`,
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>{evt.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      {new Date(evt.startDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {evt.client?.businessName && ` • ${evt.client.businessName}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Urgent / Active Tasks */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                Attività Prioritarie
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tasks')}>
                Kanban
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.filter((t) => t.status !== 'COMPLETED').slice(0, 3).map((tsk) => (
                <div
                  key={tsk.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {tsk.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {tsk.assignee ? `${tsk.assignee.firstName} ${tsk.assignee.lastName}` : 'Non assegnato'}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      tsk.priority === 'URGENT'
                        ? 'badge-danger'
                        : tsk.priority === 'HIGH'
                        ? 'badge-warning'
                        : 'badge-primary'
                    }`}
                  >
                    {tsk.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
