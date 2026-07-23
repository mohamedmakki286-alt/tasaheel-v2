import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench, CheckCircle2, MapPin, Phone, User, LogOut, Clock,
  Home, ClipboardList, UserCircle,
  Play, Package, Star,
  Settings, Car,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useTechnicianWebSocket } from '../hooks/useTechnicianWebSocket';
import { useCallStore } from '@shared/call/callStore';

const SPECIALTY_MAP: Record<string, string> = {
  PAINTER: 'فني سمكرة ودهان',
  MECHANIC: 'فني ميكانيكا',
  ELECTRICIAN: 'فني كهرباء',
  AC_TECHNICIAN: 'فني تكييف',
  TRANSMISSION_TECHNICIAN: 'فني قير',
  GENERAL_TECHNICIAN: 'فني شامل',
  BODYWORK: 'فني سمكرة',
  PAINTING: 'فني دهان',
  BRAKES: 'فني فرامل',
  ENGINE: 'فني محرك',
  SUSPENSION: 'فني تعليق',
  EXHAUST: 'فني عادم',
  BATTERY: 'فني بطارية',
  DIAGNOSTICS: 'فني فحص كمبيوتر',
};

function translateSpecialty(raw?: string): string {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (SPECIALTY_MAP[upper]) return SPECIALTY_MAP[upper];
  const found = Object.entries(SPECIALTY_MAP).find(([k]) =>
    upper.includes(k) || k.includes(upper)
  );
  return found ? found[1] : raw;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'قيد الانتظار', color: 'text-gray-700', bg: 'bg-gray-100' },
  quoted: { label: 'تم تقديم عرض', color: 'text-blue-700', bg: 'bg-blue-50' },
  accepted: { label: 'مقبول', color: 'text-green-700', bg: 'bg-green-50' },
  in_progress: { label: 'قيد التنفيذ', color: 'text-orange-700', bg: 'bg-orange-50' },
  awaiting_payment: { label: 'بانتظار الدفع', color: 'text-amber-700', bg: 'bg-amber-50' },
  completed: { label: 'مكتمل', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'ملغي', color: 'text-red-700', bg: 'bg-red-50' },
};

const TECHNICIAN_NEXT_ACTION: Record<string, { label: string; nextStatus: string }> = {
  accepted: { label: 'بدء العمل', nextStatus: 'in_progress' },
  customer_approved: { label: 'بدء العمل', nextStatus: 'in_progress' },
  in_progress: { label: 'إكمال العمل', nextStatus: 'awaiting_payment' },
};

interface TechnicianRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  carMake: string;
  carModel: string;
  carPlateNumber: string;
  carColor: string;
  serviceTypeName: string;
  description: string;
  locationLat: number;
  locationLng: number;
  locationAddress: string;
  city: string;
  status: string;
  technicianId: number | null;
  technicianName: string | null;
  createdAt: string;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
}

