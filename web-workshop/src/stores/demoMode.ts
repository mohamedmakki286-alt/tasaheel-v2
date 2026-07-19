let isDemoMode = false;

export function setDemoMode(val: boolean) { isDemoMode = val; }
export function getDemoMode() { return isDemoMode; }

const mockWorkshop = {
  id: '2', name: 'ورشة التقنية', ownerName: 'خالد عبدالله', phone: '0502222222',
  address: 'شارع الملك فهد، جدة', city: 'جدة', workshopType: 'stationary' as const,
  services: ['engine', 'electric', 'ac'], rating: 4.7, reviewsCount: 45,
  completedJobs: 120, isApproved: true, createdAt: '2025-01-15T00:00:00',
};

const mockDashboardStats = {
  pendingRequests: 3, activeRequests: 5, completedThisMonth: 12, averageRating: 4.7,
};

const mockFinancialStats = {
  totalRevenue: 45600, totalInvoices: 38, paidCount: 30, pendingCount: 8, pendingAmount: 8200,
};

const mockRequests = [
  { id: '3001', customerId: '1', customerName: 'أحمد العميل', customerPhone: '0501234567', carId: '1', carMake: 'Toyota', carModel: 'Camry', carYear: 2023, carPlateNumber: 'أ ب ج 1234', serviceTypeName: 'صيانة محرك', description: 'صوت غريب من المحرك عند التسارع', locationAddress: 'شارع الملك فهد، الرياض', city: 'الرياض', status: 'pending' as const, createdAt: '2026-07-15T08:00:00', updatedAt: '2026-07-15T08:00:00', hasQuote: false, hasReport: false, hasInvoice: false },
  { id: '3002', customerId: '3', customerName: 'سارة أحمد', customerPhone: '0503333333', carId: '2', carMake: 'Honda', carModel: 'Civic', carYear: 2024, carPlateNumber: 'د هـ 5678', serviceTypeName: 'تغيير زيت', description: 'تغيير زيت وفلتر', locationAddress: 'شارع الأمير سلطان، جدة', city: 'جدة', status: 'quoted' as const, createdAt: '2026-07-14T10:00:00', updatedAt: '2026-07-14T14:00:00', hasQuote: true, hasReport: false, hasInvoice: false },
  { id: '3003', customerId: '4', customerName: 'محمد العلي', customerPhone: '0504444444', carId: '3', carMake: 'Ford', carModel: 'Explorer', carYear: 2022, carPlateNumber: 'ز ح 9012', serviceTypeName: 'سمكة ودهان', description: 'حادث بسيط - خدش في الباب', locationAddress: 'شارع التحلية، الرياض', city: 'الرياض', status: 'in_progress' as const, createdAt: '2026-07-13T09:00:00', updatedAt: '2026-07-15T11:00:00', hasQuote: true, hasReport: true, hasInvoice: false },
  { id: '3004', customerId: '5', customerName: 'فاطمة خالد', customerPhone: '0505555555', carId: '4', carMake: 'Nissan', carModel: 'Patrol', carYear: 2023, carPlateNumber: 'ق ك 3456', serviceTypeName: 'كهرباء', description: 'لمبة المحرك مضيئة', locationAddress: 'شارع الأمير سلطان، الدمام', city: 'الدمام', status: 'completed' as const, createdAt: '2026-07-10T08:00:00', updatedAt: '2026-07-12T16:00:00', hasQuote: true, hasReport: true, hasInvoice: true },
];

const mockQuotes = [
  { id: 'q1', requestId: '3001', workshopId: '2', workshopName: 'ورشة التقنية', price: 1500, notes: 'تشخيص شامل + إصلاح', status: 'pending' as const, createdAt: '2026-07-15T09:00:00' },
  { id: 'q2', requestId: '3002', workshopId: '2', workshopName: 'ورشة التقنية', price: 350, notes: 'تغيير زيت + فلتر', status: 'accepted' as const, createdAt: '2026-07-14T12:00:00' },
];

const mockReviews = [
  { id: 'rv1', customer: { id: '5', name: 'فاطمة خالد', phone: '0505555555' }, workshopId: '2', requestId: '3004', rating: 5, comment: 'خدمة ممتازة وسريعة، شكرا لكم', createdAt: '2026-07-12T17:00:00' },
  { id: 'rv2', customer: { id: '4', name: 'محمد العلي', phone: '0504444444' }, workshopId: '2', requestId: '3000', rating: 4, comment: 'عمل جيد، السعر معقول', createdAt: '2026-07-08T14:00:00' },
];

