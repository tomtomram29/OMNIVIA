// ============================================================
// OMNIVIA DATA MODELS & TYPES
// Corrispondenti a Prisma Schema e API Express
// ============================================================

export type UserRole = 'SUPER_ADMIN_OMNIVIA' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type CompanyStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'PAST_DUE';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'PAYPAL' | 'CHECK' | 'OTHER';
export type ClientType = 'INDIVIDUAL' | 'COMPANY';
export type ItemType = 'PRODUCT' | 'SERVICE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  companyId?: string;
  companyRole?: UserRole;
  companyName?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string;
  vatNumber?: string | null;
  fiscalCode?: string | null;
  status: CompanyStatus;
  invoicePrefix?: string | null;
  invoiceNextNumber: number;
  quotePrefix?: string | null;
  quoteNextNumber: number;
  defaultVatRate: number;
  currency: string;
  createdAt: string;
  subscription?: Subscription;
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly?: number | null;
  durationDays: number;
  maxUsers?: number | null;
  maxClients?: number | null;
  maxDocuments?: number | null;
  features?: Record<string, boolean>;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  companyId: string;
  planId?: string | null;
  plan?: Plan;
  status: SubscriptionStatus;
  trialStart?: string | null;
  trialEnd?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  cancellationDate?: string | null;
  notes?: string | null;
}

export interface Client {
  id: string;
  companyId: string;
  type: ClientType;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  fiscalCode?: string | null;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  businessName: string;
  contactName?: string | null;
  fiscalCode?: string | null;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  price: number;
  vatRate: number;
  category?: string | null;
  unit?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  companyId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  price: number;
  vatRate: number;
  category?: string | null;
  unit?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assignee?: { id: string; firstName: string; lastName: string; email?: string } | null;
  creatorId: string;
  creator?: { id: string; firstName: string; lastName: string } | null;
  clientId?: string | null;
  client?: { id: string; firstName?: string | null; lastName?: string | null; businessName?: string | null } | null;
  dueDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  companyId: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string | null;
  color?: string;
  userId: string;
  user?: { id: string; firstName: string; lastName: string };
  clientId?: string | null;
  client?: { id: string; firstName?: string | null; lastName?: string | null; businessName?: string | null };
  notes?: string | null;
  createdAt: string;
}

export interface QuoteItem {
  id?: string;
  quoteId?: string;
  itemType: ItemType;
  productId?: string | null;
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  sortOrder?: number;
}

export interface Quote {
  id: string;
  companyId: string;
  number: string;
  clientId?: string | null;
  client?: Client | null;
  status: QuoteStatus;
  issueDate: string;
  expiryDate?: string | null;
  subtotal: number;
  discount: number;
  discountType?: 'AMOUNT' | 'PERCENT';
  taxable: number;
  vatAmount: number;
  total: number;
  notes?: string | null;
  items?: QuoteItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  itemType: ItemType;
  productId?: string | null;
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  sortOrder?: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  companyId: string;
  number: string;
  clientId?: string | null;
  client?: Client | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  paymentMethod?: PaymentMethod | null;
  subtotal: number;
  discount: number;
  discountType?: string;
  taxable: number;
  vatAmount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string | null;
  quoteId?: string | null;
  items?: InvoiceItem[];
  invoicePayments?: InvoicePayment[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { firstName: string; lastName: string; email: string };
  companyId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  description?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
