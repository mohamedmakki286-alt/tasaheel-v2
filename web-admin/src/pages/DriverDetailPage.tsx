import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Phone, MapPin, Truck, Car, Mail, Calendar, Edit2, Trash2, Award, Activity } from 'lucide-react';
import { getDriver } from '../api/drivers.api';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatPhone } from '../utils/formatters';

export default function DriverDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: driver, isLoading } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => getDriver(Number(id)),
    enabled: !!id,
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (!driver) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <Truck className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">{t('pages.drivers.detail.notFound')}</p>
      <Button variant="secondary" onClick={() => navigate('/drivers')}>{t('pages.drivers.detail.backToDrivers')}</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/drivers')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>{t('pages.drivers.detail.backToDrivers')}</span>
      </button>

      <div className="card p-0 overflow-hidden">
        <div className="gradient-primary p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Avatar name={driver.name} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{driver.name}</h1>
                <StatusBadge status={driver.isOnline ? 'online' : 'offline'} />
                <StatusBadge status={driver.isApproved ? 'approved' : 'pending'} />
              </div>
              <p className="text-white/60 mt-1">{t('pages.drivers.title')} • {driver.city}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={<Edit2 className="w-4 h-4" />} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                {t('common.edit')}
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.drivers.detail.contactInfo')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.drivers.detail.phone')}</p>
                  <p className="font-medium text-gray-900 font-mono" dir="ltr">{formatPhone(driver.phone)}</p>
                </div>
              </div>
              {driver.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('pages.drivers.detail.email')}</p>
                    <p className="font-medium text-gray-900">{driver.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.drivers.detail.city')}</p>
                  <p className="font-medium text-gray-900">{driver.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.drivers.detail.registerDate')}</p>
                  <p className="font-medium text-gray-900">{formatDate(driver.joinedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.drivers.detail.vehicleInfo')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <Car className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.drivers.detail.vehicleType')}</p>
                  <p className="font-medium text-gray-900">{driver.vehicleType}</p>
                </div>
              </div>
              {driver.vehiclePlate && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('pages.drivers.detail.plateNumber')}</p>
                    <p className="font-medium text-gray-900 font-mono">{driver.vehiclePlate}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.drivers.detail.status')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('pages.drivers.detail.connectionStatus')}</p>
                  </div>
                </div>
                <StatusBadge status={driver.isOnline ? 'online' : 'offline'} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('pages.drivers.detail.approvalStatus')}</p>
                  </div>
                </div>
                <StatusBadge status={driver.isApproved ? 'approved' : 'pending'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
