import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@omnivia.io');
  const [password, setPassword] = useState('OmniviaAdmin2024!');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Credenziali non valide');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Brand Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Accedi a OMNIVIA</h1>
          <p style={{ fontSize: '0.85rem' }}>Piattaforma gestionale aziendale all-in-one</p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Aziendale</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nome@azienda.it"
              />
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button
                type="button"
                onClick={onSwitchToForgot}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Password dimenticata?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
              />
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Entra nel Gestionale'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          Non hai ancora un account aziendale?{' '}
          <button
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
          >
            Attiva prova gratuita di 14 giorni
          </button>
        </div>

        {/* Quick Demo Logins */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
            ACCESSO RAPIDO DEMO
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                setEmail('admin@omnivia.io');
                setPassword('OmniviaAdmin2024!');
              }}
            >
              Azienda Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                setEmail('superadmin@omnivia.io');
                setPassword('OmniviaAdmin2024!');
              }}
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
