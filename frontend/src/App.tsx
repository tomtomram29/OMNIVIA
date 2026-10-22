import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { CompanyDashboard } from './pages/dashboard/CompanyDashboard';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { ClientsPage } from './pages/clients/ClientsPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { CatalogPage } from './pages/catalog/CatalogPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { QuotesPage } from './pages/quotes/QuotesPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ShieldOff, AlertTriangle } from 'lucide-react';

// ============================================================
// ACCESS BLOCKED SCREEN
// ============================================================
const AccessBlockedScreen: React.FC<{ reason: string }> = ({ reason }) => {
  const { logout, subscription } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '2rem',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '1.5rem',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <ShieldOff size={40} color="#ef4444" />
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>
          Accesso Bloccato
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', lineHeight: '1.6' }}>
          {reason}
        </p>
        {subscription && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '2rem',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              Stato abbonamento
            </div>
            <div style={{
              color: '#ef4444',
              fontWeight: 600,
              fontSize: '1.1rem',
            }}>
              {subscription.status === 'EXPIRED' ? 'Scaduto' :
               subscription.status === 'SUSPENDED' ? 'Sospeso' :
               subscription.status === 'CANCELLED' ? 'Cancellato' :
               subscription.status}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
        >
          Esci
        </button>
      </div>
    </div>
  );
};

// ============================================================
// LOADING SCREEN
// ============================================================
const LoadingScreen: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 1rem',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
        Caricamento OMNIVIA...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// ============================================================
// CONNECTION ERROR
// ============================================================
const ConnectionError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    padding: '2rem',
  }}>
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(20px)',
      borderRadius: '1.5rem',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '3rem',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(245,158,11,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
      }}>
        <AlertTriangle size={40} color="#f59e0b" />
      </div>
      <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>
        Connessione non disponibile
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', lineHeight: '1.6' }}>
        Impossibile connettersi al server OMNIVIA. Verifica che il backend sia attivo e riprova.
      </p>
      <button
        onClick={onRetry}
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          color: '#fff',
          padding: '0.75rem 2rem',
          borderRadius: '0.75rem',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        Riprova
      </button>
    </div>
  </div>
);

// ============================================================
// MAIN APP CONTENT
// ============================================================
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, isSuperAdmin, isAccessBlocked, accessBlockedReason } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, show Auth Pages
  if (!isAuthenticated) {
    if (authMode === 'register') {
      return <Register onSwitchToLogin={() => setAuthMode('login')} />;
    }
    if (authMode === 'forgot') {
      return <ForgotPassword onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return (
      <Login
        onSwitchToRegister={() => setAuthMode('register')}
        onSwitchToForgot={() => setAuthMode('forgot')}
      />
    );
  }

  // If access blocked (expired/suspended/cancelled), show blocked screen
  // Allow access to subscription page so users can see their status
  if (isAccessBlocked && accessBlockedReason && currentTab !== 'subscription') {
    return <AccessBlockedScreen reason={accessBlockedReason} />;
  }

  // Quick action shortcut dispatcher
  const handleQuickAction = (action: 'quote' | 'invoice' | 'task' | 'client') => {
    switch (action) {
      case 'quote': setCurrentTab('quotes'); break;
      case 'invoice': setCurrentTab('invoices'); break;
      case 'task': setCurrentTab('tasks'); break;
      case 'client': setCurrentTab('clients'); break;
    }
  };

  const renderContent = () => {
    // Super Admin always goes to superadmin dashboard first
    if (isSuperAdmin && currentTab === 'dashboard') {
      return <SuperAdminDashboard />;
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <CompanyDashboard
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQuickAction={handleQuickAction}
          />
        );
      case 'superadmin':
        return <SuperAdminDashboard />;
      case 'clients':
        return <ClientsPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'catalog':
        return <CatalogPage />;
      case 'tasks':
        return <TasksPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'quotes':
        return <QuotesPage onNavigateToInvoice={() => setCurrentTab('invoices')} />;
      case 'invoices':
        return <InvoicesPage />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <CompanyDashboard
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQuickAction={handleQuickAction}
          />
        );
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={(tab) => setCurrentTab(tab)}
      onQuickAction={handleQuickAction}
    >
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
