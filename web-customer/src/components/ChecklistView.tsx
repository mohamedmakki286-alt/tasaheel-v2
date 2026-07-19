import { useTranslation } from 'react-i18next';
import type { InspectionChecklistItem } from '../types';
import { CheckCircle, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';

const statusIcons: Record<string, React.ReactNode> = {
  good: <CheckCircle className="h-5 w-5 text-success-500" />,
  fair: <AlertTriangle className="h-5 w-5 text-accent-500" />,
  poor: <XCircle className="h-5 w-5 text-danger-500" />,
  na: <MinusCircle className="h-5 w-5 text-surface-500" />,
};

export function ChecklistView({ items }: { items: InspectionChecklistItem[] }) {
  const { t } = useTranslation();
  const categoryLabels: Record<string, string> = {
    engine: t('constants.checklist.categories.engine'),
    transmission: t('constants.checklist.categories.transmission'),
    suspension: t('constants.checklist.categories.suspension'),
    brakes: t('constants.checklist.categories.brakes'),
    electrical: t('constants.checklist.categories.electrical'),
    ac: t('constants.checklist.categories.ac'),
    bodywork: t('constants.checklist.categories.bodywork'),
    tires: t('constants.checklist.categories.tires'),
    fluids: t('constants.checklist.categories.fluids'),
    periodic: t('constants.checklist.categories.periodic'),
    emergency: t('constants.checklist.categories.emergency'),
  };
  const statusLabels: Record<string, string> = {
    good: t('constants.checklist.statuses.good'),
    fair: t('constants.checklist.statuses.fair'),
    poor: t('constants.checklist.statuses.poor'),
    na: t('constants.checklist.statuses.na'),
  };
  const grouped: Record<string, InspectionChecklistItem[]> = {};
  items.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category} className="card">
          <h4 className="font-semibold text-accent-400 mb-3">
            {categoryLabels[category] || category}
          </h4>
          <div className="space-y-2">
            {categoryItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-1.5">
                {statusIcons[item.status] || statusIcons.na}
                <span className="flex-1 text-sm">{item.itemName}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  item.status === 'good' ? 'bg-success-500/20 text-success-400' :
                  item.status === 'fair' ? 'bg-accent-500/20 text-accent-400' :
                  item.status === 'poor' ? 'bg-danger-500/20 text-danger-400' :
                  'bg-surface-600/50 text-surface-400'
                }`}>
                  {statusLabels[item.status] || item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
