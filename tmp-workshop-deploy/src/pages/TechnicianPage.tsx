import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench, Clock, CheckCircle2, MapPin, Phone, User, LogOut,
  ChevronRight, Navigation, Play, Package, CircleDot
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  assigned: { label: 'تم التعيين', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'مقبول', color: 'bg-green-100 text-green-700' },
  en_route: { label: 'في الطريق', color: 'bg-amber-100 text-amber-700' },
  arrived: { label: 'وصل', color: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700' },
};

const NEXT_STATUS: Record<string, string> = {
  assigned: 'accepted',
  accepted: 'en_route',
  en_route: 'arrived',
  arrived: 'in_progress',
  in_progress: 'completed',
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  assigned: 'قبول الطلب',
  accepted: 'في الطريق',
  en_route: 'وصلت',
  arrived: 'بدء العمل',
  in_progress: 'إكمال',
};

interface Assignment {
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
  status: string;
  assignedAt: string | null;
  enRouteAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

function TechnicianDashboard() {
  const { t } = { t: (key: string) => key };
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const queryClient = useQueryClient();
  const technician = useAuthStore((s) => s.technician);
  const logout = useAuthStore((s) => s.logout);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['technician-assignments'],
    queryFn: async () => {
      const response = await apiClient.get('/technician/requests');
      return (response.data || []) as Assignment[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: number; status: string }) => {
      const response = await apiClient.put(`/technician/requests/${assignmentId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم تحديث الحالة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['technician-assignments'] });
    },
    onError: () => toast.error('فشل تحديث الحالة'),
  });

  const availabilityMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiClient.put('/technician/availability', { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('تم تحديث التوفر');
    },
    onError: () => toast.error('فشل تحديث التوفر'),
  });

  const activeAssignments = assignments.filter((a) => a.status !== 'completed');
  const completedAssignments = assignments.filter((a) => a.status === 'completed');
  const displayList = activeTab === 'active' ? activeAssignments : completedAssignments;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E31B23]/10 flex items-center justify-center">
              <Wrench size={20} className="text-[#E31B23]" />
            </div>
            <div>
              <h1 className="font-bold text-[#111827]">{technician?.name || 'الفني'}</h1>
              <p className="text-xs text-gray-500">{technician?.specialty || ''}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">حالة التوفر</span>
            <div className="flex gap-2">
              {[
                { key: 'available', label: 'متاح', color: 'bg-emerald-500' },
                { key: 'busy', label: 'مشغول', color: 'bg-amber-500' },
                { key: 'offline', label: 'غير متاح', color: 'bg-gray-400' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => availabilityMutation.mutate(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    technician?.availabilityStatus === s.key
                      ? `${s.color} text-white shadow-sm`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-[#111827]">{activeAssignments.length}</p>
            <p className="text-xs text-gray-500 mt-1">طلبات نشطة</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedAssignments.length}</p>
            <p className="text-xs text-gray-500 mt-1">طلبات مكتملة</p>
          </div>
        </div>

        <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm">
          {(['active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[#E31B23] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'active' ? `نشطة (${activeAssignments.length})` : `مكتملة (${completedAssignments.length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {activeTab === 'active' ? 'لا توجد طبات نشطة' : 'لا توجد طبات مكتملة'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((assignment) => {
              const nextStatus = NEXT_STATUS[assignment.status];
              const statusInfo = STATUS_LABELS[assignment.status] || { label: assignment.status, color: 'bg-gray-100 text-gray-700' };
              return (
                <div key={assignment.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Wrench size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#111827] text-sm">{assignment.serviceTypeName || 'خدمة صيانة'}</p>
                        <p className="text-xs text-gray-500">{assignment.carMake} {assignment.carModel}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={14} />
                      <span>{assignment.customerName}</span>
                      <a href={`tel:${assignment.customerPhone}`} className="mr-auto text-[#E31B23]">
                        <Phone size={14} />
                      </a>
                    </div>
                    {assignment.locationAddress && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={14} />
                        <span className="truncate">{assignment.locationAddress}</span>
                      </div>
                    )}
                  </div>

                  {nextStatus && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ assignmentId: assignment.id, status: nextStatus })}
                      disabled={updateStatusMutation.isPending}
                      className="w-full py-2.5 rounded-xl bg-[#E31B23] text-white text-sm font-medium hover:bg-[#c9161e] transition-colors flex items-center justify-center gap-2"
                    >
                      {nextStatus === 'accepted' && <CheckCircle2 size={16} />}
                      {nextStatus === 'en_route' && <Navigation size={16} />}
                      {nextStatus === 'arrived' && <MapPin size={16} />}
                      {nextStatus === 'in_progress' && <Play size={16} />}
                      {nextStatus === 'completed' && <CheckCircle2 size={16} />}
                      {NEXT_STATUS_LABEL[assignment.status]}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
          <a href="/login" className="px-6 py-2.5 rounded-xl bg-[#E31B23] text-white text-sm font-medium">
            تسجيل الدخول
          </a>
        </div>
      </div>
    );
  }

  return <TechnicianDashboard />;
}
