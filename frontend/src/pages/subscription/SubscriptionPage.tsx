import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_PLANS } from '../../services/api';
import { Plan } from '../../types';
import {
  CreditCard, Check, Sparkles, Shield, Clock,
  ArrowRight, CheckCircle2, Zap
} from 'lucide-react';

export const SubscriptionPage: React.FC = () => {
  const { company } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string>('Professional');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const daysLeft = 12;
  const totalDays = 14;
  const progressPercent = ((totalDays - daysLeft) / totalDays) * 100;

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setShowCheckoutModal(true);
  };

  const handleConfirmUpgrade = () => {
    setCheckoutSuccess(true);
    setTimeout(() => {
      setShowCheckoutModal(false);
      setCheckoutSuccess(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Current Subscription Status Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span className="badge badge-warning" style={{ marginBottom: '8px' }}>
              PERIODO DI PROVA ATTIVO
            </span>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Piano Attuale: Starter (Trial)</h2>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Hai accesso illimitato alle funzionalità base. Restano <strong>{daysLeft} giorni</strong> prima della scadenza.
            </p>
          </div>

          <button className="btn btn-primary btn-lg" onClick={() => setShowCheckoutModal(true)}>
            <Sparkles size={18} />
            Attiva Piano Ora
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
            <span>Giorno 2 di 14</span>
            <span>Scadenza: 22 Ottobre 2026</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(to right, #6366f1, #06b6d4)',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Plan selection header & cycle toggle */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Scegli il piano ideale per la tua azienda</h2>
        <p style={{ fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 20px' }}>
          Sblocca limiti superiori di utenti, preventivi avanzati e supporto dedicato.
        </p>

        {/* Monthly vs Yearly Switch */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setBillingCycle('monthly')}
          >
            Fatturazione Mensile
          </button>
          <button
            className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setBillingCycle('yearly')}
          >
            Annuale (-17% Sconto)
          </button>
        </div>
      </div>

      {/* Plans Pricing Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '22px' }}>
        {MOCK_PLANS.map((plan: Plan) => {
          const isPopular = plan.name === 'Professional';
          const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round((plan.priceYearly || 0) / 12);

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                border: isPopular ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transform: isPopular ? 'scale(1.02)' : 'none',
              }}
            >
              {isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.05em',
                  }}
                >
                  PIÙ SCELTO DALLE AZIENDE
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '1.35rem', margin: 0 }}>{plan.name}</h3>
                </div>

                <p style={{ fontSize: '0.825rem', color: '#94a3b8', minHeight: '40px' }}>
                  {plan.description}
                </p>

                <div style={{ margin: '20px 0' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                    €{price}
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}> / mese</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {billingCycle === 'yearly' ? `Fatturati €${plan.priceYearly} all’anno` : 'Fatturazione mensile senza vincoli'}
                  </div>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '18px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    FUNZIONALITÀ INCLUSE
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#f8fafc' }}>
                    <Check size={16} color="#10b981" />
                    <span><strong>{plan.maxUsers ? `${plan.maxUsers} Utenti` : 'Utenti Illimitati'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#f8fafc' }}>
                    <Check size={16} color="#10b981" />
                    <span><strong>{plan.maxClients ? `${plan.maxClients} Clienti` : 'Clienti Illimitati'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#f8fafc' }}>
                    <Check size={16} color="#10b981" />
                    <span><strong>{plan.maxDocuments ? `${plan.maxDocuments} Documenti/anno` : 'Documenti Illimitati'}</strong></span>
                  </div>

                  {Object.entries(plan.features || {}).map(([feat, enabled], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: enabled ? '#f8fafc' : '#64748b' }}>
                      <Check size={16} color={enabled ? '#10b981' : '#475569'} />
                      <span style={{ textDecoration: enabled ? 'none' : 'line-through' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={`btn ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', marginTop: '24px', padding: '12px' }}
                onClick={() => handleSelectPlan(plan.name)}
              >
                {plan.name === 'Starter' ? 'Mantieni Starter' : `Passa a ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout modal */}
      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Attivazione Piano {selectedPlan}</h3>
              <button className="btn-icon" onClick={() => setShowCheckoutModal(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {checkoutSuccess ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle2 size={50} color="#10b981" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Abbonamento Attivato!</h3>
                  <p style={{ fontSize: '0.85rem' }}>La tua azienda ora ha accesso completo a tutte le funzioni del piano {selectedPlan}.</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>RIEPILOGO ORDINE:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                      Piano {selectedPlan} ({billingCycle === 'monthly' ? 'Mensile' : 'Annuale'})
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#818cf8', marginTop: '2px' }}>
                      Attivazione immediata • Garanzia 30 giorni soddisfatti o rimborsati
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Metodo di Pagamento</label>
                    <select className="form-control">
                      <option>Carta di Credito (Stripe Secure)</option>
                      <option>Addebito Diretto SEPA / Bonifico</option>
                      <option>PayPal Business</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Numero Carta di Credito (Demo)</label>
                    <input type="text" className="form-control" defaultValue="•••• •••• •••• 4242" readOnly />
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleConfirmUpgrade}>
                    <Zap size={16} /> Conferma e Attiva Abbonamento
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
