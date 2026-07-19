import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Phone, MapPin, Star, Wrench, Mail, Calendar, Edit2, Trash2, Building2, Truck, Briefcase, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { getWorkshop, approveWorkshop, rejectWorkshop, sendWorkshopInvitation, updateWorkshop } from '../api/workshops.api';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatPhone } from '../utils/formatters';
import toast from 'react-hot-toast';

function getWStatus(w: any): string {
  if (w.isApproved) return 'approved';
  if (w.rejectionReason) return 'rejected';
  return 'pending';
}

export default function WorkshopDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [contractFile, setContractFile] = useState<File | null>(null);

  const { data: workshop, isLoading } = useQuery({
    queryKey: ['workshop', id],
    queryFn: () => getWorkshop(Number(id)),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => approveWorkshop(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop', id] });
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success(t('toast.success.workshopApproved'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.workshopApproveFailed')),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectWorkshop(Number(id), rejectReason || t('pages.workshops.rejectModal.defaultReason')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop', id] });
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success(t('toast.success.workshopRejected'));
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.workshopRejectFailed')),
  });

  const inviteMutation = useMutation({
    mutationFn: () => sendWorkshopInvitation(Number(id)),
    onSuccess: async (result) => {
      await navigator.clipboard?.writeText(result.invitationUrl);
      queryClient.invalidateQueries({ queryKey: ['workshop', id] });
      toast.success('تم إرسال الدعوة ونسخ الرابط للاستخدام اليدوي');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'تعذر إرسال الدعوة'),
  });

  const editMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('workshop', JSON.stringify({ ...workshop, ...editForm, commissionPercentage: Number(editForm.commissionPercentage || 0) }));
      if (contractFile) fd.append('contract', contractFile);
      return updateWorkshop(Number(id), fd);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workshop', id] }); setShowEditModal(false); setContractFile(null); toast.success('تم حفظ بيانات الورشة'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'تعذر حفظ البيانات'),
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (!workshop) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <Building2 className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">{t('pages.workshops.detail.notFound')}</p>
      <Button variant="secondary" onClick={() => navigate('/workshops')}>{t('common.back')}</Button>
    </div>
  );

  const wStatus = getWStatus(workshop);
  const servicesList = workshop.services ? workshop.services.split(',').filter(Boolean) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/workshops')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>{t('common.back')}</span>
      </button>

      <div className="card p-0 overflow-hidden">
        <div className="gradient-primary p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <Avatar name={workshop.name} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{workshop.name}</h1>
                <StatusBadge status={wStatus} />
              </div>
              <p className="text-white/60 mt-1">{t('pages.workshops.detail.workshopSubtitle')} • {workshop.city}</p>
              {workshop.rejectionReason && wStatus === 'rejected' && (
                <p className="text-red-300 text-sm mt-1">{t('pages.workshops.detail.rejectionReason')} {workshop.rejectionReason}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={<Edit2 className="w-4 h-4" />} onClick={() => { setEditForm({ ownerName: workshop.ownerName || '', phone: workshop.phone || '', whatsapp: workshop.whatsapp || '', email: workshop.email || '', city: workshop.city || '', address: workshop.address || '', beneficiaryName: workshop.beneficiaryName || '', bankName: workshop.bankName || '', iban: workshop.iban || '', taxNumber: workshop.taxNumber || '', commissionPercentage: workshop.commissionPercentage ?? 10, adminNotes: workshop.adminNotes || '', contractSignedAt: workshop.contractSignedAt || '', contractExpiresAt: workshop.contractExpiresAt || '' }); setShowEditModal(true); }}>تعديل الملف</Button>
              {wStatus === 'pending' && (
                <>
                  <Button size="sm" icon={<CheckCircle className="w-4 h-4" />} onClick={() => approveMutation.mutate()} isLoading={approveMutation.isPending}>
                    {t('pages.workshops.approve')}
                  </Button>
                  <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />} onClick={() => setShowRejectModal(true)}>
                    {t('pages.workshops.reject')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.workshops.detail.info')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.workshops.detail.phone')}</p>
                  <p className="font-medium text-gray-900 font-mono" dir="ltr">{formatPhone(workshop.phone)}</p>
                </div>
              </div>
              {workshop.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('pages.workshops.detail.email')}</p>
                    <p className="font-medium text-gray-900">{workshop.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.workshops.detail.address')}</p>
                  <p className="font-medium text-gray-900">{workshop.city} - {workshop.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('pages.workshops.detail.registerDate')}</p>
                  <p className="font-medium text-gray-900">{formatDate(workshop.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-500">{t('pages.workshops.detail.owner')}</p>
                  <p className="font-medium text-amber-800">{workshop.ownerName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.workshops.detail.statistics')}</h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-amber-700">{workshop.rating.toFixed(1)}</p>
                <p className="text-sm text-amber-600 font-medium">{t('pages.workshops.detail.rating')}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-purple-700">{servicesList.length}</p>
                <p className="text-sm text-purple-600 font-medium">{t('pages.workshops.detail.servicesCount')}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.workshops.detail.type')}</h3>
            {(() => {
              const iconColors: Record<string, string> = {
                stationary: 'bg-blue-100 text-blue-600',
                mobile: 'bg-amber-100 text-amber-600',
                both: 'bg-purple-100 text-purple-600',
              };
              const bgColors: Record<string, string> = {
                stationary: 'from-blue-50 to-indigo-50',
                mobile: 'from-amber-50 to-orange-50',
                both: 'from-purple-50 to-violet-50',
              };
              const iconMap: Record<string, React.ReactNode> = {
                stationary: <Building2 className="w-6 h-6" />,
                mobile: <Truck className="w-6 h-6" />,
                both: <Briefcase className="w-6 h-6" />,
              };
              return (
                <div className={`bg-gradient-to-br ${bgColors[workshop.workshopType] || 'from-gray-50 to-gray-100'} rounded-2xl p-5 text-center`}>
                  <div className={`w-12 h-12 rounded-xl ${iconColors[workshop.workshopType] || 'bg-gray-100 text-gray-500'} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    {iconMap[workshop.workshopType] || <Building2 className="w-6 h-6" />}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{t(`constants.workshopTypes.${workshop.workshopType}`)}</p>
                  <p className="text-xs text-gray-500 mt-1">{workshop.workshopType === 'stationary' ? t('pages.workshops.detail.typeStationary') : workshop.workshopType === 'mobile' ? t('pages.workshops.detail.typeMobile') : t('pages.workshops.detail.typeBoth')}</p>
                </div>
              );
            })()}
          </div>
      </div>
      </div>

      {servicesList.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.workshops.detail.servicesOffered')}</h3>
          <div className="flex flex-wrap gap-2">
            {servicesList.map((svc, idx) => (
              <Badge key={idx} variant={idx % 2 === 0 ? 'info' : 'success'}>
                {svc}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">الدخول والصلاحيات</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">البريد</span><span dir="ltr">{workshop.email || 'غير مسجل'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">إعداد كلمة المرور</span><Badge variant={workshop.passwordSetupCompleted ? 'success' : 'warning'}>{workshop.passwordSetupCompleted ? 'مكتمل' : 'بانتظار الورشة'}</Badge></div>
            <div className="flex justify-between"><span className="text-gray-500">حالة الدخول</span><Badge variant={workshop.isActive ? 'success' : 'danger'}>{workshop.isActive ? 'مفعل' : 'موقوف'}</Badge></div>
            {workshop.lastInvitationSentAt && <div className="flex justify-between"><span className="text-gray-500">آخر دعوة</span><span>{formatDate(workshop.lastInvitationSentAt)}</span></div>}
            <Button className="w-full" onClick={() => inviteMutation.mutate()} isLoading={inviteMutation.isPending} disabled={!workshop.email}>إرسال رابط إعداد كلمة المرور</Button>
            <p className="text-xs text-gray-400">يُرسل عبر Resend، ويُنسخ الرابط أيضاً لاستخدامه يدوياً.</p>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">بيانات المستحقات</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">اسم المستفيد</span><span>{workshop.beneficiaryName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">البنك</span><span>{workshop.bankName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">IBAN</span><span dir="ltr">{workshop.maskedIban || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">الرقم الضريبي</span><span>{workshop.taxNumber || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">عمولة المنصة</span><span>{workshop.commissionPercentage ?? 0}%</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">العقد والملاحظات الداخلية</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">العقد الورقي الموقّع</p>
                {workshop.contractUrl ? (
                  <a
                    href={workshop.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> عرض ملف PDF
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">{t('pages.workshops.detail.notUploaded')}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">التوقيع: {workshop.contractSignedAt || 'غير محدد'} · الانتهاء: {workshop.contractExpiresAt || 'غير محدد'}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">ملاحظات الإدارة</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{workshop.adminNotes || 'لا توجد ملاحظات'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setContractFile(null); }}
        title="تعديل ملف الورشة الإداري"
        size="lg"
        footer={<div className="flex gap-3 w-full"><Button variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>إلغاء</Button><Button className="flex-1" onClick={() => editMutation.mutate()} isLoading={editMutation.isPending}>حفظ</Button></div>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[['ownerName','اسم المالك'],['phone','رقم التواصل'],['whatsapp','واتساب'],['email','بريد الدخول'],['city','المدينة'],['address','العنوان'],['beneficiaryName','اسم المستفيد'],['bankName','البنك'],['iban','IBAN'],['taxNumber','الرقم الضريبي'],['commissionPercentage','عمولة المنصة %']].map(([key,label]) => <label key={key} className="block"><span className="text-sm font-medium text-gray-700">{label}</span><input value={editForm[key] ?? ''} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} className="input-field w-full mt-1" dir={key === 'iban' || key === 'email' ? 'ltr' : undefined}/></label>)}
          <label><span className="text-sm font-medium text-gray-700">تاريخ توقيع العقد</span><input type="date" value={editForm.contractSignedAt || ''} onChange={e => setEditForm({ ...editForm, contractSignedAt: e.target.value })} className="input-field w-full mt-1"/></label>
          <label><span className="text-sm font-medium text-gray-700">انتهاء العقد</span><input type="date" value={editForm.contractExpiresAt || ''} onChange={e => setEditForm({ ...editForm, contractExpiresAt: e.target.value })} className="input-field w-full mt-1"/></label>
          <label className="sm:col-span-2"><span className="text-sm font-medium text-gray-700">استبدال/رفع العقد PDF</span><input type="file" accept="application/pdf" onChange={e => setContractFile(e.target.files?.[0] || null)} className="input-field w-full mt-1"/></label>
          <label className="sm:col-span-2"><span className="text-sm font-medium text-gray-700">ملاحظات الإدارة</span><textarea value={editForm.adminNotes || ''} onChange={e => setEditForm({ ...editForm, adminNotes: e.target.value })} className="input-field w-full mt-1" rows={3}/></label>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
        title={t('pages.workshops.detail.rejectModalTitle')}
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="flex-1">{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => rejectMutation.mutate()} isLoading={rejectMutation.isPending} className="flex-1">{t('pages.workshops.rejectModal.confirm')}</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center mb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-red-100">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 mb-3">{t('pages.workshops.rejectModal.message')}</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('pages.workshops.detail.rejectReasonRequired')}
            className="input-field w-full text-sm"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
