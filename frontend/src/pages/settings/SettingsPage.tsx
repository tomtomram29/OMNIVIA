import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, Users, FileText, Lock, Check,
  Shield, Mail, Phone, MapPin, Globe, Save
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { company, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'billing' | 'team' | 'security'>('company');

  // Company Form State
  const [companyData, setCompanyData] = useState({
    name: company?.name || 'Omnivia Tech S.r.l.',
    vatNumber: company?.vatNumber || 'IT12345678901',
    fiscalCode: company?.fiscalCode || '12345678901',
    email: company?.email || 'info@omniviasoftware.it',
    phone: company?.phone || '+39 02 8976 5432',
    website: company?.website || 'https://omniviasoftware.it',
    address: company?.address || 'Via Monte Napoleone 18',
    city: company?.city || 'Milano',
    province: company?.province || 'MI',
    postalCode: company?.postalCode || '20121',
    invoicePrefix: company?.invoicePrefix || 'FT',
    invoiceNextNumber: company?.invoiceNextNumber || 104,
    quotePrefix: company?.quotePrefix || 'PV',
    quoteNextNumber: company?.quoteNextNumber || 215,
    defaultVatRate: 22,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Mock Team Members
  const [team, setTeam] = useState([
    { id: '1', name: 'Mario Rossi', email: 'admin@omnivia.io', role: 'ADMIN', status: 'ATTIVO' },
    { id: '2', name: 'Luca Bianchi', email: 'luca@omnivia.io', role: 'EMPLOYEE', status: 'ATTIVO' },
    { id: '3', name: 'Giulia Colombo', email: 'giulia@omnivia.io', role: 'MANAGER', status: 'INVITATO' },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '980px' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Impostazioni Piattaforma</h1>
        <p style={{ fontSize: '0.85rem' }}>Configura i parametri fiscali, le anagrafiche aziendali e i membri del team</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'company' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('company')}
        >
          <Building2 size={16} /> Dati Azienda
        </button>
        <button
          className={`btn ${activeTab === 'billing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('billing')}
        >
          <FileText size={16} /> Numerazione & Fiscale
        </button>
        <button
          className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('team')}
        >
          <Users size={16} /> Collaboratori ({team.length})
        </button>
        <button
          className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={16} /> Sicurezza & Password
        </button>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <Check size={16} /> Modifiche salvate con successo.
        </div>
      )}

      {/* Tab 1: Dati Azienda */}
      {activeTab === 'company' && (
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Informazioni Generali Azienda</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ragione Sociale</label>
              <input
                type="text"
                className="form-control"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Partita IVA</label>
              <input
                type="text"
                className="form-control"
                value={companyData.vatNumber}
                onChange={(e) => setCompanyData({ ...companyData, vatNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Ufficiale</label>
              <input
                type="email"
                className="form-control"
                value={companyData.email}
                onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Telefono</label>
              <input
                type="text"
                className="form-control"
                value={companyData.phone}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Indirizzo Sede Legale</label>
              <input
                type="text"
                className="form-control"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Città</label>
              <input
                type="text"
                className="form-control"
                value={companyData.city}
                onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Provincia</label>
              <input
                type="text"
                className="form-control"
                value={companyData.province}
                onChange={(e) => setCompanyData({ ...companyData, province: e.target.value })}
                maxLength={2}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
            <Save size={16} /> Salva Dati Azienda
          </button>
        </form>
      )}

      {/* Tab 2: Numerazione & Fiscale */}
      {activeTab === 'billing' && (
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>Regole Numerazione Documenti</h3>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: 0 }}>
            Configura i prefissi e i contatori progressivi utilizzati per la generazione automatica dei documenti.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
            <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: '#ffffff' }}>Sezionale Fatture</h4>
              <div className="form-group">
                <label className="form-label">Prefisso Fattura</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyData.invoicePrefix}
                  onChange={(e) => setCompanyData({ ...companyData, invoicePrefix: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Prossimo Numero Progressivo</label>
                <input
                  type="number"
                  className="form-control"
                  value={companyData.invoiceNextNumber}
                  onChange={(e) => setCompanyData({ ...companyData, invoiceNextNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: '#ffffff' }}>Sezionale Preventivi</h4>
              <div className="form-group">
                <label className="form-label">Prefisso Preventivo</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyData.quotePrefix}
                  onChange={(e) => setCompanyData({ ...companyData, quotePrefix: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Prossimo Numero Progressivo</label>
                <input
                  type="number"
                  className="form-control"
                  value={companyData.quoteNextNumber}
                  onChange={(e) => setCompanyData({ ...companyData, quoteNextNumber: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ width: '260px' }}>
            <label className="form-label">Aliquota IVA Predefinita (%)</label>
            <select
              className="form-control"
              value={companyData.defaultVatRate}
              onChange={(e) => setCompanyData({ ...companyData, defaultVatRate: parseInt(e.target.value) })}
            >
              <option value={22}>22% (Ordinaria)</option>
              <option value={10}>10% (Ridotta)</option>
              <option value={4}>4% (Minima)</option>
              <option value={0}>0% (Esente)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
            <Save size={16} /> Salva Parametri Fiscali
          </button>
        </form>
      )}

      {/* Tab 3: Team Members */}
      {activeTab === 'team' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Membri del Team Aziendale</h3>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Gestisci gli accessi dei tuoi collaboratori alla piattaforma OMNIVIA
              </p>
            </div>

            <button className="btn btn-primary btn-sm">
              + Invita Collaboratore
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome Collaboratore</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {team.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{m.name}</td>
                    <td>{m.email}</td>
                    <td>
                      <span className={`badge ${m.role === 'ADMIN' ? 'badge-primary' : 'badge-neutral'}`}>
                        {m.role}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Modifica Password di Accesso</h3>

          <div className="form-group">
            <label className="form-label">Password Attuale</label>
            <input type="password" className="form-control" placeholder="••••••••••••" required />
          </div>

          <div className="form-group">
            <label className="form-label">Nuova Password</label>
            <input type="password" className="form-control" placeholder="Almeno 8 caratteri" required />
          </div>

          <div className="form-group">
            <label className="form-label">Conferma Nuova Password</label>
            <input type="password" className="form-control" placeholder="Ripeti password" required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            Aggiorna Password
          </button>
        </form>
      )}
    </div>
  );
};
