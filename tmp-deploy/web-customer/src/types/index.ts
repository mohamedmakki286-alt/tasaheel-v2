export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  avatar?: string;
  isActive: boolean;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  plateNumber?: string;
  mileage?: number;
  nextOilChangeDate?: string;
  nextOilChangeMileage?: number;
  nextAppointmentDate?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  category: string;
  estimatedDuration?: string;
}

export interface ServiceWorkshop {
  workshopId: number;
  workshopName: string;
  workshopAddress: string;
  workshopCity: string;
  workshopLat?: number;
  workshopLng?: number;
  workshopPhone: string;
  workshopRating: number;
  reviewCount: number;
  workingHours?: string;
  price: number;
  distanceKm?: number;
  averageResponseTimeMinutes?: number;
  completedJobs: number;
}

export interface WorkshopServiceItem {
  id: number;
  workshopId: number;
  workshopName: string;
  serviceTypeId: number;
  serviceTypeName: string;
  price: number;
}

export interface Workshop {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  services: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  rating: number;
  workshopType: string;
  isActive: boolean;
  isApproved: boolean;
  reviewCount?: number;
  workingHours?: string;
  completedJobs?: number;
  averageResponseTimeMinutes?: number;
  providesPickupDelivery?: boolean;
  whatsapp?: string;
  website?: string;
  tiktokUrl?: string;
  snapchatUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  features?: string;
  gallery?: GalleryMedia[];
}

export interface GalleryMedia {
  id: number;
  workshopId: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  displayOrder: number;
  isCover: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  workshopName?: string;
}

export interface RequestStatus {
  status: 'pending' | 'quoted' | 'offer_selected' | 'splitted' | 'accepted' | 'customer_approved' | 'in_progress' | 'inspection_report' | 'awaiting_payment' | 'completed' | 'verified' | 'paid' | 'cancelled';
}

export interface Request {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  carId: string;
  carMake?: string;
  carModel?: string;
  carYear?: number;
  carPlateNumber?: string;
  serviceTypeId?: string;
  serviceTypeName?: string;
  serviceTypeNameEn?: string;
  serviceTypeIds?: string[];
  description: string;
  locationLat: number;
  locationLng: number;
  locationAddress?: string;
  city: string;
  status: RequestStatus['status'];
  hasTransportRequest?: boolean;
  executionMethod?: string;
  createdAt: string;
  updatedAt: string;
  quotes?: Quote[];
  media?: Media[];
  inspectionReport?: InspectionReport;
  timeline?: RequestStatusHistory[];
  serviceItems?: ServiceItem[];
  subOrders?: SubOrder[];
  allowMultiWorkshop?: boolean;
}

export interface ServiceItem {
  id: number;
  requestId: number;
  serviceTypeId: number;
  serviceTypeName: string;
  workshopId?: number;
  workshopName?: string;
  status: string;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
}

export interface SubOrder {
  id: number;
  requestId: number;
  workshopId: number;
  workshopName: string;
  status: string;
  totalPrice?: number;
  items?: SubOrderItem[];
  createdAt: string;
}

export interface PaymentHold {
  id: number;
  requestId: number;
  amount: number;
  status: 'HELD' | 'RELEASED' | 'REFUNDED';
  heldAt: string;
  releasedAt?: string;
}

export interface SubOrderItem {
  id: number;
  subOrderId: number;
  serviceTypeId: number;
  serviceTypeName: string;
  quoteId?: number;
  status: string;
  itemPrice?: number;
}

export interface RequestStatusHistory {
  id: string;
  status: string;
  changedBy?: string;
  comment?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  requestId: string;
  workshopId: string;
  workshopName: string;
  serviceTypeId?: number;
  serviceTypeName?: string;
  price: number;
  notes?: string;
  estimatedDays?: number;
  warrantyMonths?: number;
  status: string;
  createdAt: string;
}

export interface InspectionReport {
  id: string;
  requestId: string;
  workshopId: string;
  workshopName: string;
  notes: string;
  totalParts: number;
  totalLabor: number;
  tax: number;
  grandTotal: number;
  overallCondition?: string;
  recommendations?: string;
  mileage?: number;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  parts: InspectionPartItem[];
  laborItems: InspectionLaborItem[];
  checklist: InspectionChecklistItem[];
}

export interface InspectionPartItem {
  id: string;
  reportId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InspectionLaborItem {
  id: string;
  reportId: string;
  description: string;
  hours: number;
  hourlyRate: number;
  total: number;
}

export interface InspectionChecklistItem {
  id: string;
  reportId: string;
  category: string;
  itemName: string;
  status: string;
  notes?: string;
  imageUrl?: string;
  sortOrder: number;
}

export interface Media {
  id: string;
  requestId: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

export interface Invoice {
  id: string;
  requestId: string;
  workshopId: string;
  workshopName?: string;
  invoiceNumber?: string;
  items: InvoiceItem[];
  partsTotal: number;
  laborTotal: number;
  totalAmount: number;
  tax?: number;
  taxAmount?: number;
  grandTotal: number;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  requestId: string;
  customerId: string;
  amount: number;
  fee?: number;
  total: number;
  currency: string;
  method: string;
  status: string;
  moyasarPaymentId?: string;
  paymentUrl?: string;
  createdAt: string;
}

export interface Review {
  id?: string;
  requestId: string;
  workshopId: string;
  workshopName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'workshop' | 'driver';
  content: string;
  type?: string;
  mediaUrl?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  requestId: string;
  customerId: string;
  customerName: string;
  workshopId?: string;
  workshopName?: string;
  driverId?: string;
  driverName?: string;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  createdAt: string;
}
