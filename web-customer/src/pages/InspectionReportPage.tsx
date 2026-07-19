import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { requestsApi } from '../api/requests.api';
import { invoicesApi } from '../api/invoices.api';
import type { InspectionReport } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ChecklistView } from '../components/ChecklistView';
import { ArrowLeft, CheckCircle, XCircle, FileText } from 'lucide-react';

export function InspectionReportPage() {
  const { t } = useTranslation();
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    if (!requestId) return;
    setLoading(true);
    requestsApi.getById(requestId).then((res: any) => {
      const req = res.data || res;
      if (req.inspectionReport) {
        setReport(req.inspectionReport);
      }
    }).catch(() => {
      toast.error(t('toast.error.loadReport'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [requestId]);

  const handleApprove = async () => {
    if (!requestId) return;
    setActionLoading(true);
    try {
      await requestsApi.approveReport(requestId);
      toast.success(t('toast.success.approveReport'));
      navigate(`/orders/${requestId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.approveReport'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!requestId) return;
    setActionLoading(true);
    try {
      await requestsApi.rejectReport(requestId);
      toast.success(t('toast.success.rejectReport'));
      navigate(`/orders/${requestId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.rejectReport'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!report) return <div className="p-4 text-center text-surface-400">{t('pages.inspectionReport.notFound')}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/orders/${requestId}`)} className="p-2 hover:bg-surface-800 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold">{t('pages.inspectionReport.title')}</h2>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-6 w-6 text-accent-400" />
          <div>
            <h3 className="font-semibold">{report.workshopName}</h3>
            <p className="text-xs text-surface-400">{new Date(report.createdAt).toLocaleDateString('ar-SA')}</p>
          </div>
        </div>
        {report.mileage && (
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <span>{t('pages.inspectionReport.mileage')}: {report.mileage.toLocaleString()} {t('constants.km')}</span>
          </div>
        )}
      </div>

      {/* Overall Condition */}
      {report.overallCondition && (
        <div className="card flex items-center justify-between">
          <span className="text-surface-400">{t('pages.inspectionReport.overallCondition')}</span>
          <span className={`font-bold text-lg ${
            report.overallCondition === 'excellent' || report.overallCondition === 'good'
              ? 'text-success-400' : report.overallCondition === 'fair'
              ? 'text-accent-400' : 'text-danger-400'
          }`}>
            {report.overallCondition === 'excellent' ? t('constants.condition.excellent') :
             report.overallCondition === 'good' ? t('constants.condition.good') :
             report.overallCondition === 'fair' ? t('constants.condition.fair') :
             report.overallCondition === 'poor' ? t('constants.condition.poor') : report.overallCondition}
          </span>
        </div>
      )}

      {/* Checklist */}
      {report.checklist && report.checklist.length > 0 && (
        <ChecklistView items={report.checklist} />
      )}

      {/* Workshop Notes */}
      {report.notes && (
        <div className="card">
          <h4 className="font-semibold mb-2">{t('pages.inspectionReport.notes')}</h4>
          <p className="text-sm text-surface-300">{report.notes}</p>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && (
        <div className="card border-accent-500/30">
          <h4 className="font-semibold text-accent-400 mb-2">{t('pages.inspectionReport.recommendations')}</h4>
          <p className="text-sm whitespace-pre-wrap">{report.recommendations}</p>
        </div>
      )}

      {/* Parts & Labor */}
      {report.parts && report.parts.length > 0 && (
        <div className="card">
          <h4 className="font-semibold mb-3">{t('pages.inspectionReport.parts')}</h4>
          <div className="space-y-2">
            {report.parts.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.partName} × {p.quantity}</span>
                <span className="text-surface-400">{p.total.toLocaleString()} {t('constants.currency')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.laborItems && report.laborItems.length > 0 && (
        <div className="card">
          <h4 className="font-semibold mb-3">{t('pages.inspectionReport.labor')}</h4>
          <div className="space-y-2">
            {report.laborItems.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span>{l.description} ({l.hours} {t('constants.hours')})</span>
                <span className="text-surface-400">{l.total.toLocaleString()} {t('constants.currency')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="card bg-surface-700/50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-400">{t('pages.inspectionReport.totalParts')}</span>
            <span>{report.totalParts.toLocaleString()} {t('constants.currency')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400">{t('pages.inspectionReport.totalLabor')}</span>
            <span>{report.totalLabor.toLocaleString()} {t('constants.currency')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400">{t('constants.tax')}</span>
            <span>{report.tax.toLocaleString()} {t('constants.currency')}</span>
          </div>
          <div className="border-t border-surface-600 pt-2 flex justify-between font-bold text-lg">
            <span>{t('pages.inspectionReport.total')}</span>
            <span className="text-accent-400">{report.grandTotal.toLocaleString()} {t('constants.currency')}</span>
          </div>
        </div>
      </div>

      {/* Approve/Reject */}
      {report.status === 'pending_approval' && (
        <div className="flex gap-3">
          <button onClick={handleReject} disabled={actionLoading} className="btn-danger flex-1 flex items-center justify-center gap-2 py-3">
            <XCircle className="h-5 w-5" /> {t('pages.inspectionReport.rejectReport')}
          </button>
          <button onClick={handleApprove} disabled={actionLoading} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            <CheckCircle className="h-5 w-5" /> {t('pages.inspectionReport.approve')}
          </button>
        </div>
      )}
    </div>
  );
}
