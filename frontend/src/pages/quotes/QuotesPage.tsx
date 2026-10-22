import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Quote, Client, Product, Service, QuoteItem } from '../../types';
import {
  FileText, Plus, Search, Calendar, CheckCircle2, ArrowRight,
  Trash2, X, Check, Building2, Download, RefreshCw, Send
} from 'lucide-react';

export const QuotesPage: React.FC<{ onNavigateToInvoice?: () => void }> = ({ onNavigateToInvoice }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Builder State
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('Condizioni: Pagamento a 30 gg fine mese data fattura. Validità offerta: 30 giorni.');
  const [items, setItems] = useState<QuoteItem[]>([
    {
      itemType: 'PRODUCT',
      description: 'Licenza Software OMNIVIA Annuale',
      quantity: 1,
      unitPrice: 590,
      discount: 0,
      vatRate: 22,
      subtotal: 590,
      vatAmount: 129.8,
      total: 719.8,
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [q, c, p, s] = await Promise.all([
        api.quotes.getAll(),
        api.clients.getAll(),
        api.catalog.getProducts(),
        api.catalog.getServices(),
      ]);
      const quotesList = Array.isArray(q) ? q : (q.quotes || []);
      const clientsList = Array.isArray(c) ? c : (c.clients || []);
      const productsList = Array.isArray(p) ? p : (p.products || []);
      const servicesList = Array.isArray(s) ? s : (s.services || []);
      setQuotes(quotesList);
      setClients(clientsList);
      setProducts(productsList);
      setServices(servicesList);
      if (clientsList.length > 0 && !clientId) setClientId(clientsList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateLine = (item: QuoteItem) => {
    const sub = item.quantity * item.unitPrice * (1 - item.discount / 100);
    const vat = sub * (item.vatRate / 100);
    return {
      ...item,
      subtotal: parseFloat(sub.toFixed(2)),
      vatAmount: parseFloat(vat.toFixed(2)),
      total: parseFloat((sub + vat).toFixed(2)),
    };
  };

  const handleUpdateItem = (idx: number, updates: Partial<QuoteItem>) => {
    const updated = items.map((it, i) => {
      if (i === idx) return calculateLine({ ...it, ...updates });
      return it;
    });
    setItems(updated);
  };

  const handleAddItem = (type: 'PRODUCT' | 'SERVICE') => {
    const newItem: QuoteItem = {
      itemType: type,
      description: type === 'PRODUCT' ? 'Nuovo Prodotto / Articolo' : 'Prestazione Professionale',
      quantity: 1,
      unitPrice: 100,
      discount: 0,
      vatRate: 22,
      subtotal: 100,
      vatAmount: 22,
      total: 122,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const taxableTotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  const vatTotal = items.reduce((sum, it) => sum + it.vatAmount, 0);
  const grandTotal = taxableTotal + vatTotal;

  const handleSaveQuote = async () => {
    if (!clientId) {
      alert('Seleziona un cliente.');
      return;
    }
    try {
      await api.quotes.create({
        clientId,
        subtotal: taxableTotal,
        discount: 0,
        taxable: taxableTotal,
        vatAmount: vatTotal,
        total: grandTotal,
        notes,
        items,
      });
      setShowBuilder(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    if (confirm('Vuoi convertire questo preventivo in una fattura emessa?')) {
      try {
        await api.quotes.convertToInvoice(quoteId);
        loadData();
        if (onNavigateToInvoice) onNavigateToInvoice();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    return (
      q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.client?.businessName && q.client.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Preventivi & Proposte Commerciali</h1>
          <p style={{ fontSize: '0.85rem' }}>Compila offerte personalizzate e trasformale in fattura con un click</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>
          <Plus size={16} />
          <span>Nuovo Preventivo</span>
        </button>
      </div>

      {/* Search and Stats */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', width: '320px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cerca preventivo o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div>Totale Preventivati: <strong>€{quotes.reduce((s, q) => s + q.total, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong></div>
          <div>Preventivi Emessi: <strong>{quotes.length}</strong></div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Numero</th>
              <th>Cliente</th>
              <th>Data Emissione</th>
              <th>Stato</th>
              <th>Imponibile</th>
              <th>Totale con IVA</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Nessun preventivo trovato.
                </td>
              </tr>
            ) : (
              filteredQuotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      {q.number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {q.client ? (q.client.type === 'COMPANY' ? q.client.businessName : `${q.client.firstName} ${q.client.lastName}`) : 'Cliente n/d'}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(q.issueDate).toLocaleDateString('it-IT')}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        q.status === 'ACCEPTED'
                          ? 'badge-success'
                          : q.status === 'SENT'
                          ? 'badge-primary'
                          : q.status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td>
                    €{Number(q.taxable).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                      €{Number(q.total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {q.status !== 'ACCEPTED' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleConvertToInvoice(q.id)}
                          title="Converti in fattura definitiva"
                        >
                          <RefreshCw size={13} />
                          <span>Fattura</span>
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedQuote(q)}
                        title="Visualizza anteprima"
                      >
                        Dettaglio
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Builder Modal */}
      {showBuilder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Crea Nuovo Preventivo</h3>
              <button className="btn-icon" onClick={() => setShowBuilder(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Cliente Intestatario</label>
                  <select
                    className="form-control"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.type === 'COMPANY' ? c.businessName : `${c.firstName} ${c.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data Emissione</label>
                  <input
                    type="date"
                    className="form-control"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Righe dell'Offerta Economica</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAddItem('PRODUCT')}>
                      + Prodotto
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAddItem('SERVICE')}>
                      + Servizio
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1fr 1.2fr 1fr 1fr 40px',
                        gap: '8px',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Descrizione bene/servizio"
                        value={it.description}
                        onChange={(e) => handleUpdateItem(idx, { description: e.target.value })}
                      />
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        placeholder="Q.tà"
                        value={it.quantity}
                        onChange={(e) => handleUpdateItem(idx, { quantity: parseFloat(e.target.value) || 1 })}
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="Prezzo €"
                        value={it.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                      <select
                        className="form-control"
                        value={it.vatRate}
                        onChange={(e) => handleUpdateItem(idx, { vatRate: parseFloat(e.target.value) })}
                      >
                        <option value={22}>IVA 22%</option>
                        <option value={10}>IVA 10%</option>
                        <option value={4}>IVA 4%</option>
                        <option value={0}>IVA 0%</option>
                      </select>
                      <div style={{ fontWeight: 700, textAlign: 'right', fontSize: '0.9rem', color: '#ffffff' }}>
                        €{it.total.toFixed(2)}
                      </div>
                      <button
                        className="btn-icon"
                        style={{ color: '#ef4444' }}
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary Card */}
              <div
                style={{
                  alignSelf: 'flex-end',
                  width: '320px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span>Imponibile Netto:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>€{taxableTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span>Totale IVA:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>€{vatTotal.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '8px',
                    marginTop: '4px',
                  }}
                >
                  <span>Totale Preventivo:</span>
                  <span style={{ color: '#818cf8' }}>€{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Condizioni Contrattuali & Note</label>
                <textarea
                  className="form-control"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBuilder(false)}>
                Annulla
              </button>
              <button className="btn btn-primary" onClick={handleSaveQuote}>
                <Check size={16} />
                Salva ed Emetti Preventivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Preview Modal */}
      {selectedQuote && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Dettaglio {selectedQuote.number}</h3>
              <button className="btn-icon" onClick={() => setSelectedQuote(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>DESTINATARIO:</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                    {selectedQuote.client?.businessName || 'Cliente Privato'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {selectedQuote.client?.email}
                  </div>
                </div>
                <span className="badge badge-primary">{selectedQuote.status}</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>VOCI INCLUSE:</div>
                {selectedQuote.items?.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <span>{it.description} (x{it.quantity})</span>
                    <span style={{ fontWeight: 600 }}>€{Number(it.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#818cf8' }}>
                  Totale: €{Number(selectedQuote.total).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedQuote(null)}>
                Chiudi
              </button>
              {selectedQuote.status !== 'ACCEPTED' && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleConvertToInvoice(selectedQuote.id);
                    setSelectedQuote(null);
                  }}
                >
                  <RefreshCw size={15} /> Converti in Fattura
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
