import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestsApi } from '../api/requests.api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { FileText, Eye, ChevronLeft } from 'lucide-react';

interface RequestWithReport {
  id: string;
  description: string;
  status: string;
  createdAt: string;
  inspectionReport: {
    id: string;
    workshopName: string;
    overallCondition?: string;
    grandTotal: number;
    createdAt: string;
    status: string;
  };
}

export function ReportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestWithReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    requestsApi.getAll().then((res: any) => {
      const data = res.data || res || [];
      const withReports = data.filter((r: any) => r.inspectionReport);
      setRequests(withReports);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const conditionLabel = (c?: string) => {
    switch (c) {
      case 'excellent': return { text: t('constants.condition.excellent'), color: 'text-success-400' };
      case 'good': return { text: t('constants.condition.good'), color: 'text-success-400' };
      case 'fair': return { text: t('constants.condition.fair'), color: 'text-accent-400' };
      case 'poor': return { text: t('constants.condition.poor'), color: 'text-danger-400' };
      default: return { text: c || '—', color: 'text-surface-400' };
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">{t('pages.reports.title')}</h2>
      {requests.length === 0 ? (
        <EmptyState title={t('pages.reports.emptyTitle')} description={t('pages.reports.emptyDescription')} />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const report = req.inspectionReport;
            const cond = conditionLabel(report.overallCondition);
            return (
              <button
                key={req.id}
                onClick={() => navigate(`/inspection-report/${req.id}`)}
                className="card w-full text-right hover:bg-surface-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-accent-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{report.workshopName}</h3>
                      <p className="text-xs text-surface-400 truncate">{req.description || t('constants.maintenanceRequest')}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs font-medium ${cond.color}`}>{cond.text}</span>
                        <span className="text-xs text-surface-500">|</span>
                        <span className="text-xs text-surface-400">{report.grandTotal.toLocaleString()} {t('constants.currency')}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-surface-500 shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
