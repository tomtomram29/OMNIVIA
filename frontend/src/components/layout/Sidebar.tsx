import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Truck, Package, CheckSquare,
  Calendar, FileText, Receipt, CreditCard, Settings,
  ShieldCheck, LogOut, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const { user, logout, switchRole } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN_OMNIVIA';

  const navGroups = [
    {
      title: 'Panoramica',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ...(isSuperAdmin
          ? [{ id: 'superadmin', label: 'Super Admin', icon: ShieldCheck, badge: 'SA' }]
          : []),
      ],
    },
    {
      title: 'Commerciale',
      items: [
        { id: 'clients', label: 'Clienti', icon: Users },
        { id: 'suppliers', label: 'Fornitori', icon: Truck },
        { id: 'catalog', label: 'Catalogo & Servizi', icon: Package },
      ],
    },
    {
      title: 'Operativo',
      items: [
        { id: 'tasks', label: 'Attività (Kanban)', icon: CheckSquare },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
      ],
    },
    {
      title: 'Finanza',
      items: [
        { id: 'quotes', label: 'Preventivi', icon: FileText },
        { id: 'invoices', label: 'Fatture & Incassi', icon: Receipt },
      ],
    },
    {
      title: 'Gestione',
      items: [
        { id: 'subscription', label: 'Abbonamento', icon: CreditCard },
        { id: 'settings', label: 'Impostazioni', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '80px' : '260px',
        backgroundColor: '#0c1322',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        zIndex: 20,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} color="#ffffff" />
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                OMNIVIA
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>
                ENTERPRISE ERP
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="btn-icon"
          title={collapsed ? 'Espandi menu' : 'Comprimi menu'}
          style={{ padding: '6px', cursor: 'pointer' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {!collapsed && (
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  letterSpacing: '0.08em',
                  padding: '0 12px 6px',
                }}
              >
                {group.title}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: collapsed ? '12px' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon size={19} color={isActive ? '#818cf8' : '#94a3b8'} />
                    {!collapsed && (
                      <span style={{ flex: 1, fontSize: '0.875rem' }}>{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className="badge badge-primary"
                        style={{ fontSize: '0.65rem', padding: '1px 6px' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role Switcher & User Profile */}
      <div
        style={{
          padding: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
        }}
      >
        {!collapsed && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
              SIMULA RUOLO (DEMO)
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`btn btn-sm ${user?.role === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
                onClick={() => switchRole('ADMIN')}
              >
                Admin
              </button>
              <button
                className={`btn btn-sm ${user?.role === 'SUPER_ADMIN_OMNIVIA' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
                onClick={() => switchRole('SUPER_ADMIN_OMNIVIA')}
              >
                Super
              </button>
              <button
                className={`btn btn-sm ${user?.role === 'EMPLOYEE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem' }}
                onClick={() => switchRole('EMPLOYEE')}
              >
                Staff
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isSuperAdmin
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#ffffff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {isSuperAdmin ? 'Super Admin' : user?.companyRole || 'Admin'}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="btn-icon"
            title="Esci dall'account"
            style={{ color: '#ef4444' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
