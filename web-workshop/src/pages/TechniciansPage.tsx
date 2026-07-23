import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Pencil, Trash2, Wrench, MapPin, Phone, Mail, Search,
  X, CheckCircle2, AlertCircle, UserCheck, UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTechnicians, createTechnician, updateTechnician, deleteTechnician } from '../api/technicians.api';
import type { Technician, TechnicianPayload } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

interface TechnicianFormModalProps {
  technician?: Technician | null;
  onClose: () => void;
}

function TechnicianFormModal({ technician, onClose }: TechnicianFormModalProps) {
  const { t } = useTranslation();
  const SPECIALTIES = [
    { value: 'mechanic', label: t('constants.specialties.mechanic') },
    { value: 'electrician', label: t('constants.specialties.electrician') },
    { value: 'bodywork', label: t('constants.specialties.bodywork') },
    { value: 'painter', label: t('constants.specialties.painter') },
    { value: 'ac', label: t('constants.specialties.ac') },
    { value: 'tires', label: t('constants.specialties.tires') },
    { value: 'glass', label: t('constants.specialties.glass') },
    { value: 'battery', label: t('constants.specialties.battery') },
    { value: 'general', label: t('constants.specialties.general') },
  ];
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TechnicianPayload>({
    name: technician?.name || '',
    phone: technician?.phone || '',
    email: technician?.email || '',
    password: '',
    specialty: technician?.specialty || '',
  });

  const isEditing = !!technician;

  const mutation = useMutation({
    mutationFn: () =>
      isEditing
        ? updateTechnician(technician.id, form)
        : createTechnician(form),
    onSuccess: () => {
      toast.success(isEditing ? t('toast.success.technicianSaved') : t('toast.success.technicianAdded'));
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      onClose();
    },
    onError: () => toast.error(t('toast.error.technicianSaveFailed')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.specialty) {
      toast.error(t('toast.error.requiredFields'));
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              {isEditing ? <Pencil size={20} className="text-primary-600" /> : <Plus size={20} className="text-primary-600" />}
            </div>
            <h2 className="text-lg font-bold text-surface-900">{isEditing ? t('pages.technicians.editModal.title') : t('pages.technicians.editModal.addTitle')}</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">{t('pages.technicians.editModal.name')}</label>
            <input
              className="input-field"
              placeholder={t('pages.technicians.editModal.namePlaceholder')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">{t('pages.technicians.editModal.phone')}</label>
            <input
              className="input-field"
              placeholder="05xxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">{t('pages.technicians.editModal.email')}</label>
            <input
              className="input-field"
              type="email"
              placeholder={t('pages.technicians.editModal.emailPlaceholder')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {!isEditing && (
            <div>
              <label className="label">{t('pages.technicians.editModal.password')}</label>
              <input
                className="input-field"
                type="password"
                placeholder={t('pages.technicians.editModal.passwordPlaceholder')}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="label">{t('pages.technicians.editModal.specialty')}</label>
            <select
              className="input-field"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              required
            >
              <option value="">{t('pages.technicians.editModal.selectSpecialty')}</option>
              {SPECIALTIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? t('pages.technicians.editModal.saving') : isEditing ? t('pages.technicians.editModal.update') : t('pages.technicians.editModal.add')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">{t('pages.technicians.editModal.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ technician, onClose, onConfirm }: { technician: Technician; onClose: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-danger-500" />
          </div>
          <h2 className="text-lg font-bold text-surface-900 mb-2">{t('pages.technicians.deleteConfirm.title')}</h2>
          <p className="text-sm text-surface-500 mb-1">{t('pages.technicians.deleteConfirm.message')}</p>
          <p className="font-semibold text-surface-800">{technician.name}</p>
        </div>
        <div className="flex items-center gap-3 px-5 pb-5">
          <button onClick={onConfirm} className="btn-danger flex-1">{t('pages.technicians.deleteConfirm.confirm')}</button>
          <button onClick={onClose} className="btn-secondary flex-1">{t('pages.technicians.deleteConfirm.cancel')}</button>
        </div>
      </div>
    </div>
  );
}

export default function TechniciansPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [deletingTechnician, setDeletingTechnician] = useState<Technician | null>(null);

  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => getTechnicians(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTechnician(id),
    onSuccess: () => {
      toast.success(t('toast.success.technicianDeleted'));
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDeletingTechnician(null);
    },
    onError: () => toast.error(t('toast.error.technicianDeleteFailed')),
  });

  const filtered = technicians.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      t.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = technicians.filter((t) => t.isOnline).length;
  const activeCount = technicians.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-surface-100">{t('pages.technicians.title')}</h1>
          <p className="text-surface-500 text-sm mt-1">{t('pages.technicians.subtitle')}</p>
        </div>
        <button onClick={() => { setEditingTechnician(null); setShowForm(true); }} className="btn-primary">
          <Plus size={18} />
          {t('pages.technicians.addTechnician')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-2xl font-bold text-surface-900">{technicians.length}</p>
          <p className="text-xs text-surface-400 font-medium">{t('pages.technicians.stats.total')}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-success-500">{activeCount}</p>
          <p className="text-xs text-surface-400 font-medium">{t('pages.technicians.stats.active')}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold text-primary-500">{onlineCount}</p>
          <p className="text-xs text-surface-400 font-medium">{t('pages.technicians.stats.onlineNow')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-xs">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder={t('pages.technicians.search')}
              className="input-field pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton variant="circular" width={44} height={44} />
                <div className="flex-1">
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? t('pages.technicians.noResults') : t('pages.technicians.noTechnicians')}
            description={search ? t('pages.technicians.noResultsDesc') : t('pages.technicians.noTechniciansDesc')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('pages.technicians.table.technician')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('pages.technicians.table.specialty')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('pages.technicians.table.status')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('pages.technicians.table.connection')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('pages.technicians.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map((technician, idx) => (
                  <tr key={technician.id} className="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                          <Wrench size={18} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-surface-800 dark:text-surface-200 text-sm">{technician.name}</p>
                          <p className="text-xs text-surface-400">{technician.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100 text-surface-600 text-xs font-medium">
                        <Wrench size={12} />
                        {t('constants.specialties.' + technician.specialty, technician.specialty)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${technician.isActive ? 'badge-success' : 'badge-danger'} self-start`}>
                          {technician.isActive ? <CheckCircle2 size={12} /> : <X size={12} />}
                          {technician.isActive ? t('constants.technicianStatuses.active') : t('constants.technicianStatuses.inactive')}
                        </span>
                        <span className={`badge ${technician.isOnline ? 'badge-success' : 'badge-pending'} self-start`}>
                          {technician.isOnline ? <UserCheck size={12} /> : <UserX size={12} />}
                          {technician.isOnline ? t('constants.connectionStatuses.online') : t('constants.connectionStatuses.offline')}
                        </span>
                        {technician.availabilityStatus && (
                          <span className={`badge self-start ${
                            technician.availabilityStatus === 'available' ? 'bg-emerald-100 text-emerald-700' :
                            technician.availabilityStatus === 'busy' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {technician.availabilityStatus === 'available' ? 'متاح' :
                             technician.availabilityStatus === 'busy' ? 'مشغول' : 'غير متاح'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs text-surface-500">
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} />
                          {technician.phone}
                        </span>
                        {technician.latitude && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} />
                            {t('pages.technicians.available')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingTechnician(technician); setShowForm(true); }}
                          className="p-2 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingTechnician(technician)}
                          className="p-2 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <TechnicianFormModal
          technician={editingTechnician}
          onClose={() => { setShowForm(false); setEditingTechnician(null); }}
        />
      )}

      {deletingTechnician && (
        <DeleteConfirmModal
          technician={deletingTechnician}
          onClose={() => setDeletingTechnician(null)}
          onConfirm={() => deleteMutation.mutate(deletingTechnician.id)}
        />
      )}
    </div>
  );
}
