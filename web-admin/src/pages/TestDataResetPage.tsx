import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Trash2,
  Eye,
  RotateCcw,
  Users,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  FileText,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getTestDataResetUsers,
  previewTestDataReset,
  executeTestDataReset,
  getTestDataResetAuditLog,
  type UserData,
  type PreviewResponse,
  type ResetReport,
  type AuditLogEntry,
} from '../api/testDataReset.api';
import clsx from 'clsx';

type Step = 'select' | 'preview' | 'confirm' | 'result';

export default function TestDataResetPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('select');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [selectedWorkshopIds, setSelectedWorkshopIds] = useState<number[]>([]);
  const [selectAllCustomers, setSelectAllCustomers] = useState(true);
  const [selectAllWorkshops, setSelectAllWorkshops] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<ResetReport | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['testDataResetUsers'],
    queryFn: getTestDataResetUsers,
  });

  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['testDataResetAuditLog'],
    queryFn: getTestDataResetAuditLog,
    enabled: showAuditLog,
  });

  const previewMutation = useMutation({
    mutationFn: () => {
      const cIds = selectAllCustomers ? undefined : selectedCustomerIds;
      const wIds = selectAllWorkshops ? undefined : selectedWorkshopIds;
      return previewTestDataReset(cIds, wIds);
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setStep('preview');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to preview');
    },
  });

  const executeMutation = useMutation({
    mutationFn: () => executeTestDataReset(confirmText),
    onSuccess: (data) => {
      setExecuteResult(data);
      setStep('result');
      toast.success('Test data reset completed successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to execute reset');
      setShowConfirmDialog(false);
    },
  });

  const handleUserToggle = (type: 'customer' | 'workshop', id: number) => {
    if (type === 'customer') {
      setSelectedCustomerIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedWorkshopIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  const handlePreview = () => {
    if (!selectAllCustomers && selectedCustomerIds.length === 0 && !selectAllWorkshops && selectedWorkshopIds.length === 0) {
      toast.error('Please select at least one customer or workshop');
      return;
    }
    previewMutation.mutate();
  };

  const handleExecuteClick = () => {
    if (confirmText !== 'RESET_TASAHEEL_TEST_DATA') {
      toast.error('Confirmation text does not match');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmExecute = () => {
    executeMutation.mutate();
    setShowConfirmDialog(false);
  };

  const handleReset = () => {
    setStep('select');
    setPreviewData(null);
    setExecuteResult(null);
    setConfirmText('');
    setSelectedCustomerIds([]);
    setSelectedWorkshopIds([]);
    setSelectAllCustomers(true);
    setSelectAllWorkshops(true);
  };

  const renderUserCheckbox = (user: UserData, type: 'customer' | 'workshop') => {
    const isSelected = type === 'customer'
      ? selectAllCustomers || selectedCustomerIds.includes(user.id)
      : selectAllWorkshops || selectedWorkshopIds.includes(user.id);

    return (
      <label
        key={user.id}
        className={clsx(
          'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
          isSelected
            ? 'border-red-300 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5'
            : 'border-gray-200 bg-white dark:border-surface-700 dark:bg-surface-900 hover:border-gray-300 dark:hover:border-surface-600'
        )}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => handleUserToggle(type, user.id)}
          disabled={type === 'customer' ? selectAllCustomers : selectAllWorkshops}
          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-surface-100 truncate">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-surface-400 truncate">{user.email}</p>
        </div>
        <span className="text-xs font-mono text-gray-400 dark:text-surface-500">#{user.id}</span>
      </label>
    );
  };

  const stepIndicator = [
    { key: 'select', label: 'اختيار البيانات' },
    { key: 'preview', label: 'معاينة' },
    { key: 'confirm', label: 'تأكيد' },
    { key: 'result', label: 'النتيجة' },
  ];

  const currentStepIndex = stepIndicator.findIndex((s) => s.key === step);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            إعادة تعيين بيانات التجربة
          </h1>
          <p className="text-sm text-gray-500 dark:text-surface-400 mt-1 mr-13">
            حذف جميع البيانات التشغيلية مع الحفاظ على حسابات المستخدمين
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<FileText className="w-4 h-4" />}
          onClick={() => setShowAuditLog(!showAuditLog)}
        >
          سجل العمليات
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 bg-white dark:bg-surface-900 rounded-2xl p-4 border border-gray-100 dark:border-surface-800">
        {stepIndicator.map((s, idx) => (
          <React.Fragment key={s.key}>
            <div className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              idx === currentStepIndex
                ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                : idx < currentStepIndex
                ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                : 'text-gray-400 dark:text-surface-500'
            )}>
              {idx < currentStepIndex ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : idx === currentStepIndex ? (
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              ) : (
                <div className="w-2 h-2 bg-gray-300 dark:bg-surface-600 rounded-full" />
              )}
              <span>{s.label}</span>
            </div>
            {idx < stepIndicator.length - 1 && (
              <div className={clsx(
                'flex-1 h-px',
                idx < currentStepIndex ? 'bg-green-300 dark:bg-green-500/30' : 'bg-gray-200 dark:bg-surface-700'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Audit Log Section */}
      {showAuditLog && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-100 dark:border-surface-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-surface-100">سجل عمليات إعادة التعيين</h3>
            <button
              onClick={() => setShowAuditLog(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-surface-300"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {auditLogsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 dark:text-surface-500">
              لا توجد سجلات بعد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-surface-800">
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-surface-300">التاريخ</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-surface-300">المدير</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-surface-300">الحالة</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-surface-300">السجلات المحذوفة</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-surface-300">الجداول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-surface-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-3 text-gray-500 dark:text-surface-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('ar-SA')}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-surface-100">
                        {log.adminUserName} (#{log.adminUserId})
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                          log.result === 'SUCCESS'
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
                            : log.result === 'DRY_RUN'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                        )}>
                          {log.result === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                          {log.result === 'DRY_RUN' && <Eye className="w-3 h-3" />}
                          {log.result !== 'SUCCESS' && log.result !== 'DRY_RUN' && <XCircle className="w-3 h-3" />}
                          {log.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-900 dark:text-surface-100">
                        {log.totalRecordsDeleted.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-surface-400 max-w-xs truncate">
                        {log.tablesAffected}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step: Select Users */}
      {step === 'select' && (
        <div className="space-y-6">
          {usersLoading ? (
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-8 text-center border border-gray-100 dark:border-surface-800">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-surface-400 mt-3">جاري تحميل المستخدمين...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customers */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-100 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/15 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-surface-100">العملاء</h3>
                    <p className="text-xs text-gray-500 dark:text-surface-400">
                      {users?.customers?.length || 0} حساب
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-surface-800 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAllCustomers}
                      onChange={(e) => {
                        setSelectAllCustomers(e.target.checked);
                        if (e.target.checked) setSelectedCustomerIds([]);
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-surface-200">تحديد الكل</span>
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {users?.customers?.map((user) => renderUserCheckbox(user, 'customer'))}
                  </div>
                </div>
              </div>

              {/* Workshops */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-100 dark:border-surface-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800 flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/15 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-surface-100">الورش</h3>
                    <p className="text-xs text-gray-500 dark:text-surface-400">
                      {users?.workshops?.length || 0} حساب
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-surface-800 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAllWorkshops}
                      onChange={(e) => {
                        setSelectAllWorkshops(e.target.checked);
                        if (e.target.checked) setSelectedWorkshopIds([]);
                      }}
                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-surface-200">تحديد الكل</span>
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {users?.workshops?.map((user) => renderUserCheckbox(user, 'workshop'))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">تحذير: عملية لا يمكن التراجع عنها</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                سيتم حذف جميع البيانات التشغيلية (الطلبات، المحادثات، الفواتير، المدفوعات، التقييمات، إلخ)
                مع الحفاظ على حسابات المستخدمين والورش والتقنيين.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="lg"
              icon={<Eye className="w-5 h-5" />}
              onClick={handlePreview}
              isLoading={previewMutation.isPending}
            >
              معاينة البيانات المراد حذفها
            </Button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && previewData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-gray-100 dark:border-surface-800">
              <p className="text-xs text-gray-500 dark:text-surface-400 mb-1">إجمالي السجلات</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {previewData.totalRecordsToDelete.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-gray-100 dark:border-surface-800">
              <p className="text-xs text-gray-500 dark:text-surface-400 mb-1">العملاء المحددون</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {previewData.customerIds.length}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-gray-100 dark:border-surface-800">
              <p className="text-xs text-gray-500 dark:text-surface-400 mb-1">الورش المحددة</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {previewData.workshopIds.length}
              </p>
            </div>
          </div>

          {/* Table Counts */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-100 dark:border-surface-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-surface-800">
              <h3 className="font-bold text-gray-900 dark:text-surface-100">البيانات المراد حذفها حسب الجدول</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-surface-800">
              {previewData.tableCounts
                .filter((tc) => tc.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((tc) => (
                  <div key={tc.tableName} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-surface-800/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-surface-200 font-mono">{tc.tableName}</span>
                    <span className={clsx(
                      'text-sm font-bold',
                      tc.count > 100 ? 'text-red-600 dark:text-red-400' : tc.count > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-surface-300'
                    )}>
                      {tc.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              {previewData.tableCounts.every((tc) => tc.count === 0) && (
                <div className="px-6 py-8 text-center text-sm text-gray-400 dark:text-surface-500">
                  لا توجد بيانات تشغيلية للحذف
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-100 dark:border-surface-800 p-6">
            <h3 className="font-bold text-gray-900 dark:text-surface-100 mb-2">تأكيد النص</h3>
            <p className="text-sm text-gray-500 dark:text-surface-400 mb-4">
              اكتب <code className="px-2 py-1 bg-gray-100 dark:bg-surface-800 rounded-lg text-red-600 dark:text-red-400 font-mono text-xs">{previewData.confirmText}</code> للتأكيد
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={previewData.confirmText}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800 text-gray-900 dark:text-surface-100 font-mono text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
              العودة
            </Button>
            <Button
              variant="danger"
              size="lg"
              icon={<Trash2 className="w-5 h-5" />}
              onClick={handleExecuteClick}
              disabled={confirmText !== 'RESET_TASAHEEL_TEST_DATA'}
            >
              تنفيذ إعادة التعيين
            </Button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && executeResult && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300">تمت إعادة التعيين بنجاح</h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              تم حذف {executeResult.totalDeleted.toLocaleString()} سجل تشغيلي
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-gray-100 dark:border-surface-800">
              <p className="text-xs text-gray-500 dark:text-surface-400 mb-1">السجلات المحذوفة</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-surface-100">
                {executeResult.totalDeleted.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-gray-100 dark:border-surface-800">
              <p className="text-xs text-gray-500 dark:text-surface-400 mb-1">الملفات المحذوفة</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-surface-100">
                {executeResult.filesDeleted.length}
              </p>
            </div>
          </div>

          {executeResult.filesDeleted.length > 0 && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-gray-100 dark:border-surface-800 p-6">
              <h3 className="font-bold text-gray-900 dark:text-surface-100 mb-3">الملفات المحذوفة</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {executeResult.filesDeleted.map((file) => (
                  <p key={file} className="text-xs font-mono text-gray-500 dark:text-surface-400">{file}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button variant="primary" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
              عملية جديدة
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmExecute}
        title="تأكيد إعادة تعيين بيانات التجربة"
        message="سيتم حذف جميع البيانات التشغيلية نهائياً. لا يمكن التراجع عن هذه العملية. هل أنت متأكد؟"
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={executeMutation.isPending}
      />
    </div>
  );
}