const mockTechnicians = [
  { id: 1, name: 'فهد الفني', phone: '0583333333', email: 'fahd@tech.com', specialty: 'سمكرة ودهان', workshopId: 2, workshopName: 'ورشة التقنية', isActive: true, isOnline: true, createdAt: '2025-06-01T00:00:00', updatedAt: '2026-07-15T08:00:00' },
  { id: 2, name: 'ناصر الفني', phone: '0584444444', email: 'nasir@tech.com', specialty: 'تكييف', workshopId: 2, workshopName: 'ورشة التقنية', isActive: true, isOnline: false, createdAt: '2025-06-01T00:00:00', updatedAt: '2026-07-15T08:00:00' },
];

const mockServices = [
  { id: 1, name: 'صيانة محرك', price: 1200 },
  { id: 2, name: 'تغيير زيت', price: 250 },
  { id: 3, name: 'سمكرة ودهان', price: 2000 },
  { id: 4, name: 'كهرباء سيارات', price: 500 },
  { id: 5, name: 'تكييف مركبات', price: 800 },
];

const mockInvoices = [
  { id: 'inv1', requestId: '3004', customerId: '5', customerName: 'فاطمة خالد', workshopId: '2', workshopName: 'ورشة التقنية', invoiceNumber: 'INV-2026-038', items: [{ name: 'pieces', quantity: 1, unitPrice: 300, total: 300 }, { name: 'labor', quantity: 2, unitPrice: 150, total: 300 }], partsTotal: 300, laborTotal: 300, grandTotal: 690, tax: 15, status: 'paid', createdAt: '2026-07-12T14:00:00', paidAt: '2026-07-12T15:00:00' },
];

export function setupWorkshopDemoInterceptor(axiosInstance: any) {
  axiosInstance.interceptors.request.use((config: any) => {
    if (!isDemoMode) return config;
    const url = config.url || '';
    if (url.includes('service-catalog') || url.includes('/categories')) return config;
    config.adapter = async () => {
      const url = config.url || '';
      const method = (config.method || 'get').toLowerCase();

      if (url.includes('auth/login')) return { data: { token: 'demo-token', refreshToken: 'demo-refresh', role: 'workshop', userId: '2', name: mockWorkshop.name, email: 'workshop@test.com', phone: mockWorkshop.phone, isActive: true, isApproved: true, workshopType: mockWorkshop.workshopType, services: mockWorkshop.services, address: mockWorkshop.address, city: mockWorkshop.city, ownerName: mockWorkshop.ownerName, rating: mockWorkshop.rating, createdAt: mockWorkshop.createdAt }, status: 200 };
      if (url.includes('auth/')) return { data: { success: true }, status: 200 };
      if (url.includes('workshops/me') || url.includes('workshops/profile')) return { data: mockWorkshop, status: 200 };
      if (url.includes('dashboard') || url.includes('workshops/dashboard')) return { data: mockDashboardStats, status: 200 };
      if (url.includes('financial') || url.includes('finance')) return { data: mockFinancialStats, status: 200 };
      if (url.includes('request')) return { data: method === 'post' ? { ...mockRequests[0], id: '3005', ...config.data } : mockRequests, status: method === 'post' ? 201 : 200 };
      if (url.includes('quote')) return { data: method === 'post' ? { ...mockQuotes[0], id: 'q3', ...config.data } : mockQuotes, status: method === 'post' ? 201 : 200 };
      if (url.includes('review')) return { data: mockReviews, status: 200 };
      if (url.includes('technician')) return { data: mockTechnicians, status: 200 };
      if (url.includes('home-service')) return { data: [], status: 200 };
      if (url.includes('service')) return { data: mockServices, status: 200 };
      if (url.includes('invoice')) return { data: mockInvoices, status: 200 };
      if (url.includes('notification')) return { data: [], status: 200 };
      if (url.includes('inspection')) return { data: {}, status: 200 };
      if (url.includes('chat')) return { data: {}, status: 200 };

      return { data: {}, status: 200 };
    };
    return config;
  });
}

export { mockWorkshop, mockDashboardStats, mockFinancialStats, mockRequests, mockQuotes, mockReviews, mockTechnicians, mockServices, mockInvoices };
