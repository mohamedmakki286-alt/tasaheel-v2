import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import Button from './Button';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

const iconConfig = {
  danger: { icon: Trash2, bg: 'bg-red-100', color: 'text-red-600' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100', color: 'text-amber-600' },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: Props) {
  const { t } = useTranslation();
  confirmText = confirmText || t('components.confirmDialog.confirm');
  cancelText = cancelText || t('components.confirmDialog.cancel');
  if (!isOpen) return null;

  const config = iconConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', config.bg)}>
            <Icon className={clsx('w-7 h-7', config.color)} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
