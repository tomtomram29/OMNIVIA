import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Invoice, Client, PaymentMethod } from '../../types';
import {
  Receipt, Plus, Search, DollarSign, CheckCircle2, Clock,
  AlertCircle, CreditCard, X, Check, ArrowRight
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Payment modal state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [payNotes, setPayNotes] = useState('Bonifico ricevuto su conto corrente aziendale');

  // New Invoice State
  const [newClientId, setNewClientId] = useState('');
  const [newDescription, setNewDescription] = useState('Servizi di consulenza e fornitura');
  const [newAmount, setNewAmount] = useState<number>(1000);
  const [newDueDate, setNewDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inv, c] = await Promise.all([
        api.invoices.getAll(),
        api.clients.getAll(),
      ]);
      const invoicesList = Array.isArray(inv) ? inv : (inv.invoices || []);
      const clientsList = Array.isArray(c) ? c : (c.clients || []);
      setInvoices(invoicesList);
      setClients(clientsList);
      if (clientsList.length > 0 && !newClientId) setNewClientId(clientsList[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPayAmount(inv.remainingAmount);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    try {
      await api.invoices.addPayment(selectedInvoiceForPayment.id, {
        amount: payAmount,
        method: payMethod,
        notes: payNotes,
      });
      setSelectedInvoiceForPayment(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const vat = newAmount * 0.22;
    const total = newAmount + vat;
    try {
      await api.invoices.create({
        clientId: newClientId,
        subtotal: newAmount,
        taxable: newAmount,
        vatAmount: vat,
        total,
        dueDate: new Date(newDueDate).toISOString(),
        items: [
          {
            itemType: 'SERVICE',
            description: newDescription,
            quantity: 1,
            unitPrice: newAmount,
            discount: 0,
            vatRate: 22,
            subtotal: newAmount,
            vatAmount: vat,
            total,
          },
        ],
      });
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = invoices.filter((i) => {
    return (
      i.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.client?.businessName && i.client.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Fatturazione & Gestione Incassi</h1>
          <p style={{ fontSize: '0.85rem' }}>Emetti documenti fiscali, controlla lo stato dei crediti e registra i pagamenti</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          <span>Emetti Nuova Fattura</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.08)', width: '320px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cerca fattura per numero o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
          <div>Totale Emesso: <strong style={{ color: '#ffffff' }}>€{invoices.reduce((s, i) => s + i.total, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong></div>
          <div>Incassato: <strong style={{ color: '#10b981' }}>€{invoices.reduce((s, i) => s + i.paidAmount, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong></div>
          <div>Crediti Residui: <strong style={{ color: '#f59e0b' }}>€{invoices.reduce((s, i) => s + i.remainingAmount, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong></div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Numero Documento</th>
              <th>Cliente</th>
              <th>Data Emissione / Scadenza</th>
              <th>Stato Pagamento</th>
              <th>Importo Totale</th>
              <th>Incassato</th>
              <th>Residuo da Pagare</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Nessuna fattura registrata.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {inv.number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {inv.client?.businessName || (inv.client ? `${inv.client.firstName} ${inv.client.lastName}` : 'Cliente')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#ffffff' }}>{new Date(inv.issueDate).toLocaleDateString('it-IT')}</div>
                    {inv.dueDate && (
                      <div style={{ fontSize: '0.72rem', color: inv.status === 'OVERDUE' ? '#ef4444' : '#64748b' }}>
                        Scadenza: {new Date(inv.dueDate).toLocaleDateString('it-IT')}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        inv.status === 'PAID'
                          ? 'badge-success'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'badge-warning'
                          : inv.status === 'OVERDUE'
                          ? 'badge-danger'
                          : 'badge-primary'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>
                      €{Number(inv.total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td>
                    <div style={{ color: '#10b981', fontWeight: 600 }}>
                      €{Number(inv.paidAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td>
                    <div style={{ color: inv.remainingAmount > 0 ? '#fbbf24' : '#64748b', fontWeight: 600 }}>
                      €{Number(inv.remainingAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td>
                    {inv.status !== 'PAID' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenPayment(inv)}
                      >
                        <DollarSign size={13} />
                        Registra Incasso
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Saldata
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Registration Modal */}
      {selectedInvoiceForPayment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Registra Pagamento per {selectedInvoiceForPayment.number}</h3>
              <button className="btn-icon" onClick={() => setSelectedInvoiceForPayment(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Importo Totale Fattura: <strong>€{selectedInvoiceForPayment.total.toFixed(2)}</strong></div>
                  <div style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 700, marginTop: '4px' }}>
                    Residuo attuale da incassare: <span style={{ color: '#fbbf24' }}>€{selectedInvoiceForPayment.remainingAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Importo Incassato (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedInvoiceForPayment.remainingAmount}
                    className="form-control"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Metodo di Pagamento</label>
                  <select
                    className="form-control"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="BANK_TRANSFER">Bonifico Bancario</option>
                    <option value="CREDIT_CARD">Carta di Credito</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="CASH">Contanti</option>
                    <option value="CHECK">Assegno</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Note / Riferimento Accredito</label>
                  <textarea
                    className="form-control"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Es. CRO bonifico, estremi di pagamento..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedInvoiceForPayment(null)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Conferma Incasso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Emetti Nuova Fattura</h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Cliente Intestatario</label>
                  <select
                    className="form-control"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.type === 'COMPANY' ? c.businessName : `${c.firstName} ${c.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrizione Prestazione Principale</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Imponibile Netto (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={newAmount}
                      onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data Scadenza Pagamento</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>IVA 22%: <strong>€{(newAmount * 0.22).toFixed(2)}</strong></div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    Totale Fattura: €{(newAmount * 1.22).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Emetti Fattura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
