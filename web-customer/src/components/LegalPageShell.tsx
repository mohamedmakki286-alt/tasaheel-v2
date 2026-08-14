import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function LegalPageShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="min-h-screen bg-surface-50 px-4 py-8 text-surface-900 dark:bg-surface-950 dark:text-white" dir="rtl">
    <article className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-surface-200 bg-white shadow-xl dark:border-surface-800 dark:bg-surface-900">
      <header className="bg-gradient-to-br from-surface-950 to-surface-800 p-7 text-white sm:p-9"><div className="flex items-center gap-4"><img src="/tasaheel-logo.png" alt="تساهيل" className="h-14 w-14 rounded-2xl object-contain"/><div><p className="text-xs text-white/60">منصة تساهيل لصيانة السيارات</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-white/65">{subtitle}</p></div></div></header>
      <div className="legal-content space-y-7 p-6 leading-8 text-surface-600 dark:text-surface-300 sm:p-9">{children}</div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 px-6 py-5 text-sm dark:border-surface-800"><Link to="/" className="font-bold text-accent-600">العودة إلى تساهيل</Link><span className="text-xs text-surface-400">آخر تحديث: 15 أغسطس 2026</span></footer>
    </article>
  </main>;
}
