import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Company, Plan, AuditLog, CompanyStatus } from '../../types';
import {
  ShieldCheck, Building2, Users, DollarSign, Activity,
  CheckCircle2, AlertTriangle, Play, Pause, Plus, RefreshCw
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'companies' | 'plans' | 'audit'>('companies');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p, a] = await Promise.all([
        api.superAdmin.getCompanies(),
        api.plans.getAll(),
        api.superAdmin.getAuditLogs(),
      ]);
      setCompanies(Array.isArray(c) ? c : (c.companies || []));
      setPlans(Array.isArray(p) ? p : []);
      setAuditLogs(Array.isArray(a) ? a : (a.logs || []));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (companyId: string, newStatus: CompanyStatus) => {
    try {
      await api.superAdmin.updateCompanyStatus(companyId, newStatus);
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, status: newStatus } : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const activeCompanies = companies.filter((c) => c.status === 'ACTIVE').length;
  const trialCompanies = companies.filter((c) => c.status === 'TRIAL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Super Admin Top Badge & Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.7rem', margin: 0 }}>Console Super Admin OMNIVIA</h1>
            <p style={{ fontSize: '0.875rem', color: '#c084fc', marginTop: '2px' }}>
              Controllo centralizzato multi-tenant, gestione licenze, piani tariffari e audit log.
            </p>
          </div>
        </div>
      </div>

      {/* Global SaaS Platform KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <div className="card">
          <div className="form-label" style={{ marginBottom: '4px' }}>Aziende Registrate</div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff' }}>{companies.length}</h2>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '6px' }}>
            {activeCompanies} Attive • {trialCompanies} In Prova
          </div>
        </div>

        <div className="card">
          <div className="form-label" style={{ marginBottom: '4px' }}>MRR Totale Stimato</div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff' }}>€3,480.00</h2>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '6px' }}>
            +12% questo mese
          </div>
        </div>

        <div className="card">
          <div className="form-label" style={{ marginBottom: '4px' }}>Piani Sottoscrivibili</div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff' }}>{plans.length}</h2>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
            Starter, Professional, Enterprise
          </div>
        </div>

        <div className="card">
          <div className="form-label" style={{ marginBottom: '4px' }}>Eventi di Audit</div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff' }}>{auditLogs.length}</h2>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
            Registro attività in tempo reale
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'companies' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('companies')}
        >
          <Building2 size={16} />
          Gestione Aziende Tenant ({companies.length})
        </button>
        <button
          className={`btn ${activeTab === 'plans' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('plans')}
        >
          <DollarSign size={16} />
          Piani & Prezzi ({plans.length})
        </button>
        <button
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('audit')}
        >
          <Activity size={16} />
          Audit Log Sistema
        </button>
      </div>

      {/* Tab 1: Companies Table */}
      {activeTab === 'companies' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Email / Contatto</th>
                <th>Città / P.IVA</th>
                <th>Stato</th>
                <th>Data Registrazione</th>
                <th>Azioni Amministrative</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>slug: {c.slug}</div>
                  </td>
                  <td>
                    <div>{c.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.phone || '-'}</div>
                  </td>
                  <td>
                    <div>{c.city ? `${c.city} (${c.province})` : '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.vatNumber || '-'}</div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        c.status === 'ACTIVE'
                          ? 'badge-success'
                          : c.status === 'TRIAL'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(c.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {c.status === 'SUSPENDED' ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusChange(c.id, 'ACTIVE')}
                        >
                          <Play size={13} /> Riattiva
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange(c.id, 'SUSPENDED')}
                        >
                          <Pause size={13} /> Sospendi
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange(c.id, 'TRIAL')}
                        title="Estendi periodo di prova per 14 giorni"
                      >
                        <RefreshCw size={13} /> +14gg Trial
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Plans Management */}
      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {plans.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{
                border: p.name === 'Professional' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.3rem', margin: 0 }}>Piano {p.name}</h3>
                  <span className="badge badge-primary">ATTIVO</span>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>{p.description}</p>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
                    €{p.priceMonthly}
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}> / mese</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    oppure €{p.priceYearly} all’anno
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    <strong>Utenti max:</strong> {p.maxUsers ?? 'Illimitati'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    <strong>Clienti max:</strong> {p.maxClients ?? 'Illimitati'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    <strong>Documenti:</strong> {p.maxDocuments ?? 'Illimitati'}
                  </div>
                </div>
              </div>

              <button className="btn btn-secondary btn-sm" style={{ marginTop: '20px' }}>
                Modifica Parametri Piano
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data / Ora</th>
                <th>Utente</th>
                <th>Azione</th>
                <th>Entità</th>
                <th>Descrizione</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(log.createdAt).toLocaleString('it-IT')}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema'}
                  </td>
                  <td>
                    <span className="badge badge-primary">{log.action}</span>
                  </td>
                  <td style={{ color: '#818cf8', fontWeight: 500 }}>{log.entity || '-'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{log.description || '-'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#64748b' }}>
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
