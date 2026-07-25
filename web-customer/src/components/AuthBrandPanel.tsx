import type { LucideIcon } from 'lucide-react';

export default function AuthBrandPanel({ title, subtitle, features }: { title: string; subtitle: string; features: { icon: LucideIcon; title: string; description: string }[] }) {
  return (
    <aside className="hidden min-h-screen bg-surface-950 px-10 py-12 text-white lg:flex lg:w-[42%] lg:flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-9 inline-flex w-fit rounded-3xl bg-white p-3 shadow-2xl shadow-black/30"><img src="/tasaheel-logo.png" alt="تساهيل لصيانة السيارات" className="h-24 w-auto object-contain" /></div>
        <h1 className="text-3xl font-black">{title}</h1><p className="mt-2 text-surface-400">{subtitle}</p>
        <div className="mt-10 space-y-5">{features.map(({ icon: Icon, title: itemTitle, description }) => <div key={itemTitle} className="flex items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400"><Icon size={21}/></span><div><p className="font-bold">{itemTitle}</p><p className="mt-0.5 text-sm text-surface-400">{description}</p></div></div>)}</div>
      </div>
      <p className="text-center text-xs text-surface-600">© {new Date().getFullYear()} تساهيل</p>
    </aside>
  );
}
