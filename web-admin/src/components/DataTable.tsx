import React from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { TableSkeleton } from './Skeleton';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  pagination?: {
    currentPage: number;
    lastPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  filters?: React.ReactNode;
  bulkActions?: React.ReactNode;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyMessage,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  sortKey,
  sortOrder,
  onSort,
  pagination,
  onRowClick,
  keyExtractor,
  filters,
  bulkActions,
  selectedIds,
  onSelectionChange,
}: Props<T>) {
  const { t } = useTranslation();
  emptyMessage = emptyMessage || t('components.dataTable.emptyMessage');
  searchPlaceholder = searchPlaceholder || t('components.dataTable.searchPlaceholder');
  const allSelected = data.length > 0 && selectedIds?.length === data.length;
  const hasSelection = selectedIds && selectedIds.length > 0;

  const renderSortIcon = (key: string) => {
    if (sortKey !== key) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-amber-500" />
    ) : (
      <ChevronDown className="w-3 h-3 text-amber-500" />
    );
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => keyExtractor(item)));
    }
  };

  const toggleItem = (id: string | number) => {
    if (!onSelectionChange || !selectedIds) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="card-static p-6">
        <TableSkeleton rows={5} cols={columns.length} />
      </div>
    );
  }

  return (
    <div className="card-static p-0 overflow-hidden">
      {(onSearchChange || filters || bulkActions) && (
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {onSearchChange && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="input-field pr-9"
                />
              </div>
            )}
            {bulkActions && hasSelection && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-sm text-gray-500 whitespace-nowrap">{t('components.dataTable.selected', { count: selectedIds?.length })}</span>
                {bulkActions}
              </div>
            )}
          </div>
          {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {onSelectionChange && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:bg-gray-100 transition-colors',
                    col.width
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selectedIds?.includes(id);
                return (
                  <tr
                    key={id}
                    className={clsx(
                      'hover:bg-gray-50/80 transition-colors duration-150',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-amber-50/30'
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {onSelectionChange && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleItem(id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/30">
          <span className="text-sm text-gray-500">
            {t('components.dataTable.total')} <span className="font-semibold text-gray-700">{pagination.total.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {getPageNumbers(pagination.currentPage, pagination.lastPage).map((page, idx) =>
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page as number)}
                  className={clsx(
                    'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors',
                    page === pagination.currentPage
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.lastPage}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.lastPage)}
              disabled={pagination.currentPage >= pagination.lastPage}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-500"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getPageNumbers(current: number, last: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < last - 2) pages.push('...');
    pages.push(last);
  }
  return pages;
}
