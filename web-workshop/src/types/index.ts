export type WorkshopType = 'stationary' | 'mobile' | 'both';

export interface Workshop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  workshopType: WorkshopType;
  services: string[];
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  commercialRegistration?: string;
  municipalityLicense?: string;
  rejectionReason?: string;
  isApproved?: boolean;
  rating: number;
  reviewsCount: number;
  completedJobs: number;
  createdAt: string;
  workingHours?: string;
  whatsapp?: string;
  website?: string;
  tiktokUrl?: string;
  snapchatUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  features?: string;
  latitude?: number;
  longitude?: number;
  gallery?: GalleryItem[];
}

export interface GalleryItem {
  id: number;
  workshopId: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  displayOrder: number;
  isCover: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber?: string;
  color?: string;
  mileage?: number;
}

export type RequestStatus = 'pending' | 'quoted' | 'accepted' | 'in_progress' | 'awaiting_payment' | 'completed' | 'cancelled';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface ServiceTypeInfo {
  id: number;
  name: string;
}

export interface ServiceRequest {
  id: string;
  customer: Customer;
  /** Present in some API request summaries; full requests expose customer.name. */
  customerName?: string;
  car: Car;
  service: string;
  description: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  city: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  hasQuote: boolean;
  hasReport: boolean;
  hasInvoice: boolean;
  serviceTypeIds?: number[];
  serviceTypes?: ServiceTypeInfo[];
  technicianId?: number;
  technicianName?: string;
  technicianPhone?: string;
  technicianSpecialty?: string;
}

export interface Quote {
  id: string;
  requestId: string;
  workshopId: string;
  workshopName?: string;
  workshopLogo?: string | null;
  serviceTypeId?: number | null;
  serviceTypeName?: string | null;
  price: number;
  notes: string;
  status: QuoteStatus;
  estimatedDays?: number | null;
  warrantyMonths?: number | null;
  createdAt: string;
}

export interface InspectionReport {
  id: string;
  requestId: string;
  workshopId: string;
  notes: string;
  parts: InspectionPart[];
  labor: InspectionLabor[];
  taxPercent: number;
  grandTotal: number;
  priority: 'urgent' | 'important' | 'deferrable';
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  rejectionComment?: string;
  createdAt: string;
}

export interface InspectionPart {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InspectionLabor {
  description: string;
  minutes: number;
  hourlyRate: number;
  total: number;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  requestId: string;
  customerId?: string;
  customerName?: string;
  workshopId: string;
  workshopName?: string;
  invoiceNumber?: string;
  items: InvoiceItem[];
  partsTotal: number;
  laborTotal: number;
  totalAmount?: number;
  tax?: number;
  taxPercent?: number;
  taxAmount?: number;
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
}

export interface Review {
  id: string;
  customer: Customer;
  workshopId: string;
  requestId: string;
  rating: ReviewRating;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'workshop' | 'customer' | 'technician';
  content: string;
  type?: string;
  mediaUrl?: string;
  isRead?: boolean;
  createdAt: string;
  clientMessageId?: string;
  attachment?: {
    id: number;
    url: string;
    mimeType: string;
    fileSize: number;
    originalFileName: string;
    durationSeconds?: number;
    width?: number;
    height?: number;
  };
}

export interface ChatRoom {
  id: string;
  requestId: string;
  customerId?: string;
  customerName?: string;
  workshopId?: string;
  workshopName?: string;
  participants: string[];
  unreadCount?: number;
  lastMessage?: ChatMessage;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  workshop: Workshop;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  password: string;
  address: string;
  city: string;
  workshopType: WorkshopType;
  services: string[];
  commercialRegistration?: File;
  municipalityLicense?: File;
}

export interface UpdateProfilePayload {
  name?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  workshopType?: WorkshopType;
  services?: string[];
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  commercialRegistration?: string;
  municipalityLicense?: string;
  workingHours?: string;
  whatsapp?: string;
  website?: string;
  tiktokUrl?: string;
  snapchatUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  features?: string;
  latitude?: number;
  longitude?: number;
}

export interface SubmitQuotePayload {
  price: number;
  notes: string;
  serviceTypeId?: number | null;
}

export interface InspectionReportPayload {
  notes: string;
  parts: { name: string; quantity: number; unitPrice: number }[];
  labor: { description: string; minutes: number; hourlyRate: number }[];
  priority: 'urgent' | 'important' | 'deferrable';
  status?: 'draft' | 'pending_approval';
}

export interface InvoiceItemPayload {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoicePayload {
  items: InvoiceItemPayload[];
  taxPercent: number;
}

export interface StatusUpdatePayload {
  status: RequestStatus;
  notes?: string;
}

export interface DashboardStats {
  pendingRequests: number;
  activeRequests: number;
  completedThisMonth: number;
  averageRating: number;
  recentActivities?: Activity[];
}

export interface FinancialStats {
  totalRevenue: number;
  totalInvoices: number;
  paidCount: number;
  pendingCount: number;
  pendingAmount: number;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  workshopId: number;
  workshopName: string;
  isActive: boolean;
  isOnline: boolean;
  availabilityStatus?: string;
  profileImageUrl?: string;
  latitude?: number;
  longitude?: number;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianPayload {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  specialty: string;
  availabilityStatus?: string;
  profileImageUrl?: string;
}

export type HomeServiceStatus = 'pending_assignment' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

// ===== Financial Dashboard Types =====

export interface WorkshopFinancialDashboard {
  totalRevenue: number;
  totalPending: number;
  totalCommission: number;
  totalNet: number;
  totalSettled: number;
  pendingSettlement: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  rejectedCount: number;
  settledCount: number;
  monthlyRevenue: MonthlyRevenue[];
  recentTransactions: TransactionItem[];
}

export interface MonthlyRevenue {
  month: string;
  gross: number;
  commission: number;
  net: number;
  tax: number;
}

export interface TransactionItem {
  id: number;
  type: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface SettlementReport {
  workshopName: string;
  period: string;
  items: SettlementInvoice[];
  totalGross: number;
  totalCommission: number;
  totalNet: number;
}

export interface SettlementInvoice {
  invoiceNumber: string;
  customerName: string;
  grandTotal: number;
  commissionAmount: number;
  netAmount: number;
  paidAt: string;
}

export interface IncomeStatementLine {
  item: string;
  amount: number;
  type: string;
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
}

export interface HomeServiceAssignment {
  id: number;
  requestId: number;
  customerName: string;
  customerPhone: string;
  carMake: string;
  carModel: string;
  carPlateNumber: string;
  serviceTypeName: string;
  description: string;
  locationLat: number;
  locationLng: number;
  locationAddress: string;
  city: string;
  technicianId: number | null;
  technicianName: string | null;
  technicianPhone: string | null;
  technicianSpecialty: string | null;
  workshopId: number;
  workshopName: string;
  status: HomeServiceStatus;
  assignedAt: string | null;
  enRouteAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}
