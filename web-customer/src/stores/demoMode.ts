import { SERVICE_CATEGORIES } from '../constants/serviceCategories';

let isDemoMode = false;

export function setDemoMode(val: boolean) { isDemoMode = val; }
export function getDemoMode() { return isDemoMode; }

const mockCustomer = {
  id: '1', name: 'أحمد العميل', phone: '0501234567',
  email: 'ahmed@demo.com', city: 'الرياض', isActive: true,
};

const mockCars = [
  { id: '1', make: 'Toyota', model: 'Camry', year: 2023, color: 'أبيض', plateNumber: 'أ ب ج 1234', mileage: 150000, nextOilChangeMileage: 155000 },
  { id: '2', make: 'Hyundai', model: 'Tucson', year: 2022, color: 'أسود', plateNumber: 'د هـ 5678' },
];

const mockWorkshops = [
  { id: 1, name: 'ورشة التقنية', phone: '0502222222', address: 'شارع الملك فهد', city: 'جدة', services: 'صيانة,تشخيص', rating: 4.7, workshopType: 'stationary', isActive: true, isApproved: true, reviewCount: 45, completedJobs: 120 },
  { id: 2, name: 'ورشة الإتقان', phone: '0505555555', address: 'شارع الأمير سلطان', city: 'المدينة المنورة', services: 'كهرباء,تكييف', rating: 4.9, workshopType: 'stationary', isActive: true, isApproved: true, reviewCount: 80, completedJobs: 200 },
  { id: 3, name: 'ورشة الصيانة السريعة', phone: '0504444444', address: 'شارع المسجد الحرام', city: 'مكة', services: 'سمكرة,دهان', rating: 4.5, workshopType: 'mobile', isActive: true, isApproved: true, reviewCount: 30, completedJobs: 85 },
];

const mockRequests = [
  { id: '1001', customerId: '1', customerName: 'أحمد العميل', carId: '1', carMake: 'Toyota', carModel: 'Camry', description: 'صوت غريب من المحرك', locationLat: 24.7136, locationLng: 46.6753, city: 'الرياض', status: 'in_progress', createdAt: '2026-07-14T10:00:00', updatedAt: '2026-07-14T15:30:00', hasQuote: true },
  { id: '1002', customerId: '1', customerName: 'أحمد العميل', carId: '2', carMake: 'Hyundai', carModel: 'Tucson', description: 'تغيير زيت وفلتر', locationLat: 24.7136, locationLng: 46.6753, city: 'الرياض', status: 'quoted', createdAt: '2026-07-13T09:00:00', updatedAt: '2026-07-13T14:00:00', hasQuote: true },
  { id: '1003', customerId: '1', customerName: 'أحمد العميل', carId: '1', carMake: 'Toyota', carModel: 'Camry', description: 'صيانة دورية', locationLat: 24.7136, locationLng: 46.6753, city: 'الرياض', status: 'completed', createdAt: '2026-07-10T08:00:00', updatedAt: '2026-07-12T16:00:00', hasQuote: true },
  { id: '1004', customerId: '1', customerName: 'أحمد العميل', carId: '2', carMake: 'Hyundai', carModel: 'Tucson', description: 'إصلاح كهرباء السيارة', locationLat: 24.7136, locationLng: 46.6753, city: 'الرياض', status: 'pending', createdAt: '2026-07-15T08:00:00', updatedAt: '2026-07-15T08:00:00', hasQuote: false },
];

const mockQuotes = [
  { id: '2001', requestId: '1001', workshopId: '1', workshopName: 'ورشة التقنية', price: 850, notes: 'تم اختيار الورشة، والطلب جارٍ تنفيذه.', estimatedDays: 1, warrantyMonths: 3, status: 'accepted', createdAt: '2026-07-14T12:00:00' },
  { id: '2002', requestId: '1002', workshopId: '1', workshopName: 'ورشة التقنية', price: 720, notes: 'تغيير زيت فقط', estimatedDays: 1, warrantyMonths: 1, status: 'pending', createdAt: '2026-07-13T13:00:00' },
];

const mockInvoices = [
  { id: '3001', requestId: '1003', workshopId: '1', workshopName: 'ورشة التقنية', invoiceNumber: 'INV-2026-001', items: [{ id: 'i1', name: 'زيت محرك', quantity: 1, unitPrice: 200, total: 200 }, { id: 'i2', name: 'فلتر زيت', quantity: 1, unitPrice: 80, total: 80 }, { id: 'i3', name: 'عمالة', quantity: 2, unitPrice: 150, total: 300 }], partsTotal: 280, laborTotal: 300, totalAmount: 580, tax: 15, taxAmount: 87, grandTotal: 667, status: 'paid', createdAt: '2026-07-12T14:00:00', paidAt: '2026-07-12T15:00:00' },
];

