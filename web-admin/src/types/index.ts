export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: 'admin' | 'super_admin';
  avatar?: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city: string;
  carsCount: number;
  requestsCount: number;
  isActive: boolean;
  avatar?: string;
  joinedAt: string;
}

export type WorkshopType = 'stationary' | 'mobile' | 'both';

export interface Workshop {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
    email?: string;
    whatsapp?: string;
  city: string;
  address: string;
  rating: number;
  workshopType: WorkshopType;
  servicesCount: number;
  services: string;
  isApproved: boolean;
  isActive: boolean;
  commercialRegistration?: string;
    municipalityLicense?: string;
    beneficiaryName?: string;
    bankName?: string;
    iban?: string;
    maskedIban?: string;
    taxNumber?: string;
    commissionPercentage?: number;
    adminNotes?: string;
    contractUrl?: string;
    contractSignedAt?: string;
    contractExpiresAt?: string;
    passwordSetupCompleted?: boolean;
    lastInvitationSentAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city: string;
  vehicleType: string;
  vehiclePlate?: string;
  isOnline: boolean;
  isApproved: boolean;
  isActive: boolean;
  avatar?: string;
  joinedAt: string;
}

export interface MaintenanceRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  carMake: string;
  carModel: string;
  carYear: number;
  carPlate: string;
  serviceType: string;
  serviceTypeId: number;
  workshopId: number;
  workshopName: string;
  status: RequestStatus;
  city: string;
  pickupAddress: string;
  dropoffAddress?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus =
  | 'pending'
  | 'assigned'
  | 'inspected'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export interface Quote {
  id: number;
  requestId: number;
  workshopId: number;
  workshopName: string;
  workshopLogo?: string;
  items: QuoteItem[];
  total: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface QuoteItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InspectionPart {
  id?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InspectionLabor {
  id?: number;
  description: string;
  hours: number;
  hourlyRate: number;
  total: number;
}

export interface InspectionReport {
  id: number;
  requestId: number;
  workshopId: number;
  workshopName: string;
  notes: string;
  parts: InspectionPart[];
  labor: InspectionLabor[];
  taxPercent: number;
  grandTotal: number;
  status: 'pending_approval' | 'approved' | 'rejected';
  rejectionComment?: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  requestId: number;
  amount: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

export interface InvoiceLineItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: number;
  requestId: number;
  customerName: string;
  amount: number;
  method: 'cash' | 'card' | 'wallet' | 'bank_transfer';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: string;
}

export interface ServiceType {
  id: number;
  name: string;
  nameEn: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  commissionRate?: number;
  createdAt: string;
  category?: string;
}

export interface StatusTimeline {
  status: RequestStatus;
  label: string;
  timestamp: string;
  note?: string;
}

export interface ChatMessage {
  id: number;
  requestId: number;
  senderId: number;
  senderName: string;
  senderRole: 'customer' | 'workshop' | 'driver' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface Stats {
  totalCustomers: number;
  totalWorkshops: number;
  totalDrivers: number;
  totalRequests: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingPayments: number;
  completedPayments: number;
  pendingPaymentsTotal: number;
  completedPaymentsTotal: number;
  refundedPaymentsTotal: number;
  requestsByStatus: { status: string; count: number }[];
  requestsPerDay: { date: string; count: number }[];
  topWorkshops: { id: number; name: string; requestsCount: number; revenue: number }[];
  recentRequests: MaintenanceRequest[];
  monthlyRevenue: { month: string; revenue: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  role?: string;
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  email?: string;
  specialty: string;
  workshopId: number;
  workshopName: string;
  isActive: boolean;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialDashboard {
  summary: {
    totalRevenue: number;
    totalCommission: number;
    totalNetToWorkshops: number;
    totalPendingSettlement: number;
    revenueChange: number;
    commissionChange: number;
    pendingChange: number;
  };
  monthlyRevenue: {
    month: string;
    gross: number;
    commission: number;
    net: number;
    tax: number;
  }[];
  workshopPerformance: {
    workshopId: number;
    workshopName: string;
    invoiceCount: number;
    totalGross: number;
    totalCommission: number;
    averageCommissionRate: number;
    totalNet: number;
    settlementStatus: string;
  }[];
  recentTransactions: {
    id: number;
    type: string;
    description: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

export interface WorkshopSettlement {
  id: number;
  workshopId: number;
  workshopName: string;
  settlementNumber: string;
  totalGrossAmount: number;
  totalCommission: number;
  totalNetAmount: number;
  invoiceCount: number;
  status: string;
  notes?: string;
  settledAt?: string;
  journalEntryId?: number;
  createdAt: string;
  invoices?: InvoiceDTO[];
}

export interface InvoiceDTO {
  id: number;
  requestId: number;
  customerId: number;
  customerName: string;
  workshopId: number;
  workshopName: string;
  invoiceNumber: string;
  partsTotal: number;
  laborTotal: number;
  totalAmount: number;
  tax: number;
  grandTotal: number;
  status: string;
  paymentMethod?: string;
  paymentId?: string;
  paidAt?: string;
  commissionPercentage?: number;
  commissionAmount?: number;
  netAmount?: number;
  settlementId?: number;
  settledAt?: string;
  createdAt: string;
  items: InvoiceItemDTO[];
}

export interface InvoiceItemDTO {
  id: number;
  invoiceId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  nameEn?: string;
  type: string;
  parentId?: number;
  parentName?: string;
  level: number;
  isSystem: boolean;
  balance: number;
  isActive: boolean;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  referenceType?: string;
  referenceId?: number;
  status: string;
  createdAt: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: number;
  entryId: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface PlatformSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  description?: string;
}

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
