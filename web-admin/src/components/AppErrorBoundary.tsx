import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  resetKey: string;
};

type State = {
  error: Error | null;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Admin page render failed', error, info);
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 p-5 dark:bg-surface-950" dir="rtl">
        <section className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-7 text-center shadow-xl shadow-red-950/5 dark:border-red-500/20 dark:bg-surface-900">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle size={30} />
          </span>
          <h1 className="mt-5 text-xl font-bold text-surface-950 dark:text-white">
            تعذر عرض هذه الصفحة
          </h1>
          <p className="mt-2 text-sm leading-7 text-surface-500 dark:text-surface-400">
            لم يتم فقدان بياناتك. أعد المحاولة، وإذا تكرر الخطأ يمكنك الرجوع إلى لوحة التحكم.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={this.retry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw size={17} />
              إعادة المحاولة
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 px-4 py-3 font-semibold text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              <Home size={17} />
              لوحة التحكم
            </button>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-5 max-h-40 overflow-auto rounded-xl bg-surface-950 p-3 text-left text-xs text-red-300" dir="ltr">
              {this.state.error.message}
            </pre>
          )}
        </section>
      </main>
    );
  }
}