// ===== Stats Card =====
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-2.5`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-[#111827]">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ===== Request Card =====
function RequestCard({
  request,
  onNavigate,
}: {
  request: TechnicianRequest;
  onNavigate?: () => void;
}) {
  const statusInfo = STATUS_LABELS[request.status] || { label: request.status, color: 'text-gray-700', bg: 'bg-gray-100' };
  const requestCall = useCallStore((s) => s.requestCall);

  return (
    <div onClick={onNavigate} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 cursor-pointer active:scale-[0.98] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Wrench size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#111827] text-sm truncate">{request.serviceTypeName || 'خدمة صيانة'}</p>
            <p className="text-xs text-gray-500 truncate">{request.carMake} {request.carModel}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User size={13} className="shrink-0" />
          <span className="truncate">{request.customerName}</span>
          <button onClick={(e) => { e.stopPropagation(); requestCall(request.customerId, request.customerName, request.id); }} className="mr-auto text-[#E31B23] shrink-0 p-1 rounded-lg hover:bg-red-50 transition-colors">
            <Phone size={14} />
          </button>
        </div>
        {request.carPlateNumber && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Car size={13} className="shrink-0" />
            <span>لوحة: {request.carPlateNumber}</span>
          </div>
        )}
        {request.locationAddress && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{request.locationAddress}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={13} className="shrink-0" />
          <span>{timeAgo(request.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ===== Main Dashboard =====
function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming' | 'review' | 'completed'>('current');
  const [mobileNav, setMobileNav] = useState<'home' | 'account'>('home');
  const queryClient = useQueryClient();
  const technician = useAuthStore((s) => s.technician);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useTechnicianWebSocket();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['technician-requests'],
    queryFn: async () => {
      const response = await apiClient.get('/technician/requests');
      return (response.data || []) as TechnicianRequest[];
    },
    refetchInterval: 30000,
  });

  const { data: profile } = useQuery({
    queryKey: ['technician-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/technician/profile');
      return response.data;
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiClient.put('/technician/availability', { status });
      return response.data;
    },
    onSuccess: (data) => {
      const updateTechnician = useAuthStore.getState().updateTechnician;
      if (data?.availabilityStatus) {
        updateTechnician({ availabilityStatus: data.availabilityStatus });
      }
      toast.success('تم تحديث التوفر');
    },
    onError: () => toast.error('فشل تحديث التوفر'),
  });

  const hasInProgress = requests.some(r => r.status === 'in_progress');
  const effectiveAvailability = hasInProgress ? 'busy' : (technician?.availabilityStatus || 'available');

  const categorized = useMemo(() => {
    const current = requests.filter(r => ['accepted', 'customer_approved', 'in_progress'].includes(r.status));
    const upcoming = requests.filter(r => r.status === 'pending');
    const review = requests.filter(r => r.status === 'awaiting_payment');
    const completed = requests.filter(r => r.status === 'completed' || r.status === 'cancelled');
    return { current, upcoming, review, completed };
  }, [requests]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    return {
      todayCount: requests.filter(r => new Date(r.createdAt).toDateString() === today).length,
      inProgress: categorized.current.length,
      awaitingReview: categorized.review.length,
      completedMonth: categorized.completed.filter(r => {
        const d = new Date(r.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length,
    };
  }, [requests, categorized]);

  const currentRequest = categorized.current[0];

  const tabCounts = {
    current: categorized.current.length,
    upcoming: categorized.upcoming.length,
    review: categorized.review.length,
    completed: categorized.completed.length,
  };

  const displayList = activeTab === 'current' ? categorized.current
    : activeTab === 'upcoming' ? categorized.upcoming
    : activeTab === 'review' ? categorized.review
    : categorized.completed;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = technician?.name || 'الفني';
  const displaySpecialty = translateSpecialty(technician?.specialty || profile?.specialty);

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#E31B23]/10 flex items-center justify-center shrink-0">
              <span className="text-[#E31B23] font-bold text-sm">
                {displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-[#111827] text-sm truncate">مرحباً، {displayName}</h1>
              <p className="text-[11px] text-gray-500 truncate">{displaySpecialty}</p>
              {technician?.workshopName && (
                <p className="text-[10px] text-gray-400 truncate">{technician.workshopName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/technician/account')}
              className="p-2 rounded-lg text-gray-400 hover:text-[#111827] hover:bg-gray-100 transition-colors"
              title="حسابي"
            >
              <Settings size={20} />
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="تسجيل الخروج">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Availability */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                effectiveAvailability === 'available' ? 'bg-green-500' :
                effectiveAvailability === 'busy' ? 'bg-orange-500' : 'bg-gray-400'
              }`} />
              <div>
                <p className="text-sm font-semibold text-[#111827]">
                  {effectiveAvailability === 'available' ? 'متاح لاستقبال الطلبات' :
                   effectiveAvailability === 'busy' ? 'مشغول حالياً' : 'غير متاح'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {effectiveAvailability === 'available' ? 'يمكن للورشة إسناد طلبات جديدة إليك' :
                   effectiveAvailability === 'busy' ? 'أنت مشغول حالياً بتنفيذ طلب' :
                   'لن يتم إسناد طلبات جديدة إليك'}
                </p>
              </div>
            </div>
            {effectiveAvailability !== 'busy' && (
              <button
                onClick={() => {
                  const next = effectiveAvailability === 'available' ? 'offline' : 'available';
                  availabilityMutation.mutate(next);
                }}
                disabled={availabilityMutation.isPending}
                className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 shrink-0"
                style={{
                  backgroundColor: effectiveAvailability === 'available' ? '#22C55E' : '#D1D5DB',
                }}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all"
                  style={{
                    right: effectiveAvailability === 'available' ? '22px' : '2px',
                  }}
                />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading ? (
            <>
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 mb-2.5" />
                  <div className="h-7 bg-gray-200 rounded w-12 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard icon={ClipboardList} label="طلبات اليوم" value={stats.todayCount} color="bg-blue-50 text-blue-600" />
              <StatCard icon={Wrench} label="قيد التنفيذ" value={stats.inProgress} color="bg-orange-50 text-orange-600" />
              <StatCard icon={Star} label="بانتظار المراجعة" value={stats.awaitingReview} color="bg-purple-50 text-purple-600" />
              <StatCard icon={CheckCircle2} label="مكتملة هذا الشهر" value={stats.completedMonth} color="bg-emerald-50 text-emerald-600" />
            </>
          )}
        </div>

        {/* Current Request Hero */}
        {currentRequest && (
          <div className="bg-gradient-to-br from-[#E31B23] to-[#c9161e] rounded-2xl p-4 shadow-lg text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Wrench size={14} />
              </div>
              <p className="text-sm font-bold">الطلب الحالي</p>
              <span className="mr-auto px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-medium">
                #{currentRequest.id}
              </span>
            </div>
            <p className="font-bold text-lg mb-1">{currentRequest.serviceTypeName || 'خدمة صيانة'}</p>
            <p className="text-white/80 text-sm mb-3">{currentRequest.carMake} {currentRequest.carModel}</p>

            <div className="space-y-1.5 mb-4">
              {currentRequest.carPlateNumber && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Car size={13} />
                  <span>لوحة: {currentRequest.carPlateNumber}</span>
                </div>
              )}
              {currentRequest.locationAddress && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <MapPin size={13} />
                  <span className="truncate">{currentRequest.locationAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Clock size={13} />
                <span>{timeAgo(currentRequest.createdAt)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {TECHNICIAN_NEXT_ACTION[currentRequest.status] && (
                <button
                  onClick={() => navigate(`/technician/requests/${currentRequest.id}`)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-[#E31B23] text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {currentRequest.status === 'in_progress' ? <CheckCircle2 size={16} /> : <Play size={16} />}
                  {TECHNICIAN_NEXT_ACTION[currentRequest.status]?.label}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100/50">
          {([
            { key: 'current' as const, label: 'الحالية' },
            { key: 'upcoming' as const, label: 'القادمة' },
            { key: 'review' as const, label: 'بانتظار المراجعة' },
            { key: 'completed' as const, label: 'المكتملة' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#E31B23] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} {tabCounts[tab.key] > 0 && `(${tabCounts[tab.key]})`}
            </button>
          ))}
        </div>

        {/* Request List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100/50">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Package size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm mb-1">
              {effectiveAvailability === 'offline'
                ? 'حالتك غير متاحة حالياً'
                : 'لا توجد طلبات مسندة إليك حالياً'}
            </p>
            <p className="text-gray-400 text-xs">
              {effectiveAvailability === 'offline'
                ? 'غيّر حالتك إلى متاح لاستقبال طلبات جديدة'
                : 'سنرسل لك إشعاراً عند إسناد طلب جديد'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onNavigate={() => navigate(`/technician/requests/${request.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 lg:hidden">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setMobileNav('home')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              mobileNav === 'home' ? 'text-[#E31B23]' : 'text-gray-400'
            }`}
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">الرئيسية</span>
          </button>
          <button
            onClick={() => navigate('/technician/account')}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-400 transition-colors"
          >
            <UserCircle size={20} />
            <span className="text-[10px] font-medium">حسابي</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function TechnicianPage() {
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated || role !== 'technician') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Wrench size={28} className="text-[#E31B23]" />
          </div>
          <p className="text-gray-500 mb-4">يجب تسجيل الدخول كفني للوصول لهذه الصفحة</p>
          <a href="/login" className="px-6 py-2.5 rounded-xl bg-[#E31B23] text-white text-sm font-medium inline-block">
            تسجيل الدخول
          </a>
        </div>
      </div>
    );
  }

  return <TechnicianDashboard />;
}
