import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Phone, MapPin, Calendar, Car, ClipboardList, Mail, Edit2, Trash2 } from 'lucide-react';
import { getCustomer } from '../api/customers.api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatPhone, formatNumber } from '../utils/formatters';
import clsx from 'clsx';

export default function CustomerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(Number(id)),
    enabled: !!id,
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (!customer) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">{t('pages.customers.customerDetail.notFound')}</p>
      <Button variant="secondary" onClick={() => navigate('/customers')}>{t('pages.customers.customerDetail.backToCustomers')}</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/customers')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>{t('pages.customers.customerDetail.backToCustomers')}</span>
      </button>

      <div className="card p-0 overflow-hidden">
        <div className="gradient-primary p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Avatar name={customer.name} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{customer.name}</h1>
                <StatusBadge status={customer.isActive ? 'active' : 'inactive'} />
              </div>
              <p className="text-white/60 mt-1">{t('pages.customers.customerDetail.customerSince')} {formatDate(customer.joinedAt)}</p>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.customers.customerDetail.contactInfo')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.customers.customerDetail.phone')}</p>
                  <p className="font-medium text-gray-900 font-mono" dir="ltr">{formatPhone(customer.phone)}</p>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('pages.customers.customerDetail.email')}</p>
                    <p className="font-medium text-gray-900">{customer.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.customers.customerDetail.city')}</p>
                  <p className="font-medium text-gray-900">{customer.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.customers.customerDetail.registerDate')}</p>
                  <p className="font-medium text-gray-900">{formatDate(customer.joinedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.customers.customerDetail.statistics')}</h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-blue-700">{formatNumber(customer.carsCount)}</p>
                <p className="text-sm text-blue-600 font-medium">{t('pages.customers.customerDetail.cars')}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-amber-700">{formatNumber(customer.requestsCount)}</p>
                <p className="text-sm text-amber-600 font-medium">{t('pages.customers.customerDetail.requests')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
