import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CalendarEvent, Client } from '../../types';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Plus, MapPin, Clock, User as UserIcon, X, Check
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showModal, setShowModal] = useState(false);

  // Form
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    location: '',
    color: '#6366f1',
    clientId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [e, c] = await Promise.all([
        api.calendar.getEvents(),
        api.clients.getAll(),
      ]);
      setEvents(Array.isArray(e) ? e : []);
      setClients(Array.isArray(c) ? c : (c.clients || []));
    } catch (err) {
      console.error(err);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  // Days in month calculation
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  const handleOpenCreate = (day?: number) => {
    const targetDay = day || selectedDay || new Date().getDate();
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T10:00`;
    const eStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T11:00`;
    setFormData({
      title: '',
      description: '',
      startDate: dStr,
      endDate: eStr,
      allDay: false,
      location: 'Google Meet',
      color: '#6366f1',
      clientId: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.calendar.create(formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getEventsForDay = (d: number) => {
    return events.filter((ev) => {
      const date = new Date(ev.startDate);
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === d;
    });
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Calendario & Appuntamenti</h1>
          <p style={{ fontSize: '0.85rem' }}>Pianifica incontri con i clienti, call strategiche e scadenze di consegna</p>
        </div>

        <button className="btn btn-primary" onClick={() => handleOpenCreate()}>
          <Plus size={16} />
          <span>Nuovo Appuntamento</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '22px' }}>
        {/* Calendar Grid Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Calendar Header with Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', margin: 0 }}>
              {monthNames[month]} {year}
            </h2>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); }}>
                Oggi
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleNextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: '#64748b' }}>
            {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map((d) => (
              <div key={d} style={{ padding: '8px 0' }}>{d}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: '78px', borderRadius: 'var(--radius-sm)', opacity: 0.2 }} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayEvents = getEventsForDay(dayNum);
              const isSelected = selectedDay === dayNum;
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  style={{
                    height: '78px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected
                      ? '1px solid #6366f1'
                      : isToday
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    backgroundColor: isSelected
                      ? 'rgba(99, 102, 241, 0.12)'
                      : isToday
                      ? 'rgba(16, 185, 129, 0.05)'
                      : 'rgba(255, 255, 255, 0.02)',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.825rem',
                        fontWeight: isSelected || isToday ? 700 : 500,
                        color: isToday ? '#34d399' : isSelected ? '#ffffff' : '#94a3b8',
                      }}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Micro event indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          backgroundColor: `${ev.color || '#6366f1'}33`,
                          color: ev.color || '#a5b4fc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 600,
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
              Agenda: {selectedDay} {monthNames[month]} {year}
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenCreate(selectedDay || undefined)}>
              <Plus size={14} /> Aggiungi
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {selectedDayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: '0.85rem' }}>
                Nessun appuntamento per questo giorno.
              </div>
            ) : (
              selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderLeft: `4px solid ${ev.color || '#6366f1'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                    {ev.title}
                  </div>

                  {ev.description && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {ev.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <span>{new Date(ev.startDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {ev.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} />
                        <span>{ev.location}</span>
                      </div>
                    )}
                  </div>

                  {ev.client && (
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '2px' }}>
                      Cliente: {ev.client.businessName}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal create event */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Pianifica Appuntamento</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Oggetto Incontro / Titolo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Es. Presentazione proposta commerciale"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Data e Ora Inizio</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data e Ora Fine</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Luogo / Link Call</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Google Meet / Sede cliente"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Colore Evento</label>
                    <select
                      className="form-control"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    >
                      <option value="#6366f1">Indigo (Standard)</option>
                      <option value="#10b981">Verde (Commerciale)</option>
                      <option value="#f59e0b">Ambra (Operativo)</option>
                      <option value="#ef4444">Rosso (Urgente)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cliente Associato</label>
                  <select
                    className="form-control"
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">Nessun cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.type === 'COMPANY' ? c.businessName : `${c.firstName} ${c.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Note / Ordine del giorno</label>
                  <textarea
                    className="form-control"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Punti da discutere durante la sessione..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Salva in Calendario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