const mockOffers = [
  { id: 1, workshopId: 1, workshopName: 'ورشة التقنية', workshopRating: 4.7, workshopCity: 'الرياض', title: 'خصم 30% على الصيانة الدورية', description: 'زيت وفلتر وفحص نقاط السلامة', type: 'package', serviceNames: 'تغيير زيت + فلتر + فحص', originalPrice: 450, offerPrice: 315, discountPercent: 30 },
  { id: 2, workshopId: 2, workshopName: 'ورشة الإتقان', workshopRating: 4.9, workshopCity: 'الرياض', title: 'باقة التكييف الصيفية', description: 'فحص وشحن فريون مع خصم خاص', type: 'package', serviceNames: 'فحص تكييف + شحن فريون', originalPrice: 300, offerPrice: 219, discountPercent: 27 },
  { id: 3, workshopId: 3, workshopName: 'ورشة الصيانة السريعة', workshopRating: 4.5, workshopCity: 'الرياض', title: 'خدمة بطارية متنقلة', description: 'وصول إلى موقعك خلال 30 دقيقة', type: 'offer', serviceNames: 'فحص وشحن بطارية', originalPrice: 140, offerPrice: 99, discountPercent: 29 },
];

const mockServices = [
  { id: 1, name: 'تغيير زيت', nameEn: 'Oil Change', icon: '🔧', isActive: true, category: 'صيانة' },
  { id: 2, name: 'تشخيص حاسوب', nameEn: 'Diagnostic', icon: '💻', isActive: true, category: 'تشخيص' },
  { id: 3, name: 'سمكرة ودهان', nameEn: 'Body Paint', icon: '🎨', isActive: true, category: 'إصلاح' },
  { id: 4, name: 'كهرباء سيارات', nameEn: 'Electrical', icon: '⚡', isActive: true, category: 'كهرباء' },
  { id: 5, name: 'تكييف مركبات', nameEn: 'AC Repair', icon: '❄️', isActive: true, category: 'تكييف' },
  { id: 6, name: 'صيانة دورية', nameEn: 'Periodic Maintenance', icon: '🔄', isActive: true, category: 'صيانة' },
];

const legacyMockCatalog = [
  { categoryId: 1, categoryName: 'الصيانة الدورية', categoryNameEn: 'periodic', categoryIcon: 'Wrench', templates: [{ id: 1, name: 'تغيير زيت المحرك', categoryId: 1, defaultDuration: '30 دقيقة', description: 'تغيير زيت وفلتر' }, { id: 2, name: 'فحص دوري شامل', categoryId: 1, defaultDuration: '45 دقيقة', description: 'فحص السيارة' }] },
  { categoryId: 2, categoryName: 'الميكانيكا', categoryNameEn: 'mechanical', categoryIcon: 'Settings', templates: [{ id: 11, name: 'إصلاح المحرك', categoryId: 2, defaultDuration: 'يومان', description: 'فحص وإصلاح ميكانيكي' }, { id: 12, name: 'إصلاح الفرامل', categoryId: 2, defaultDuration: 'ساعتان', description: 'صيانة نظام الفرامل' }] },
  { categoryId: 3, categoryName: 'كهرباء السيارات', categoryNameEn: 'electrical', categoryIcon: 'Zap', templates: [{ id: 21, name: 'فحص كهرباء السيارة', categoryId: 3, defaultDuration: '45 دقيقة', description: 'بطارية ودينمو وحساسات' }, { id: 22, name: 'تغيير بطارية', categoryId: 3, defaultDuration: '20 دقيقة', description: 'استبدال البطارية' }] },
  { categoryId: 4, categoryName: 'التكييف والتبريد', categoryNameEn: 'ac', categoryIcon: 'Snowflake', templates: [{ id: 31, name: 'فحص تكييف', categoryId: 4, defaultDuration: '30 دقيقة', description: 'فحص دورة التبريد' }, { id: 32, name: 'شحن فريون', categoryId: 4, defaultDuration: '45 دقيقة', description: 'شحن وتعبئة الفريون' }] },
  { categoryId: 5, categoryName: 'الإطارات', categoryNameEn: 'tires', categoryIcon: 'CircleDot', templates: [{ id: 41, name: 'تغيير إطارات', categoryId: 5, defaultDuration: '30 دقيقة', description: 'تغيير وتركيب الإطارات' }, { id: 42, name: 'ترصيص وضبط زوايا', categoryId: 5, defaultDuration: '45 دقيقة', description: 'اتزان الإطارات' }] },
  { categoryId: 6, categoryName: 'السمكرة والدهان', categoryNameEn: 'bodywork', categoryIcon: 'Paintbrush', templates: [{ id: 51, name: 'إصلاح صدمات', categoryId: 6, defaultDuration: 'يوم', description: 'سمكرة وإصلاح الهيكل' }, { id: 52, name: 'دهان وتلميع', categoryId: 6, defaultDuration: 'يومان', description: 'دهان احترافي للسيارة' }] },
  { categoryId: 7, categoryName: 'غسيل وعناية', categoryNameEn: 'wash', categoryIcon: 'Sparkles', templates: [{ id: 61, name: 'غسيل داخلي', categoryId: 7, defaultDuration: '30 دقيقة', description: 'تنظيف المقصورة' }, { id: 62, name: 'غسيل داخلي وخارجي', categoryId: 7, defaultDuration: '60 دقيقة', description: 'تنظيف كامل للسيارة' }] },
  { categoryId: 8, categoryName: 'الطوارئ والمساعدة', categoryNameEn: 'emergency', categoryIcon: 'Siren', templates: [{ id: 71, name: 'سطحة وسحب سيارة', categoryId: 8, defaultDuration: 'حسب الموقع', description: 'مساعدة على الطريق' }, { id: 72, name: 'شحن بطارية طوارئ', categoryId: 8, defaultDuration: '30 دقيقة', description: 'خدمة متنقلة' }] },
];

