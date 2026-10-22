import React, { useState } from 'react';
import { api } from '../../services/api';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordProps {
  onSwitchToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
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
          maxWidth: '440px',
          width: '100%',
          padding: '36px',
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
          <h1 style={{ fontSize: '1.65rem', marginBottom: '6px' }}>Recupera Password</h1>
          <p style={{ fontSize: '0.85rem' }}>Riceverai un link sicuro per reimpostare le tue credenziali</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Email Inviata!</h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '24px' }}>
              Abbiamo inviato le istruzioni di recupero all'indirizzo <strong>{email}</strong>.
            </p>
            <button className="btn btn-secondary" onClick={onSwitchToLogin} style={{ width: '100%' }}>
              Torna al Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Aziendale Registrata</label>
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

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Invio in corso...' : 'Invia Link di Ripristino'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSwitchToLogin}
              style={{ width: '100%', marginTop: '10px' }}
            >
              <ArrowLeft size={16} />
              Torna al Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
