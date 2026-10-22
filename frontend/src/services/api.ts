import {
  User, Company, Client, Supplier, Product, Service,
  Task, CalendarEvent, Quote, Invoice, Plan, Subscription,
  AuditLog, Notification, InvoicePayment
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================================
// TOKEN HELPERS
// ============================================================
export const getToken = (): string | null => localStorage.getItem('omnivia_token');
export const setToken = (token: string): void => localStorage.setItem('omnivia_token', token);
export const removeToken = (): void => {
  localStorage.removeItem('omnivia_token');
  localStorage.removeItem('omnivia_refresh_token');
};
export const getRefreshToken = (): string | null => localStorage.getItem('omnivia_refresh_token');
export const setRefreshToken = (token: string): void => localStorage.setItem('omnivia_refresh_token', token);

// ============================================================
// API ERROR CLASS
// ============================================================
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================================
// OFFLINE / DEMO MOCK FALLBACK
// ============================================================
function getMockFallback(endpoint: string, _method = 'GET'): any {
  if (endpoint.startsWith('/auth/profile')) {
    return {
      user: {
        id: 'usr_demo1',
        email: 'admin@omnivia.io',
        firstName: 'Marco',
        lastName: 'Rossi',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        createdAt: '2026-01-15T09:00:00Z',
      },
      company: {
        id: 'comp_demo1',
        name: 'Omnivia Tech S.r.l.',
        status: 'ACTIVE',
        role: 'ADMIN',
        vatNumber: 'IT01234567890',
        fiscalCode: '01234567890',
        email: 'info@omniviasoftware.it',
        phone: '+39 02 8976 5432',
        address: 'Via Monte Napoleone 18',
        city: 'Milano',
        province: 'MI',
        postalCode: '20121',
        invoicePrefix: 'FT',
        invoiceNextNumber: 104,
        quotePrefix: 'PV',
        quoteNextNumber: 215,
        defaultVatRate: 22,
        currency: 'EUR',
      },
      subscription: {
        status: 'ACTIVE',
        startDate: '2026-01-01T00:00:00Z',
        daysRemaining: 18,
        plan: { id: 'starter', name: 'Starter' },
      },
    };
  }

  if (endpoint.startsWith('/clients')) {
    return {
      clients: [
        {
          id: 'cli_1',
          companyId: 'comp_demo1',
          type: 'COMPANY',
          businessName: 'NextGen Solutions S.r.l.',
          vatNumber: 'IT09876543210',
          fiscalCode: '09876543210',
          email: 'amministrazione@nextgensol.it',
          phone: '+39 02 5544 3322',
          city: 'Milano',
          province: 'MI',
          address: 'Via Torino 45',
          postalCode: '20123',
          country: 'Italia',
          isActive: true,
          createdAt: '2026-02-10T10:00:00Z',
        },
        {
          id: 'cli_2',
          companyId: 'comp_demo1',
          type: 'COMPANY',
          businessName: 'Studio Legale & Associati Bianchi',
          vatNumber: 'IT08765432109',
          fiscalCode: '08765432109',
          email: 'studio@legalbianchi.it',
          phone: '+39 06 6789 1234',
          city: 'Roma',
          province: 'RM',
          address: 'Via Condotti 12',
          postalCode: '00187',
          country: 'Italia',
          isActive: true,
          createdAt: '2026-03-01T14:30:00Z',
        },
        {
          id: 'cli_3',
          companyId: 'comp_demo1',
          type: 'INDIVIDUAL',
          firstName: 'Alessandro',
          lastName: 'Ferrari',
          fiscalCode: 'FRRLSN85M01F205Z',
          email: 'alessandro.ferrari@gmail.com',
          phone: '+39 340 1234567',
          city: 'Torino',
          province: 'TO',
          address: 'Corso Francia 88',
          postalCode: '10138',
          country: 'Italia',
          isActive: true,
          createdAt: '2026-03-15T11:15:00Z',
        },
      ],
      total: 3,
      page: 1,
      limit: 20,
    };
  }

  if (endpoint.startsWith('/suppliers')) {
    return {
      suppliers: [
        {
          id: 'sup_1',
          companyId: 'comp_demo1',
          businessName: 'CloudHosting Italia S.p.a.',
          contactName: 'Paolo Rossi',
          vatNumber: 'IT04561237890',
          email: 'support@cloudhosting.it',
          phone: '+39 02 9988 7766',
          city: 'Bologna',
          notes: 'Infrastruttura server cluster',
          isActive: true,
          createdAt: '2026-01-20T08:00:00Z',
        },
        {
          id: 'sup_2',
          companyId: 'comp_demo1',
          businessName: 'Ufficio & Hardware Express S.r.l.',
          contactName: 'Elena Conti',
          vatNumber: 'IT03322114455',
          email: 'ordini@hardwarexpr.it',
          phone: '+39 011 4433 2211',
          city: 'Torino',
          notes: 'Fornitore workstation e hardware',
          isActive: true,
          createdAt: '2026-02-05T09:30:00Z',
        },
      ],
      total: 2,
    };
  }

  if (endpoint.startsWith('/products')) {
    return {
      products: [
        {
          id: 'prod_1',
          companyId: 'comp_demo1',
          code: 'SW-ERP-01',
          name: 'Licenza OMNIVIA Cloud Starter',
          description: 'Abbonamento mensile software gestionale Cloud',
          price: 29.00,
          vatRate: 22,
          category: 'Software',
          unit: 'lic',
          isActive: true,
          createdAt: '2026-01-10T00:00:00Z',
        },
        {
          id: 'prod_2',
          companyId: 'comp_demo1',
          code: 'SW-ERP-PRO',
          name: 'Licenza OMNIVIA Enterprise Pack',
          description: 'Suite aziendale completa con moduli avanzati',
          price: 99.00,
          vatRate: 22,
          category: 'Software',
          unit: 'lic',
          isActive: true,
          createdAt: '2026-01-10T00:00:00Z',
        },
      ],
      total: 2,
    };
  }

  if (endpoint.startsWith('/services')) {
    return {
      services: [
        {
          id: 'serv_1',
          companyId: 'comp_demo1',
          code: 'CNS-TECH',
          name: 'Consulenza Tecnica Specialistica',
          description: 'Sessione di analisi architetturale e integrazione API',
          price: 95.00,
          vatRate: 22,
          category: 'Consulenza',
          unit: 'ora',
          isActive: true,
          createdAt: '2026-01-15T00:00:00Z',
        },
        {
          id: 'serv_2',
          companyId: 'comp_demo1',
          code: 'SUP-ANN',
          name: 'Supporto Sistemistico e SLA Garantito',
          description: 'Presa in carico ticket in meno di 2 ore',
          price: 450.00,
          vatRate: 22,
          category: 'Supporto',
          unit: 'mese',
          isActive: true,
          createdAt: '2026-02-01T00:00:00Z',
        },
      ],
      total: 2,
    };
  }

  if (endpoint.startsWith('/tasks/stats')) {
    return { todo: 2, inProgress: 1, completed: 3, overdue: 0, total: 6 };
  }

  if (endpoint.startsWith('/tasks')) {
    return {
      tasks: [
        {
          id: 'tsk_1',
          companyId: 'comp_demo1',
          title: 'Configurare connettore SDI per fatturazione',
          description: 'Impostare credenziali SDI e test trasmissione XML',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          dueDate: '2026-10-24T18:00:00Z',
          creatorId: 'usr_demo1',
          assignee: { id: 'usr_demo1', firstName: 'Marco', lastName: 'Rossi' },
          client: { businessName: 'NextGen Solutions S.r.l.' },
          createdAt: '2026-10-15T10:00:00Z',
        },
        {
          id: 'tsk_2',
          companyId: 'comp_demo1',
          title: 'Revisione preventivo server farm',
          description: 'Valutare passaggio a cluster Kubernetes ridondato',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: '2026-10-28T12:00:00Z',
          creatorId: 'usr_demo1',
          assignee: { id: 'usr_demo1', firstName: 'Marco', lastName: 'Rossi' },
          createdAt: '2026-10-16T14:00:00Z',
        },
        {
          id: 'tsk_3',
          companyId: 'comp_demo1',
          title: 'Invio report mensile andamento vendite',
          description: 'Estrarre KPI fatturato e crediti pendenti per i soci',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          dueDate: '2026-10-14T17:00:00Z',
          completedAt: '2026-10-14T16:30:00Z',
          creatorId: 'usr_demo1',
          assignee: { id: 'usr_demo1', firstName: 'Marco', lastName: 'Rossi' },
          createdAt: '2026-10-10T09:00:00Z',
        },
      ],
      total: 3,
    };
  }

  if (endpoint.startsWith('/calendar')) {
    return [
      {
        id: 'cal_1',
        companyId: 'comp_demo1',
        title: 'Meeting kick-off con NextGen Solutions',
        description: 'Definizione roadmap rilascio e demo piattaforma',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        allDay: false,
        location: 'Google Meet',
        color: '#6366f1',
        userId: 'usr_demo1',
        client: { businessName: 'NextGen Solutions S.r.l.' },
        createdAt: '2026-10-15T00:00:00Z',
      },
      {
        id: 'cal_2',
        companyId: 'comp_demo1',
        title: 'Chiusura contabile e verifica pagamenti',
        description: 'Controllo riconciliazione estratti conto bancari',
        startDate: new Date(Date.now() + 172800000).toISOString(),
        endDate: new Date(Date.now() + 176400000).toISOString(),
        allDay: false,
        location: 'Ufficio Amministrazione',
        color: '#10b981',
        userId: 'usr_demo1',
        createdAt: '2026-10-16T00:00:00Z',
      },
    ];
  }

  if (endpoint.startsWith('/quotes')) {
    return {
      quotes: [
        {
          id: 'quo_1',
          companyId: 'comp_demo1',
          number: 'PV-2026-001',
          clientId: 'cli_1',
          client: {
            id: 'cli_1',
            companyId: 'comp_demo1',
            type: 'COMPANY',
            businessName: 'NextGen Solutions S.r.l.',
            vatNumber: 'IT09876543210',
            email: 'amministrazione@nextgensol.it',
            isActive: true,
            createdAt: '2026-02-10T10:00:00Z',
          },
          status: 'SENT',
          issueDate: '2026-10-12',
          expiryDate: '2026-11-12',
          subtotal: 1850.00,
          discount: 0,
          taxable: 1850.00,
          vatAmount: 407.00,
          total: 2257.00,
          notes: 'Pagamento 30 gg d.f.',
          items: [
            {
              itemType: 'SERVICE',
              description: 'Consulenza Specialistica Integrazione ERP (20 ore)',
              quantity: 20,
              unitPrice: 85.00,
              discount: 0,
              vatRate: 22,
              subtotal: 1700.00,
              vatAmount: 374.00,
              total: 2074.00,
            },
            {
              itemType: 'PRODUCT',
              description: 'Modulo Avanzato Reportistica',
              quantity: 1,
              unitPrice: 150.00,
              discount: 0,
              vatRate: 22,
              subtotal: 150.00,
              vatAmount: 33.00,
              total: 183.00,
            },
          ],
          createdAt: '2026-10-12T10:00:00Z',
        },
      ],
      total: 1,
    };
  }

  if (endpoint.startsWith('/invoices/stats')) {
    return {
      totalInvoices: 2,
      totalRevenue: 5124.00,
      totalPaid: 3660.00,
      totalDue: 1464.00,
      overdueCount: 0,
    };
  }

  if (endpoint.startsWith('/invoices')) {
    return {
      invoices: [
        {
          id: 'inv_1',
          companyId: 'comp_demo1',
          number: 'FT-2026-001',
          clientId: 'cli_1',
          client: {
            id: 'cli_1',
            companyId: 'comp_demo1',
            type: 'COMPANY',
            businessName: 'NextGen Solutions S.r.l.',
            vatNumber: 'IT09876543210',
            email: 'amministrazione@nextgensol.it',
            isActive: true,
            createdAt: '2026-02-10T10:00:00Z',
          },
          status: 'PAID',
          issueDate: '2026-10-01',
          dueDate: '2026-10-31',
          paymentMethod: 'BANK_TRANSFER',
          subtotal: 3000.00,
          discount: 0,
          taxable: 3000.00,
          vatAmount: 660.00,
          total: 3660.00,
          paidAmount: 3660.00,
          remainingAmount: 0,
          items: [
            {
              itemType: 'SERVICE',
              description: 'Sviluppo Modulo Custom OMNIVIA',
              quantity: 1,
              unitPrice: 3000.00,
              discount: 0,
              vatRate: 22,
              subtotal: 3000.00,
              vatAmount: 660.00,
              total: 3660.00,
            },
          ],
          createdAt: '2026-10-01T09:00:00Z',
        },
        {
          id: 'inv_2',
          companyId: 'comp_demo1',
          number: 'FT-2026-002',
          clientId: 'cli_2',
          client: {
            id: 'cli_2',
            companyId: 'comp_demo1',
            type: 'COMPANY',
            businessName: 'Studio Legale & Associati Bianchi',
            vatNumber: 'IT08765432109',
            email: 'studio@legalbianchi.it',
            isActive: true,
            createdAt: '2026-03-01T14:30:00Z',
          },
          status: 'DUE',
          issueDate: '2026-10-10',
          dueDate: '2026-11-10',
          paymentMethod: 'BANK_TRANSFER',
          subtotal: 1200.00,
          discount: 0,
          taxable: 1200.00,
          vatAmount: 264.00,
          total: 1464.00,
          paidAmount: 0,
          remainingAmount: 1464.00,
          items: [
            {
              itemType: 'SERVICE',
              description: 'Assistenza e Manutenzione Canone Q4',
              quantity: 1,
              unitPrice: 1200.00,
              discount: 0,
              vatRate: 22,
              subtotal: 1200.00,
              vatAmount: 264.00,
              total: 1464.00,
            },
          ],
          createdAt: '2026-10-10T11:00:00Z',
        },
      ],
      total: 2,
    };
  }

  if (endpoint.startsWith('/companies/stats')) {
    return {
      totalCompanies: 12,
      trialCompanies: 4,
      activeCompanies: 7,
      expiredCompanies: 1,
      suspendedCompanies: 0,
      cancelledCompanies: 0,
      totalUsers: 38,
      activeSubscriptions: 7,
      expiringSubscriptions: 2,
      recentCompanies: [],
    };
  }

  if (endpoint.startsWith('/companies/mine')) {
    return {
      id: 'comp_demo1',
      name: 'Omnivia Tech S.r.l.',
      slug: 'omnivia-tech',
      email: 'info@omniviasoftware.it',
      phone: '+39 02 8976 5432',
      vatNumber: 'IT01234567890',
      fiscalCode: '01234567890',
      website: 'https://omniviasoftware.it',
      address: 'Via Monte Napoleone 18',
      city: 'Milano',
      province: 'MI',
      postalCode: '20121',
      country: 'Italia',
      status: 'ACTIVE',
      invoicePrefix: 'FT',
      invoiceNextNumber: 104,
      quotePrefix: 'PV',
      quoteNextNumber: 215,
      defaultVatRate: 22,
      currency: 'EUR',
      createdAt: '2026-01-01T00:00:00Z',
    };
  }

  if (endpoint.startsWith('/companies')) {
    return {
      companies: [
        {
          id: 'comp_1',
          name: 'Omnivia Tech S.r.l.',
          slug: 'omnivia-tech',
          email: 'admin@omnivia.io',
          phone: '+39 02 8976 5432',
          status: 'ACTIVE',
          vatNumber: 'IT01234567890',
          city: 'Milano',
          defaultVatRate: 22,
          currency: 'EUR',
          invoiceNextNumber: 104,
          quoteNextNumber: 215,
          createdAt: '2026-01-01T00:00:00Z',
          subscription: {
            id: 'sub_1',
            companyId: 'comp_1',
            status: 'ACTIVE',
            plan: { id: 'pro', name: 'Professional', priceMonthly: 59, durationDays: 30, isActive: true },
          },
        },
        {
          id: 'comp_2',
          name: 'Acme Digital Agency S.r.l.',
          slug: 'acme-digital',
          email: 'direzione@acmedigital.it',
          phone: '+39 06 9988 1122',
          status: 'TRIAL',
          vatNumber: 'IT09988776655',
          city: 'Roma',
          defaultVatRate: 22,
          currency: 'EUR',
          invoiceNextNumber: 12,
          quoteNextNumber: 25,
          createdAt: '2026-10-10T12:00:00Z',
          subscription: {
            id: 'sub_2',
            companyId: 'comp_2',
            status: 'TRIAL',
            trialEnd: new Date(Date.now() + 10 * 86400000).toISOString(),
            plan: { id: 'starter', name: 'Starter', priceMonthly: 29, durationDays: 30, isActive: true },
          },
        },
      ],
      total: 2,
    };
  }

  if (endpoint.startsWith('/plans')) {
    return MOCK_PLANS;
  }

  if (endpoint.startsWith('/audit')) {
    return {
      logs: [
        {
          id: 'aud_1',
          action: 'LOGIN',
          description: 'Accesso eseguito con successo',
          ipAddress: '127.0.0.1',
          createdAt: new Date().toISOString(),
          user: { firstName: 'Marco', lastName: 'Rossi', email: 'admin@omnivia.io' },
        },
        {
          id: 'aud_2',
          action: 'CREATE_INVOICE',
          description: 'Creata fattura FT-2026-002 per Studio Legale Bianchi',
          ipAddress: '127.0.0.1',
          createdAt: '2026-10-10T11:00:00Z',
          user: { firstName: 'Marco', lastName: 'Rossi', email: 'admin@omnivia.io' },
        },
      ],
      total: 2,
    };
  }

  if (endpoint.startsWith('/notifications')) {
    return [];
  }

  return {};
}

// ============================================================
// GENERIC REQUEST WRAPPER
// ============================================================
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (let browser set boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 — try token refresh
    if (res.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getToken()}`;
        const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (retryRes.ok) {
          const json = await retryRes.json();
          return json.data !== undefined ? json.data : json;
        }
      }
      // If refresh fails, clear auth and redirect
      removeToken();
      localStorage.removeItem('omnivia_user');
      window.location.reload();
      throw new ApiError('Sessione scaduta. Effettua nuovamente il login.', 401);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new ApiError(
        errData.message || `Richiesta fallita con stato ${res.status}`,
        res.status,
        errData.code
      );
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as unknown as T;
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    // Network failure / offline fallback to mock data
    return getMockFallback(endpoint, (options.method as string) || 'GET') as T;
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    const data = json.data || json;
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// MOCK / DEFAULT PLANS
// ============================================================
export const MOCK_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Piano ideale per piccole imprese e professionisti. Include tutte le funzionalità base.',
    priceMonthly: 29.00,
    priceYearly: 290.00,
    durationDays: 30,
    maxUsers: 3,
    maxClients: 100,
    maxDocuments: 500,
    features: {
      'Clienti & Fornitori': true,
      'Prodotti & Servizi': true,
      'Attività & Calendario': true,
      'Preventivi & Fatture': true,
      'Pagamenti & Documenti': true,
      'Report Base': true,
    },
    isActive: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Piano completo per aziende in crescita. Utenti illimitati e funzionalità avanzate.',
    priceMonthly: 59.00,
    priceYearly: 590.00,
    durationDays: 30,
    maxUsers: 10,
    maxClients: 500,
    maxDocuments: 2000,
    features: {
      'Tutte le funzioni Starter': true,
      'Report Avanzati & Statistiche': true,
      'Audit Log Completo': true,
      'Multi-utente fino a 10': true,
      'Notifiche automatiche': true,
    },
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Piano illimitato per grandi aziende. Supporto prioritario e funzionalità personalizzate.',
    priceMonthly: 99.00,
    priceYearly: 990.00,
    durationDays: 30,
    maxUsers: null,
    maxClients: null,
    maxDocuments: null,
    features: {
      'Tutte le funzioni Professional': true,
      'Utenti & Documenti Illimitati': true,
      'Accesso API & Webhook': true,
      'Supporto prioritario 24/7': true,
      'Personalizzazione avanzata': true,
    },
    isActive: true,
  },
];

// ============================================================
// API CLIENT
// ============================================================
export const api = {
  // ============================================================
  // AUTH
  // ============================================================
  auth: {
    login: async (email: string, password: string): Promise<{
      user: User;
      company: any;
      subscription: any;
      accessToken: string;
      refreshToken: string;
    }> => {
      const data = await request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data;
    },

    register: async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      companyName: string;
      companyEmail?: string;
      phone?: string;
    }): Promise<{
      user: User;
      company: any;
      subscription: any;
      accessToken: string;
      refreshToken: string;
    }> => {
      const res = await request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      return res;
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (token: string, newPassword: string): Promise<void> => {
      await request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword }),
      });
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },

    getProfile: async (): Promise<{ user: User; company: any; subscription: any }> => {
      return request('/auth/profile');
    },

    logout: async (): Promise<void> => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        removeToken();
        localStorage.removeItem('omnivia_user');
      }
    },
  },

  // ============================================================
  // CLIENTS
  // ============================================================
  clients: {
    getAll: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{ clients: Client[]; total: number; page: number; limit: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/clients${qs ? '?' + qs : ''}`);
    },

    getById: async (id: string): Promise<Client> => {
      return request(`/clients/${id}`);
    },

    create: async (data: Partial<Client>): Promise<Client> => {
      return request('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Client>): Promise<Client> => {
      return request(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await request(`/clients/${id}`, { method: 'DELETE' });
    },
  },

  // ============================================================
  // SUPPLIERS
  // ============================================================
  suppliers: {
    getAll: async (params?: { search?: string; page?: number; limit?: number }): Promise<{ suppliers: Supplier[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/suppliers${qs ? '?' + qs : ''}`);
    },

    getById: async (id: string): Promise<Supplier> => {
      return request(`/suppliers/${id}`);
    },

    create: async (data: Partial<Supplier>): Promise<Supplier> => {
      return request('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
      return request(`/suppliers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await request(`/suppliers/${id}`, { method: 'DELETE' });
    },
  },

  // ============================================================
  // PRODUCTS
  // ============================================================
  catalog: {
    getProducts: async (params?: { search?: string; page?: number; limit?: number }): Promise<{ products: Product[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/products${qs ? '?' + qs : ''}`);
    },

    createProduct: async (data: Partial<Product>): Promise<Product> => {
      return request('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
      return request(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    deleteProduct: async (id: string): Promise<void> => {
      await request(`/products/${id}`, { method: 'DELETE' });
    },

    getServices: async (params?: { search?: string; page?: number; limit?: number }): Promise<{ services: Service[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/services${qs ? '?' + qs : ''}`);
    },

    createService: async (data: Partial<Service>): Promise<Service> => {
      return request('/services', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
      return request(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    deleteService: async (id: string): Promise<void> => {
      await request(`/services/${id}`, { method: 'DELETE' });
    },
  },

  // ============================================================
  // TASKS
  // ============================================================
  tasks: {
    getAll: async (params?: { search?: string; status?: string; priority?: string; page?: number; limit?: number }): Promise<{ tasks: Task[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/tasks${qs ? '?' + qs : ''}`);
    },

    getStats: async (): Promise<{ todo: number; inProgress: number; completed: number; overdue: number; total: number }> => {
      return request('/tasks/stats');
    },

    create: async (data: Partial<Task>): Promise<Task> => {
      return request('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<Task>): Promise<Task> => {
      return request(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await request(`/tasks/${id}`, { method: 'DELETE' });
    },
  },

  // ============================================================
  // CALENDAR
  // ============================================================
  calendar: {
    getEvents: async (params?: { start?: string; end?: string }): Promise<CalendarEvent[]> => {
      const query = new URLSearchParams();
      if (params?.start) query.set('start', params.start);
      if (params?.end) query.set('end', params.end);
      const qs = query.toString();
      return request(`/calendar${qs ? '?' + qs : ''}`);
    },

    create: async (data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
      return request('/calendar', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
      return request(`/calendar/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await request(`/calendar/${id}`, { method: 'DELETE' });
    },
  },

  // ============================================================
  // QUOTES
  // ============================================================
  quotes: {
    getAll: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{ quotes: Quote[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/quotes${qs ? '?' + qs : ''}`);
    },

    getById: async (id: string): Promise<Quote> => {
      return request(`/quotes/${id}`);
    },

    create: async (data: any): Promise<Quote> => {
      return request('/quotes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: any): Promise<Quote> => {
      return request(`/quotes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await request(`/quotes/${id}`, { method: 'DELETE' });
    },

    duplicate: async (id: string): Promise<Quote> => {
      return request(`/quotes/${id}/duplicate`, { method: 'POST' });
    },

    convertToInvoice: async (quoteId: string): Promise<Invoice> => {
      return request(`/quotes/${quoteId}/convert-to-invoice`, { method: 'POST' });
    },
  },

  // ============================================================
  // INVOICES
  // ============================================================
  invoices: {
    getAll: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{ invoices: Invoice[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/invoices${qs ? '?' + qs : ''}`);
    },

    getById: async (id: string): Promise<Invoice> => {
      return request(`/invoices/${id}`);
    },

    create: async (data: any): Promise<Invoice> => {
      return request('/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: any): Promise<Invoice> => {
      return request(`/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<void> => {
      await request(`/invoices/${id}`, { method: 'DELETE' });
    },

    addPayment: async (invoiceId: string, paymentData: {
      amount: number;
      method: string;
      notes?: string;
    }): Promise<InvoicePayment> => {
      return request(`/payments/invoice/${invoiceId}`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
    },

    getStats: async (): Promise<{
      totalInvoices: number;
      totalRevenue: number;
      totalPaid: number;
      totalDue: number;
      overdueCount: number;
    }> => {
      return request('/invoices/stats');
    },
  },

  // ============================================================
  // DOCUMENTS
  // ============================================================
  documents: {
    getAll: async (params?: { clientId?: string; taskId?: string; quoteId?: string; invoiceId?: string }): Promise<any[]> => {
      const query = new URLSearchParams();
      if (params?.clientId) query.set('clientId', params.clientId);
      if (params?.taskId) query.set('taskId', params.taskId);
      if (params?.quoteId) query.set('quoteId', params.quoteId);
      if (params?.invoiceId) query.set('invoiceId', params.invoiceId);
      const qs = query.toString();
      return request(`/documents${qs ? '?' + qs : ''}`);
    },

    upload: async (formData: FormData): Promise<any> => {
      return request('/documents', {
        method: 'POST',
        body: formData,
      });
    },

    download: (id: string): string => {
      return `${API_BASE_URL}/documents/${id}/download`;
    },

    delete: async (id: string): Promise<void> => {
      await request(`/documents/${id}`, { method: 'DELETE' });
    },

    rename: async (id: string, name: string): Promise<any> => {
      return request(`/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
    },
  },

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  notifications: {
    getAll: async (): Promise<Notification[]> => {
      return request('/notifications');
    },

    getUnreadCount: async (): Promise<number> => {
      const data = await request<{ count: number }>('/notifications/unread-count');
      return data.count;
    },

    markAsRead: async (id: string): Promise<void> => {
      await request(`/notifications/${id}/read`, { method: 'PATCH' });
    },

    markAllAsRead: async (): Promise<void> => {
      await request('/notifications/read-all', { method: 'PATCH' });
    },
  },

  // ============================================================
  // PLANS & SUBSCRIPTIONS
  // ============================================================
  plans: {
    getAll: async (): Promise<Plan[]> => {
      return request('/plans');
    },
  },

  subscriptions: {
    getMine: async (): Promise<Subscription & { plan?: Plan; daysRemaining?: number }> => {
      return request('/subscriptions/mine');
    },
  },

  // ============================================================
  // USERS (Company Admin)
  // ============================================================
  users: {
    getAll: async (): Promise<User[]> => {
      return request('/users');
    },

    create: async (data: { email: string; firstName: string; lastName: string; role: string; password: string }): Promise<User> => {
      return request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<User & { role: string; isActive: boolean }>): Promise<User> => {
      return request(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    deactivate: async (id: string): Promise<void> => {
      await request(`/users/${id}/deactivate`, { method: 'PATCH' });
    },
  },

  // ============================================================
  // AUDIT LOG
  // ============================================================
  audit: {
    getAll: async (params?: { page?: number; limit?: number; action?: string }): Promise<{ logs: AuditLog[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.action) query.set('action', params.action);
      const qs = query.toString();
      return request(`/audit${qs ? '?' + qs : ''}`);
    },
  },

  // ============================================================
  // COMPANY SETTINGS
  // ============================================================
  company: {
    getMine: async (): Promise<Company> => {
      return request('/companies/mine');
    },

    update: async (data: Partial<Company>): Promise<Company> => {
      return request('/companies/mine', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    uploadLogo: async (formData: FormData): Promise<{ logoUrl: string }> => {
      return request('/companies/mine/logo', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // ============================================================
  // SUPER ADMIN
  // ============================================================
  superAdmin: {
    getDashboardStats: async (): Promise<{
      totalCompanies: number;
      trialCompanies: number;
      activeCompanies: number;
      expiredCompanies: number;
      suspendedCompanies: number;
      cancelledCompanies: number;
      totalUsers: number;
      activeSubscriptions: number;
      expiringSubscriptions: number;
      recentCompanies: Company[];
    }> => {
      return request('/companies/stats');
    },

    getCompanies: async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{ companies: Company[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/companies${qs ? '?' + qs : ''}`);
    },

    getCompanyDetail: async (companyId: string): Promise<any> => {
      return request(`/companies/${companyId}`);
    },

    updateCompanyStatus: async (companyId: string, status: string): Promise<Company> => {
      return request(`/companies/${companyId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    updateCompany: async (companyId: string, data: any): Promise<Company> => {
      return request(`/companies/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    updateSubscription: async (companyId: string, data: {
      status?: string;
      planId?: string;
      trialEnd?: string;
      endDate?: string;
      startDate?: string;
    }): Promise<Subscription> => {
      return request(`/subscriptions/${companyId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    getCompanyUsers: async (companyId: string): Promise<User[]> => {
      return request(`/companies/${companyId}/users`);
    },

    getCompanyAuditLogs: async (companyId: string, params?: { page?: number; limit?: number }): Promise<{ logs: AuditLog[]; total: number }> => {
      const query = new URLSearchParams();
      query.set('companyId', companyId);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      return request(`/audit?${query.toString()}`);
    },

    getAuditLogs: async (params?: { page?: number; limit?: number; action?: string }): Promise<{ logs: AuditLog[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.action) query.set('action', params.action);
      const qs = query.toString();
      return request(`/audit${qs ? '?' + qs : ''}`);
    },

    getAllSubscriptions: async (params?: { status?: string; page?: number; limit?: number }): Promise<{ subscriptions: (Subscription & { company?: Company; plan?: Plan })[]; total: number }> => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/subscriptions${qs ? '?' + qs : ''}`);
    },

    getPlans: async (): Promise<Plan[]> => {
      return request('/plans');
    },

    createPlan: async (data: Partial<Plan>): Promise<Plan> => {
      return request('/plans', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updatePlan: async (id: string, data: Partial<Plan>): Promise<Plan> => {
      return request(`/plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // ============================================================
  // DASHBOARD
  // ============================================================
  dashboard: {
    getStats: async (): Promise<{
      clients: { total: number; active: number };
      suppliers: { total: number };
      tasks: { todo: number; inProgress: number; completed: number; overdue: number; total: number };
      quotes: { total: number; accepted: number; pending: number; value: number };
      invoices: { total: number; paid: number; unpaid: number; overdue: number; totalRevenue: number; totalDue: number };
      upcomingEvents: CalendarEvent[];
      upcomingDeadlines: Task[];
      recentActivity: AuditLog[];
    }> => {
      // Aggregate from multiple endpoints
      const [clientsRes, tasksStats, quotesRes, invoicesRes, eventsRes] = await Promise.allSettled([
        request<any>('/clients?limit=1'),
        request<any>('/tasks/stats'),
        request<any>('/quotes?limit=1'),
        request<any>('/invoices?limit=1'),
        request<CalendarEvent[]>('/calendar'),
      ]);

      const clientsData = clientsRes.status === 'fulfilled' ? clientsRes.value : { total: 0, clients: [] };
      const tasksData = tasksStats.status === 'fulfilled' ? tasksStats.value : { todo: 0, inProgress: 0, completed: 0, overdue: 0, total: 0 };
      const quotesData = quotesRes.status === 'fulfilled' ? quotesRes.value : { total: 0, quotes: [] };
      const invoicesData = invoicesRes.status === 'fulfilled' ? invoicesRes.value : { total: 0, invoices: [] };
      const eventsData = eventsRes.status === 'fulfilled' ? eventsRes.value : [];

      return {
        clients: { total: clientsData.total || 0, active: clientsData.total || 0 },
        suppliers: { total: 0 },
        tasks: tasksData,
        quotes: { total: quotesData.total || 0, accepted: 0, pending: 0, value: 0 },
        invoices: { total: invoicesData.total || 0, paid: 0, unpaid: 0, overdue: 0, totalRevenue: 0, totalDue: 0 },
        upcomingEvents: Array.isArray(eventsData) ? eventsData.slice(0, 5) : [],
        upcomingDeadlines: [],
        recentActivity: [],
      };
    },
  },
};
