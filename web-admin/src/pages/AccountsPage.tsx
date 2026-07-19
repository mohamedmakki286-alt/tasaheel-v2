import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, ChevronLeft, Search, DollarSign, Building2,
  TrendingUp, TrendingDown, PieChart
} from 'lucide-react';
import { getAccounts, getTrialBalance } from '../api/financial.api';
import { formatCurrency } from '../utils/formatters';
import { CardSkeleton } from '../components/Skeleton';
import clsx from 'clsx';

const typeIcons: Record<string, React.ReactNode> = {
  ASSET: <DollarSign className="w-4 h-4" />,
  LIABILITY: <Building2 className="w-4 h-4" />,
  REVENUE: <TrendingUp className="w-4 h-4" />,
  EXPENSE: <TrendingDown className="w-4 h-4" />,
};

export default function AccountsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showTrialBalance, setShowTrialBalance] = useState(false);

  const typeLabels: Record<string, { label: string; color: string }> = {
    ASSET: { label: t('pages.accounts.types.ASSET'), color: 'text-blue-600 bg-blue-50' },
    LIABILITY: { label: t('pages.accounts.types.LIABILITY'), color: 'text-amber-600 bg-amber-50' },
    REVENUE: { label: t('pages.accounts.types.REVENUE'), color: 'text-emerald-600 bg-emerald-50' },
    EXPENSE: { label: t('pages.accounts.types.EXPENSE'), color: 'text-red-600 bg-red-50' },
  };

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const { data: trialBalance, isLoading: loadingTrial } = useQuery({
    queryKey: ['trial-balance'],
    queryFn: getTrialBalance,
    enabled: showTrialBalance,
  });

  const filtered = (accounts || []).filter((a) =>
    !search || a.name.includes(search) || a.code.includes(search) || a.nameEn?.toLowerCase().includes(search.toLowerCase())
  );

  const levelAccounts = (parentId: number | null) =>
    filtered.filter((a) => a.parentId === parentId);

  const renderAccount = (account: any, depth: number = 0) => {
    const children = levelAccounts(account.id);
    return (
      <React.Fragment key={account.id}>
        <tr className={clsx('border-b border-gray-50 hover:bg-gray-50 transition-colors',
          depth === 0 && 'bg-gray-50/50'
        )}>
          <td className="py-2.5 px-3">
            <div className="flex items-center gap-2" style={{ paddingRight: `${depth * 20}px` }}>
              <span className={clsx(
                'px-1.5 py-0.5 rounded text-xs font-mono font-bold',
                depth === 0 ? 'text-gray-500' : 'text-gray-400'
              )}>
                {account.code}
              </span>
              <span className={clsx('text-sm', depth === 0 ? 'font-bold text-gray-900' : 'text-gray-700')}>
                {account.name}
              </span>
              {account.nameEn && (
                <span className="text-xs text-gray-400 hidden lg:inline">{account.nameEn}</span>
              )}
            </div>
          </td>
          <td className="py-2.5 px-3">
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1',
              typeLabels[account.type]?.color || 'text-gray-600 bg-gray-50'
            )}>
              {typeIcons[account.type]}
              {typeLabels[account.type]?.label || account.type}
            </span>
          </td>
          <td className="py-2.5 px-3 text-left font-mono text-sm">
            <span className={clsx(
              'font-medium',
              account.balance >= 0 ? 'text-emerald-600' : 'text-red-500'
            )}>
              {formatCurrency(Math.abs(account.balance))}
            </span>
          </td>
          <td className="py-2.5 px-3 text-left">
            {account.isSystem && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t('pages.accounts.system')}</span>
            )}
          </td>
        </tr>
        {children.map((child) => renderAccount(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.accounts.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.accounts.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowTrialBalance(!showTrialBalance)}
          className="px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-2"
        >
          <PieChart className="w-4 h-4" />
          {showTrialBalance ? t('pages.accounts.showChart') : t('pages.accounts.trialBalance')}
        </button>
      </div>

      {!showTrialBalance ? (
        <>
          <div className="relative max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pages.accounts.searchPlaceholder')}
              className="w-full pr-9 pl-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Object.entries(typeLabels).map(([type, info]) => {
              const total = (accounts || [])
                .filter((a) => a.type === type)
                .reduce((sum, a) => sum + a.balance, 0);
              return (
                <div key={type} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', info.color)}>
                      {typeIcons[type]}
                    </div>
                    <span className="text-sm text-gray-500">{info.label}</span>
                  </div>
                  <p className={clsx('text-lg font-bold', info.color.split(' ')[0])}>
                    {formatCurrency(Math.abs(total))}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="card overflow-hidden">
            {isLoading ? (
              <CardSkeleton count={8} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.accounts.table.account')}</th>
                    <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.accounts.table.type')}</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">{t('pages.accounts.table.balance')}</th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {levelAccounts(null).map((a) => renderAccount(a, 0))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">{t('pages.accounts.noAccounts')}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">{t('pages.accounts.trialBalance')}</h3>
            <p className="text-xs text-gray-400 mt-1">{t('pages.accounts.lastUpdate')}</p>
          </div>
          {loadingTrial ? (
            <CardSkeleton count={8} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.accounts.table.code')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.accounts.table.account')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.accounts.table.type')}</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('pages.accounts.table.debit')}</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('pages.accounts.table.credit')}</th>
                </tr>
              </thead>
              <tbody>
                {(trialBalance || []).map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{row.code}</td>
                    <td className="py-2.5 px-4 text-gray-900">{row.name}</td>
                    <td className="py-2.5 px-4">
                      <span className={clsx(
                        'px-1.5 py-0.5 rounded text-xs font-medium',
                        typeLabels[row.type]?.color
                      )}>
                        {typeLabels[row.type]?.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono text-blue-600">
                      {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-left font-mono text-amber-600">
                      {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
