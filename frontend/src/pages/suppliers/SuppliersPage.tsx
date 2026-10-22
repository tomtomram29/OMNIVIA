import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Supplier } from '../../types';
import { Truck, Plus, Search, Mail, Phone, Edit2, Trash2, X, Check } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    businessName: '',
    contactName: '',
    vatNumber: '',
    fiscalCode: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.suppliers.getAll();
      setSuppliers(Array.isArray(data) ? data : (data.suppliers || []));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      businessName: '',
      contactName: '',
      vatNumber: '',
      fiscalCode: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData(sup);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        // update
        const idx = suppliers.findIndex(s => s.id === editingSupplier.id);
        if (idx !== -1) Object.assign(suppliers[idx], formData);
      } else {
        await api.suppliers.create(formData);
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = suppliers.filter((s) => {
    return (
      s.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.vatNumber && s.vatNumber.includes(searchTerm))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Anagrafica Fornitori</h1>
          <p style={{ fontSize: '0.85rem' }}>Gestisci le aziende fornitrici di beni, licenze e servizi esterni</p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          <span>Nuovo Fornitore</span>
        </button>
      </div>

      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', width: '320px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cerca fornitore o P.IVA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Totale Fornitori Registrati: <strong>{suppliers.length}</strong>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ragione Sociale</th>
              <th>Referente</th>
              <th>P.IVA</th>
              <th>Contatti</th>
              <th>Città</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Nessun fornitore registrato.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Truck size={17} />
                      </div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{s.businessName}</div>
                    </div>
                  </td>
                  <td>{s.contactName || '-'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.vatNumber || s.fiscalCode || '-'}</td>
                  <td>
                    {s.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                        <Mail size={12} color="#64748b" /> {s.email}
                      </div>
                    )}
                    {s.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                        <Phone size={12} color="#64748b" /> {s.phone}
                      </div>
                    )}
                  </td>
                  <td>{s.city || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-icon" onClick={() => handleOpenEdit(s)} title="Modifica">
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ragione Sociale Fornitore</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.businessName || ''}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                    placeholder="Es. CloudServer Hosting Provider"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Referente Commerciale</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.contactName || ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Nome e cognome"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Partita IVA / CF</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.vatNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                      placeholder="IT01234567890"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Email Ordini / Amministrazione</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ordini@fornitore.it"
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

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Indirizzo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Via Lavoro 10"
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
                </div>

                <div className="form-group">
                  <label className="form-label">Note</label>
                  <textarea
                    className="form-control"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Coordinate bancarie, condizioni di pagamento convenzionate..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Salva Fornitore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
