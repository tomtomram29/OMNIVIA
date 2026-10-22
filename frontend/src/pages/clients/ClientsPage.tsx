import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Client, ClientType } from '../../types';
import {
  Users, Plus, Search, Building2, User as UserIcon,
  Phone, Mail, MapPin, Edit2, Trash2, X, Check
} from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'COMPANY' | 'INDIVIDUAL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Client>>({
    type: 'COMPANY',
    businessName: '',
    firstName: '',
    lastName: '',
    vatNumber: '',
    fiscalCode: '',
    email: '',
    phone: '',
    city: '',
    province: '',
    address: '',
    postalCode: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await api.clients.getAll();
      setClients(Array.isArray(data) ? data : (data.clients || []));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      type: 'COMPANY',
      businessName: '',
      firstName: '',
      lastName: '',
      vatNumber: '',
      fiscalCode: '',
      email: '',
      phone: '',
      city: '',
      province: '',
      address: '',
      postalCode: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.clients.update(editingClient.id, formData);
      } else {
        await api.clients.create(formData);
      }
      setShowModal(false);
      loadClients();
    } catch (err) {
      console.error('Error saving client:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare o disattivare questo cliente?')) {
      await api.clients.delete(id);
      loadClients();
    }
  };

  const filtered = clients.filter((c) => {
    const matchesSearch =
      (c.businessName && c.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.firstName && c.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.lastName && c.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.vatNumber && c.vatNumber.includes(searchTerm));
    const matchesType =
      filterType === 'ALL' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Anagrafica Clienti</h1>
          <p style={{ fontSize: '0.85rem' }}>Gestisci le aziende e i clienti privati con fatturazione associata</p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          <span>Nuovo Cliente</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', width: '320px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cerca per nome, email o P.IVA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('ALL')}
          >
            Tutti ({clients.length})
          </button>
          <button
            className={`btn btn-sm ${filterType === 'COMPANY' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('COMPANY')}
          >
            <Building2 size={13} /> Aziende
          </button>
          <button
            className={`btn btn-sm ${filterType === 'INDIVIDUAL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('INDIVIDUAL')}
          >
            <UserIcon size={13} /> Privati
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Denominazione / Nome</th>
              <th>Tipo</th>
              <th>P.IVA / Codice Fiscale</th>
              <th>Contatti</th>
              <th>Città</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Nessun cliente trovato con i criteri selezionati.
                </td>
              </tr>
            ) : (
              filtered.map((client) => {
                const displayName = client.type === 'COMPANY'
                  ? client.businessName
                  : `${client.firstName || ''} ${client.lastName || ''}`.trim();
                return (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: client.type === 'COMPANY' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                            color: client.type === 'COMPANY' ? '#818cf8' : '#22d3ee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {client.type === 'COMPANY' ? <Building2 size={17} /> : <UserIcon size={17} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{displayName}</div>
                          {client.address && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{client.address}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${client.type === 'COMPANY' ? 'badge-primary' : 'badge-info'}`}>
                        {client.type === 'COMPANY' ? 'Azienda' : 'Privato'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {client.vatNumber || client.fiscalCode || '-'}
                      </div>
                    </td>
                    <td>
                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                          <Mail size={12} color="#64748b" /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                          <Phone size={12} color="#64748b" /> {client.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      {client.city ? `${client.city} (${client.province || ''})` : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => handleOpenEdit(client)} title="Modifica cliente">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(client.id)} title="Elimina cliente" style={{ color: '#ef4444' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingClient ? 'Modifica Cliente' : 'Crea Nuovo Cliente'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tipologia Cliente</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc' }}>
                      <input
                        type="radio"
                        name="clientType"
                        checked={formData.type === 'COMPANY'}
                        onChange={() => setFormData({ ...formData, type: 'COMPANY' })}
                      />
                      Azienda / Persona Giuridica
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc' }}>
                      <input
                        type="radio"
                        name="clientType"
                        checked={formData.type === 'INDIVIDUAL'}
                        onChange={() => setFormData({ ...formData, type: 'INDIVIDUAL' })}
                      />
                      Privato / Persona Fisica
                    </label>
                  </div>
                </div>

                {formData.type === 'COMPANY' ? (
                  <div className="form-group">
                    <label className="form-label">Ragione Sociale</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.businessName || ''}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                      placeholder="Es. Apex Digital Agency S.r.l."
                    />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Nome</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        placeholder="Mario"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cognome</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        placeholder="Rossi"
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Partita IVA</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.vatNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                      placeholder="IT01234567890"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Codice Fiscale</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.fiscalCode || ''}
                      onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })}
                      placeholder="Codice fiscale"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="amministrazione@cliente.it"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefono</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+39 02 1234567"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Indirizzo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Via Roma 1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Città</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Milano"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Provincia</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.province || ''}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="MI"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Note Interne</label>
                  <textarea
                    className="form-control"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Note relative a condizioni particolari di fornitura o contatti..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Salva Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
