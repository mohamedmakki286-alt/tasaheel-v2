import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Wrench, MapPin, Phone, User, Car, Clock, CheckCircle2,
  Navigation, Play, XCircle, RefreshCw, Search, Filter, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getHomeServiceAssignments, assignTechnician, updateAssignmentStatus } from '../api/homeService.api';
import { getTechnicians } from '../api/technicians.api';
import type { HomeServiceAssignment, HomeServiceStatus } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/formatters';

const STATUS_FLOW: HomeServiceStatus[] = ['pending_assignment', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed'];

const STATUS_CONFIG: Record<HomeServiceStatus, { icon: any; color: string; next?: HomeServiceStatus }> = {
  pending_assignment: { icon: Clock, color: 'text-accent-500 bg-accent-50 border-accent-200', next: 'assigned' },
  assigned: { icon: User, color: 'text-blue-500 bg-blue-50 border-blue-200', next: 'en_route' },
  en_route: { icon: Navigation, color: 'text-purple-500 bg-purple-50 border-purple-200', next: 'arrived' },
  arrived: { icon: MapPin, color: 'text-indigo-500 bg-indigo-50 border-indigo-200', next: 'in_progress' },
  in_progress: { icon: Wrench, color: 'text-orange-500 bg-orange-50 border-orange-200', next: 'completed' },
  completed: { icon: CheckCircle2, color: 'text-success-500 bg-success-50 border-success-200' },
  cancelled: { icon: XCircle, color: 'text-danger-500 bg-danger-50 border-danger-200' },
};

function StatusBadge({ status }: { status: HomeServiceStatus }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-medium ${config.color}`}>
      <Icon size={14} />
      {t('constants.homeServiceStatuses.' + status)}
    </span>
  );
}

function StatusTimeline({ status }: { status: HomeServiceStatus }) {
  const currentIdx = STATUS_FLOW.indexOf(status);
  if (currentIdx === -1) return null;

  return (
    <div className="flex items-center gap-1 py-2">
      {STATUS_FLOW.map((s, idx) => {
        const Icon = STATUS_CONFIG[s].icon;
        const done = idx <= currentIdx;
        return (
          <div key={s} className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              done ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-300'
            }`}>
              <Icon size={14} />
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div className={`w-8 h-0.5 ${idx < currentIdx ? 'bg-primary-500' : 'bg-surface-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HomeServicePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<HomeServiceStatus | 'all'>('all');
  const [showFilter, setShowFilter] = useState(false);

  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['home-service'],
    queryFn: () => getHomeServiceAssignments(),
    refetchInterval: 30000,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => getTechnicians(),
  });

  const assignMutation = useMutation({
    mutationFn: ({ assignmentId, technicianId }: { assignmentId: number; technicianId: number }) =>
      assignTechnician(assignmentId, technicianId),
    onSuccess: () => {
      toast.success(t('toast.success.technicianAssigned'));
      queryClient.invalidateQueries({ queryKey: ['home-service'] });
    },
    onError: () => toast.error(t('toast.error.technicianAssignFailed')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ assignmentId, status }: { assignmentId: number; status: string }) =>
      updateAssignmentStatus(assignmentId, status),
    onSuccess: () => {
      toast.success(t('toast.success.homeStatusUpdated'));
      queryClient.invalidateQueries({ queryKey: ['home-service'] });
    },
    onError: () => toast.error(t('toast.error.homeStatusUpdateFailed')),
  });

  const filtered = assignments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.customerName.toLowerCase().includes(q) ||
        a.customerPhone.includes(q) ||
        a.carPlateNumber?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusCounts = assignments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const availableTechnicians = technicians.filter((t) => t.isActive);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-fade-in">
            <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-surface-100">{t('pages.homeService.title')}</h1>
          <p className="text-surface-500 text-sm mt-1">{t('pages.homeService.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-400 bg-surface-100 px-3 py-1.5 rounded-xl">
          <RefreshCw size={14} className="animate-spin-slow" />
          <span>{t('pages.homeService.autoRefresh')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            statusFilter === 'all' ? 'bg-surface-900 dark:bg-surface-100 text-white shadow-lg' : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300 dark:hover:border-surface-600'
          }`}
        >
          {t('pages.homeService.all')} ({assignments.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = statusCounts[key] || 0;
          if (count === 0 && key !== 'pending_assignment') return null;
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key as HomeServiceStatus)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === key ? 'bg-surface-900 dark:bg-surface-100 text-white shadow-lg' : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300 dark:hover:border-surface-600'
              }`}
            >
              <Icon size={14} />
              {t('constants.homeServiceStatuses.' + key)}
              <span className="text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="30%" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={search ? t('pages.homeService.noResults') : t('pages.homeService.noRequests')}
          description={search ? t('pages.homeService.noResultsDesc') : t('pages.homeService.noRequestsDesc')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((assignment, idx) => {
            const config = STATUS_CONFIG[assignment.status];
            const nextStatus = config?.next;
            const StatusIcon = config?.icon;

            return (
              <div
                key={assignment.id}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 hover:shadow-md transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${config?.color.split(' ')[1]}`}>
                          {StatusIcon && <StatusIcon size={22} className={config?.color.split(' ')[0]} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={assignment.status} />
                          </div>
                          <p className="text-xs text-surface-400 mt-1">{formatDate(assignment.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <User size={16} className="text-primary-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-surface-400">{t('pages.homeService.customer')}</p>
                          <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{assignment.customerName}</p>
                          <p className="text-xs text-surface-500" dir="ltr">{assignment.customerPhone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <Car size={16} className="text-primary-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-surface-400">{t('pages.homeService.car')}</p>
                          <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">
                            {assignment.carMake} {assignment.carModel}
                          </p>
                          <p className="text-xs text-surface-500">{assignment.carPlateNumber || '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <MapPin size={16} className="text-primary-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-surface-400">{t('pages.homeService.location')}</p>
                          <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{assignment.city}</p>
                          <p className="text-xs text-surface-500 truncate">{assignment.locationAddress || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {assignment.description && (
                      <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                        <p className="text-xs text-surface-400 mb-1">{t('pages.homeService.problemDesc')}</p>
                        <p className="text-sm text-surface-600">{assignment.description}</p>
                      </div>
                    )}

                    {assignment.technicianName && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-success-50 border border-success-200">
                        <Wrench size={16} className="text-success-600 shrink-0" />
                        <div>
                          <p className="text-xs text-success-500">{t('pages.homeService.assignedTechnician')}</p>
                          <p className="text-sm font-semibold text-success-700">{assignment.technicianName}</p>
                          {assignment.technicianSpecialty && (
                            <p className="text-xs text-success-500">{assignment.technicianSpecialty}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
                      <StatusTimeline status={assignment.status} />
                    )}
                  </div>

                  <div className="lg:w-56 space-y-2 lg:border-r lg:border-surface-200 dark:lg:border-surface-700 lg:pr-4">
                    {assignment.status === 'pending_assignment' && (
                      <>
                        <p className="text-xs font-semibold text-surface-500 mb-2">{t('pages.homeService.assignTechnician')}</p>
                        <select
                          className="input-field text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              assignMutation.mutate({ assignmentId: assignment.id, technicianId: Number(val) });
                            }
                          }}
                          disabled={assignMutation.isPending}
                        >
                          <option value="" disabled>{t('pages.homeService.selectTechnician')}</option>
                          {availableTechnicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} - {t.specialty}
                            </option>
                          ))}
                        </select>
                        {availableTechnicians.length === 0 && (
                          <p className="text-xs text-danger-500">{t('pages.homeService.noActiveTechnicians')}</p>
                        )}
                      </>
                    )}

                    {nextStatus && (() => {
                      const NextIcon = STATUS_CONFIG[nextStatus].icon;
                      return (
                        <button
                          onClick={() => statusMutation.mutate({ assignmentId: assignment.id, status: nextStatus })}
                          disabled={statusMutation.isPending}
                          className="btn-primary w-full text-sm"
                        >
                          <NextIcon size={16} />
                          {nextStatus === 'completed' ? t('pages.homeService.finishService') : `${t('pages.homeService.updateTo')} ${t('constants.homeServiceStatuses.' + nextStatus)}`}
                        </button>
                      );
                    })()}

                    {assignment.technicianPhone && (
                      <a
                        href={`tel:${assignment.technicianPhone}`}
                        className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
                      >
                        <Phone size={16} />
                        {t('pages.homeService.contactTechnician')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
