import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText, Search, FileText, ChevronLeft, ExternalLink
} from 'lucide-react';
import { getJournalEntries, getJournalEntry } from '../api/financial.api';
import { formatCurrency } from '../utils/formatters';
import Modal from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import clsx from 'clsx';

export default function JournalEntriesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);

  const referenceLabels: Record<string, string> = {
    INVOICE_APPROVAL: t('pages.journalEntries.references.INVOICE_APPROVAL'),
    INVOICE_REVERSAL: t('pages.journalEntries.references.INVOICE_REVERSAL'),
    PAYMENT: t('pages.journalEntries.references.PAYMENT'),
    COMMISSION: t('pages.journalEntries.references.COMMISSION'),
    SETTLEMENT: t('pages.journalEntries.references.SETTLEMENT'),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['journal-entries', page],
    queryFn: () => getJournalEntries({ page, size: 20 }),
  });

  const { data: entryDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['journal-entry', selectedEntry],
    queryFn: () => getJournalEntry(selectedEntry!),
    enabled: !!selectedEntry,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.journalEntries.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('pages.journalEntries.subtitle')}</p>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <CardSkeleton count={10} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.journalEntries.table.entryNumber')}</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.journalEntries.table.date')}</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.journalEntries.table.description')}</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.journalEntries.table.reference')}</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.journalEntries.table.status')}</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((entry) => (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEntry(entry.id)}>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600">{entry.entryNumber}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(entry.entryDate + 'T12:00:00').toLocaleDateString('ar-SA')}
                  </td>
                  <td className="py-3 px-4 text-gray-900">{entry.description}</td>
                  <td className="py-3 px-4">
                    {entry.referenceType && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {referenceLabels[entry.referenceType] || entry.referenceType}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      entry.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700' :
                      entry.status === 'REVERSED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    )}>
                      {entry.status === 'POSTED' ? t('pages.journalEntries.status.POSTED') : entry.status === 'REVERSED' ? t('pages.journalEntries.status.REVERSED') : t('pages.journalEntries.status.DRAFT')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedEntry(entry.id); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(data?.data || []).length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('pages.journalEntries.noData')}</td></tr>
              )}
            </tbody>
          </table>
        )}

        {data?.meta && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {t('pages.journalEntries.pageInfo', { current: data.meta.currentPage, last: Math.max(1, data.meta.lastPage) })}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t('pages.journalEntries.previous')}
              </button>
              <button
                disabled={page >= data.meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t('pages.journalEntries.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={t('pages.journalEntries.detail.title', { entryNumber: entryDetail?.entryNumber || '' })}
        size="xl"
      >
        {loadingDetail ? (
          <CardSkeleton count={5} />
        ) : entryDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('pages.journalEntries.detail.date')}: </span>
                <span className="text-gray-900 font-medium">
                  {new Date(entryDetail.entryDate + 'T12:00:00').toLocaleDateString('ar-SA')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t('pages.journalEntries.detail.status')}: </span>
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  entryDetail.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                )}>
                  {entryDetail.status === 'POSTED' ? t('pages.journalEntries.status.POSTED') : t('pages.journalEntries.status.REVERSED')}
                </span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">{t('pages.journalEntries.detail.description')}: </span>
              <span className="text-gray-900">{entryDetail.description}</span>
            </div>
            {entryDetail.referenceType && (
              <div className="text-sm">
                <span className="text-gray-500">{t('pages.journalEntries.detail.reference')}: </span>
                <span className="text-gray-900">{referenceLabels[entryDetail.referenceType] || entryDetail.referenceType} #{entryDetail.referenceId}</span>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('pages.journalEntries.detail.account')}</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">{t('pages.journalEntries.detail.description')}</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">{t('pages.journalEntries.detail.debit')}</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">{t('pages.journalEntries.detail.credit')}</th>
                </tr>
              </thead>
              <tbody>
                {entryDetail.lines.map((line) => (
                  <tr key={line.id} className="border-b border-gray-50">
                    <td className="py-2 px-3">
                      <span className="font-mono text-xs text-gray-400 ml-1">{line.accountCode}</span>
                      <span className="text-gray-900">{line.accountName}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{line.description || '-'}</td>
                    <td className="py-2 px-3 text-left font-mono text-blue-600">
                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-amber-600">
                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-50">
                  <td className="py-2 px-3 text-gray-900" colSpan={2}>{t('pages.journalEntries.detail.total')}</td>
                  <td className="py-2 px-3 text-left font-mono text-blue-700">
                    {formatCurrency(entryDetail.lines.reduce((s, l) => s + l.debit, 0))}
                  </td>
                  <td className="py-2 px-3 text-left font-mono text-amber-700">
                    {formatCurrency(entryDetail.lines.reduce((s, l) => s + l.credit, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