const mockCatalog = SERVICE_CATEGORIES.map((category, categoryIndex) => ({
  categoryId: categoryIndex + 1,
  categoryName: category.label,
  categoryNameEn: category.key,
  categoryIcon: category.icon,
  templates: category.services.map((service, serviceIndex) => ({
    id: Number(service.id) || ((categoryIndex + 1) * 1000) + serviceIndex + 1,
    name: service.name,
    categoryId: categoryIndex + 1,
    defaultDuration: service.duration || '',
    description: service.group || category.desc,
  })),
}));

const mockReviews = [
  { id: 'r1', requestId: '1003', workshopId: '1', workshopName: 'ورشة التقنية', rating: 5, comment: 'خدمة ممتازة وسريعة، أنصح بالتعامل معهم', createdAt: '2026-07-12T17:00:00' },
];

export function setupCustomerDemoInterceptor(axiosInstance: any) {
  axiosInstance.interceptors.request.use((config: any) => {
    if (!isDemoMode) return config;
    config.adapter = async () => {
      const url = config.url || '';
      const method = (config.method || 'get').toLowerCase();

      if (url.includes('/auth/')) return { data: { token: 'demo-token', refreshToken: 'demo-refresh', role: 'customer', userId: '1', ...mockCustomer, isActive: true }, status: 200 };
      if (url.includes('/customers/me') || url.includes('/customers/profile')) return { data: mockCustomer, status: 200 };
      if (url === '/chat/room' && method === 'post') return { data: { id: 'demo-room', requestId: 1001, customerId: 1, customerName: mockCustomer.name, workshopId: 1, workshopName: 'ورشة التقنية', createdAt: '2026-07-14T12:00:00' }, status: 200 };
      if (/\/chat\/room\/[^/]+\/messages$/.test(url) && method === 'get') return { data: [], status: 200 };
      if (/\/chat\/room\/[^/]+\/messages$/.test(url) && method === 'post') return { data: { id: `message-${Date.now()}`, roomId: 'demo-room', senderId: 1, senderName: mockCustomer.name, senderRole: 'customer', content: typeof config.data === 'string' ? JSON.parse(config.data).content : config.data?.content, createdAt: new Date().toISOString() }, status: 201 };
      if (/\/chat\/room\/[^/]+\/read$/.test(url)) return { data: {}, status: 200 };
      if (/\/customers\/cars\/[^/]+\/history$/.test(url)) {
        const carId = url.match(/\/customers\/cars\/([^/]+)\/history/)?.[1];
        const records = mockRequests
          .filter((request) => request.carId === String(carId) && request.status === 'completed')
          .map((request) => ({ requestId: Number(request.id), status: request.status, serviceTypeName: 'صيانة دورية', workshopName: 'ورشة التقنية', grandTotal: 667, invoiceStatus: 'paid', reportStatus: 'approved', createdAt: request.createdAt }));
        return { data: records, status: 200 };
      }
      if (url.includes('/customers/cars')) {
        const carId = url.match(/\/customers\/cars\/([^/?]+)/)?.[1];
        const car = carId ? mockCars.find((item) => item.id === carId) : null;
        if (method === 'get') return { data: car || mockCars, status: 200 };
        return { data: { ...(car || mockCars[0]), ...config.data }, status: 200 };
      }
      if (url === '/service-catalog') return { data: mockCatalog, status: 200 };
      if (url.includes('/service-catalog/templates/')) {
        const templateId = Number(url.match(/templates\/(\d+)/)?.[1]);
        const template = mockCatalog.flatMap((category) => category.templates).find((item) => item.id === templateId) || mockCatalog[0].templates[0];
        if (url.endsWith('/workshops')) return { data: mockWorkshops.map((workshop) => ({ workshopId: workshop.id, workshopName: workshop.name, listingId: template.id, price: 250, priceType: 'fixed', workshopRating: workshop.rating, workshopCity: workshop.city })), status: 200 };
        return { data: template, status: 200 };
      }
      if (url.includes('/workshops') && !url.includes('/workshops/')) return { data: mockWorkshops, status: 200 };
      if (url.includes('/workshops/')) return { data: mockWorkshops[0], status: 200 };
      if (url === '/offers') return { data: mockOffers, status: 200 };
      if (url.includes('/requests/drafts') && method === 'get') return { data: [], status: 200 };
      if (/\/requests\/[^/]+\/quotes\/[^/]+\/accept$/.test(url) && method === 'post') {
        const [, requestId, quoteId] = url.match(/\/requests\/([^/]+)\/quotes\/([^/]+)\/accept$/) || [];
        const quote = mockQuotes.find((item) => item.id === quoteId && item.requestId === requestId);
        const request = mockRequests.find((item) => item.id === requestId);
        if (!quote || !request) return { data: {}, status: 404 };
        mockQuotes.forEach((item) => { if (item.requestId === requestId) item.status = item.id === quoteId ? 'accepted' : 'declined'; });
        request.status = 'accepted';
        request.updatedAt = new Date().toISOString();
        return { data: { ...request, quotes: mockQuotes.filter((item) => item.requestId === requestId) }, status: 200 };
      }
      if (/\/requests\/[^/]+\/quotes$/.test(url) && method === 'get') {
        const requestId = url.match(/\/requests\/([^/]+)\/quotes$/)?.[1];
        return { data: mockQuotes.filter((quote) => quote.requestId === requestId), status: 200 };
      }
      if (/\/requests\/[^/]+$/.test(url) && method === 'get') {
        const requestId = url.split('/').pop();
        const request = mockRequests.find((item) => item.id === requestId) || mockRequests[0];
        const quotes = mockQuotes.filter((quote) => quote.requestId === request.id);
        return { data: { ...request, quotes }, status: 200 };
      }
      if (url.includes('/requests') && method === 'get') return { data: mockRequests, status: 200 };
      if (url.includes('/requests') && method === 'post') return { data: { id: '1005', ...config.data, status: 'pending' }, status: 201 };
      if (url.includes('/quotes')) return { data: mockQuotes, status: 200 };
      if (/\/invoices\/[^/]+$/.test(url)) {
        const requestId = url.split('/').pop();
        return { data: mockInvoices.find((invoice) => invoice.requestId === requestId) || null, status: 200 };
      }
      if (url.includes('/invoices/customer')) return { data: { content: mockInvoices, totalElements: mockInvoices.length }, status: 200 };
      if (url.includes('/invoices')) return { data: mockInvoices, status: 200 };
      if (url.includes('/services')) return { data: mockServices, status: 200 };
      if (url.includes('/reviews')) return { data: mockReviews, status: 200 };
      if (url.includes('/reports')) return { data: { totalRequests: 4, completedRequests: 1, totalSpent: 667, averageRating: 5 }, status: 200 };
      if (url.includes('/notifications')) return { data: [], status: 200 };

      return { data: {}, status: 200 };
    };
    return config;
  });
}

export { mockCustomer, mockCars, mockWorkshops, mockRequests, mockQuotes, mockInvoices, mockServices, mockReviews };
