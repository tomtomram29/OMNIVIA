import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Building2, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({ companyName, firstName, lastName, email, password });
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione.');
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
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '36px',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(99, 102, 241, 0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}
          >
            <Sparkles size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '6px' }}>Attiva OMNIVIA</h1>
          <p style={{ fontSize: '0.85rem' }}>14 giorni di prova gratuita con tutte le funzionalità incluse</p>
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
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome Azienda / Ragione Sociale</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Es. Apex Software S.r.l."
              />
              <Building2 size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Mario"
                />
                <UserIcon size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cognome</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Rossi"
              />
            </div>
          </div>

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
                placeholder="mario@azienda.it"
              />
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Almeno 8 caratteri"
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
            {isLoading ? 'Creazione in corso...' : 'Inizia Prova Gratuita'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          Hai già un account?{' '}
          <button
            onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
          >
            Accedi qui
          </button>
        </div>
      </div>
    </div>
  );
};
