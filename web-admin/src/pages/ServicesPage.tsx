import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, Wrench,
  X, Check, AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getServices, createService, updateService, deleteService } from '../api/services.api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate } from '../utils/formatters';
import { getServiceIcon, SERVICE_ICON_NAMES } from '../utils/serviceIcons';
import type { ServiceType } from '../types';
import clsx from 'clsx';

const bgColors = [
  'from-amber-500 to-orange-500',
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-green-500',
  'from-purple-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-cyan-500 to-teal-500',
];

export default function ServicesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', nameEn: '', description: '', icon: 'wrench', category: '' });

  const CATEGORIES = [
    { value: 'periodic', labelKey: 'pages.services.categories.periodic' },
    { value: 'engine', labelKey: 'pages.services.categories.engine' },
    { value: 'transmission', labelKey: 'pages.services.categories.transmission' },
    { value: 'suspension', labelKey: 'pages.services.categories.suspension' },
    { value: 'electrical', labelKey: 'pages.services.categories.electrical' },
    { value: 'ac', labelKey: 'pages.services.categories.ac' },
    { value: 'bodywork', labelKey: 'pages.services.categories.bodywork' },
    { value: 'emergency', labelKey: 'pages.services.categories.emergency' },
  ];

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(t('toast.success.serviceAdded'));
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.serviceAddFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServiceType> }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(t('toast.success.serviceUpdated'));
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.serviceUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(t('toast.success.serviceDeleted'));
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.serviceDeleteFailed')),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateService(id, { isActive: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(t('toast.success.serviceStatusChanged'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.serviceStatusFailed')),
  });

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({ name: '', nameEn: '', description: '', icon: 'wrench', category: '' });
    setModalOpen(true);
  };

  const openEditModal = (svc: ServiceType) => {
    setEditingService(svc);
    setFormData({ name: svc.name, nameEn: svc.nameEn, description: svc.description || '', icon: svc.icon || 'wrench', category: svc.category || '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingService(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nameEn.trim()) {
      toast.error(t('toast.error.requiredFields'));
      return;
    }
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <CardSkeleton count={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.services.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.services.subtitle')}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          {t('pages.services.addService')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
        {(services || []).map((svc, idx) => (
          <div
            key={svc.id}
            className="card group relative overflow-hidden"
          >
            <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={() => openEditModal(svc)}
                className="p-1.5 rounded-lg hover:bg-white/80 bg-white/60 backdrop-blur-sm text-blue-600 transition-colors shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteId(svc.id)}
                className="p-1.5 rounded-lg hover:bg-white/80 bg-white/60 backdrop-blur-sm text-red-500 transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className={clsx(
                'w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg shrink-0',
                bgColors[idx % bgColors.length]
              )}>
                <div className="text-white">{React.createElement(getServiceIcon(svc.icon), { className: "w-6 h-6" })}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-lg">{svc.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{svc.nameEn}</p>
                {svc.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{svc.description}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <Badge variant={svc.isActive ? 'success' : 'gray'}>
                    {svc.isActive ? t('constants.statusLabels.active') : t('constants.statusLabels.inactive')}
                  </Badge>
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: svc.id, isActive: svc.isActive })}
                    className={clsx(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                      svc.isActive ? 'bg-emerald-500' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                        svc.isActive ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingService ? t('pages.services.editTitle') : t('pages.services.addTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>{t('common.cancel')}</Button>
            <Button
              type="submit"
              form="service-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingService ? t('pages.services.submitUpdate') : t('pages.services.submitAdd')}
            </Button>
          </>
        }
      >
        <form id="service-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('pages.services.form.nameAr')}</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('pages.services.form.nameEn')}</label>
              <input
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="input-field"
                dir="ltr"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('pages.services.form.icon')}</label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
              {SERVICE_ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: name })}
                  className={clsx(
                    'p-3 rounded-xl border-2 transition-all duration-200',
                    formData.icon === name
                      ? 'border-amber-500 bg-amber-50 text-amber-600 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 text-gray-400 hover:text-gray-600'
                  )}
                  title={name}
                >
                  {React.createElement(getServiceIcon(name), { className: "w-5 h-5" })}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('pages.services.form.category')}</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              <option value="">{t('pages.services.form.selectCategory')}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('pages.services.form.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('pages.services.deleteTitle')}
        message={t('pages.services.deleteMessage')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
