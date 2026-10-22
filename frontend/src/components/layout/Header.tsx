import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bell, Search, Plus, Building2, CheckCircle2,
  Clock, ShieldAlert, Sparkles, X
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenQuickAction?: (action: 'quote' | 'invoice' | 'task' | 'client') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenQuickAction }) => {
  const { user, company } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Fattura FT-2026-0103 saldata parzialmente', time: '10m fa', icon: CheckCircle2, color: '#10b981' },
    { id: 2, title: 'Scadenza Preventivo PV-2026-0214 tra 3 giorni', time: '1h fa', icon: Clock, color: '#f59e0b' },
    { id: 3, title: 'Attività "Sollecito pagamento" scaduta', time: '2h fa', icon: ShieldAlert, color: '#ef4444' },
  ];

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Aziendale';
      case 'superadmin': return 'Pannello Super Admin Omnivia';
      case 'clients': return 'Anagrafica Clienti';
      case 'suppliers': return 'Anagrafica Fornitori';
      case 'catalog': return 'Catalogo Prodotti & Servizi';
      case 'tasks': return 'Gestione Attività (Kanban Board)';
      case 'calendar': return 'Calendario & Appuntamenti';
      case 'quotes': return 'Gestione Preventivi';
      case 'invoices': return 'Fatturazione & Pagamenti';
      case 'subscription': return 'Piani & Abbonamento';
      case 'settings': return 'Impostazioni Aziendali';
      default: return 'Panoramica';
    }
  };

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'rgba(12, 19, 34, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Title & Company Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            {getPageTitle(currentTab)}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <Building2 size={13} color="#94a3b8" />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              {company?.name || 'Omnivia System'}
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
              PROVA ATTIVA (12 GG)
            </span>
          </div>
        </div>
      </div>

      {/* Global Actions & Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Quick Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            width: '240px',
          }}
        >
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Cerca clienti, fatture..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.8rem',
              width: '100%',
            }}
          />
        </div>

        {/* Quick Action Button */}
        {onOpenQuickAction && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onOpenQuickAction('quote')}
            >
              <Plus size={15} />
              <span>Nuovo Preventivo</span>
            </button>
          </div>
        )}

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative', padding: '8px' }}
            title="Notifiche"
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                boxShadow: '0 0 8px #ef4444',
              }}
            />
          </button>

          {showNotifications && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '320px',
                padding: '16px',
                zIndex: 50,
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '8px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Notifiche Recenti</div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="btn-icon"
                  style={{ padding: '2px' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <Icon size={16} color={n.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 500 }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                          {n.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
