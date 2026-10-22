import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Product, Service } from '../../types';
import { Package, Wrench, Plus, Search, Tag, Edit2, Trash2, X, Check } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    code: '',
    name: '',
    description: '',
    price: 0,
    vatRate: 22,
    category: '',
    unit: 'pz',
  });

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const [p, s] = await Promise.all([
        api.catalog.getProducts(),
        api.catalog.getServices(),
      ]);
      setProducts(Array.isArray(p) ? p : (p.products || []));
      setServices(Array.isArray(s) ? s : (s.services || []));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      price: 50.00,
      vatRate: 22,
      category: activeTab === 'products' ? 'Software' : 'Consulenza',
      unit: activeTab === 'products' ? 'pz' : 'ora',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'products') {
        await api.catalog.createProduct(formData);
      } else {
        await api.catalog.createService(formData);
      }
      setShowModal(false);
      loadCatalog();
    } catch (err) {
      console.error(err);
    }
  };

  const currentItems = activeTab === 'products' ? products : services;
  const filtered = currentItems.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Listino Prodotti & Servizi</h1>
          <p style={{ fontSize: '0.85rem' }}>Gestisci articoli e prestazioni da inserire rapidamente in preventivi e fatture</p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} />
          <span>Nuovo {activeTab === 'products' ? 'Prodotto' : 'Servizio'}</span>
        </button>
      </div>

      {/* Switcher & Search */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={16} />
            Prodotti & Beni ({products.length})
          </button>
          <button
            className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('services')}
          >
            <Wrench size={16} />
            Servizi & Prestazioni ({services.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', width: '300px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cerca per codice o nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Codice / SKU</th>
              <th>Nome & Descrizione</th>
              <th>Categoria</th>
              <th>Prezzo Base</th>
              <th>Aliquota IVA</th>
              <th>Unità</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Nessun elemento nel catalogo corrispondente.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>
                      {item.code || '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '400px' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      <Tag size={10} /> {item.category || 'Generale'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                      €{Number(item.price).toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{item.vatRate}%</span>
                  </td>
                  <td style={{ color: '#94a3b8' }}>
                    {item.unit || 'pz'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal create */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Nuovo {activeTab === 'products' ? 'Prodotto' : 'Servizio'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Codice / SKU</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="ART-001"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nome Voce</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Es. Licenza Software Standard"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrizione Dettagliata</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Specifiche tecniche o dettagli della prestazione..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Prezzo (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aliquota IVA (%)</label>
                    <select
                      className="form-control"
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) })}
                    >
                      <option value={22}>22% (Ordinaria)</option>
                      <option value={10}>10% (Ridotta)</option>
                      <option value={4}>4% (Minima)</option>
                      <option value={0}>0% (Esente / Reverse charge)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unità di Misura</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="pz / ora / mese"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Es. Hardware, Consulenza, Cloud..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Salva nel Listino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
