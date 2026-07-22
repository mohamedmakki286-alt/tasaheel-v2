import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { Bot, X, Send, Sparkles, Wrench, Store, DollarSign, Calendar, ClipboardList } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '../api/ai.api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TOOLTIP_KEY = 'saheel-assistant-tooltip-shown';

export default function SmartAssistantButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('components.aiAssistant.greeting') },
  ]);
  const [input, setInput] = useState('');

  const quickActions = [
    { icon: Store, text: t('components.aiAssistant.q1') },
    { icon: DollarSign, text: t('components.aiAssistant.q2') },
    { icon: Calendar, text: t('components.aiAssistant.q3') },
    { icon: ClipboardList, text: t('components.aiAssistant.q4') },
  ];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shown = localStorage.getItem(TOOLTIP_KEY);
    if (!shown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem(TOOLTIP_KEY, '1');
        }, 4000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (msg: string) => {
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      return sendChatMessage(msg, history);
    },
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: 'assistant', content: t('components.aiAssistant.error') }]);
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    mutation.mutate(text);
  };

  const handleQuickAction = (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    mutation.mutate(text);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div
          className="fixed bottom-[calc(64px+16px+52px+8px)] left-4 z-50 w-[calc(100vw-32px)] sm:w-96 h-[520px] bg-white dark:bg-surface-900 rounded-[20px] shadow-xl border border-surface-200 dark:border-surface-700/50 flex flex-col overflow-hidden"
          style={{ animation: 'ai-slide-up 0.3s ease-out both' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 flex items-center gap-3 border-b border-surface-100 dark:border-surface-700/50 bg-gradient-to-l from-brand-500 to-brand-600 rounded-t-[20px]">
            <div className="w-10 h-10 rounded-[14px] bg-white/20 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{t('components.aiAssistant.title')}</p>
              <p className="text-[10px] text-white/60">{t('components.aiAssistant.subtitle')}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white p-1.5 rounded-[10px] hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ai-msg ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: '0.05s' }}>
                <div className={`max-w-[85%] p-3 rounded-[16px] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand text-white rounded-bl-[6px]'
                    : 'bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-200 border border-surface-200 dark:border-surface-700/50 rounded-br-[6px]'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Wrench size={12} className="text-brand" />
                      <span className="text-[10px] font-bold text-brand">ساهل</span>
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] text-surface-400 dark:text-surface-500 text-center">{t('components.aiAssistant.quickQuestions')}</p>
                {quickActions.map((action) => (
                  <button
                    key={action.text}
                    onClick={() => handleQuickAction(action.text)}
                    className="w-full flex items-center gap-2.5 text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/30 rounded-[12px] px-3 py-2.5 hover:border-brand/30 hover:text-brand hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all duration-200"
                  >
                    <action.icon size={14} className="text-brand shrink-0" />
                    {action.text}
                  </button>
                ))}
              </div>
            )}

            {mutation.isPending && (
              <div className="flex justify-start ai-msg">
                <div className="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700/50 rounded-[16px] rounded-br-[6px] px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wrench size={12} className="text-brand" />
                    <span className="text-[10px] font-bold text-brand">{t('components.aiAssistant.name')}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-brand/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-2 h-2 bg-brand/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 bg-brand/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-surface-100 dark:border-surface-700/50 bg-white dark:bg-surface-900 rounded-b-[20px]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('components.aiAssistant.placeholder')}
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                className="flex-1 bg-surface-50 dark:bg-surface-800 rounded-[12px] px-4 py-2.5 text-sm text-primary-500 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand/20 border border-surface-200 dark:border-surface-700/50"
                disabled={mutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || mutation.isPending}
                className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-200 disabled:opacity-30 bg-brand text-white hover:bg-brand-600 active:scale-95 shrink-0"
              >
                {mutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-[calc(64px+16px)] left-4 z-50 flex flex-col items-start">
        {showTooltip && (
          <div className="mb-2 px-3 py-1.5 bg-surface-900 dark:bg-surface-800 text-white text-xs font-medium rounded-[10px] shadow-lg whitespace-nowrap" style={{ animation: 'ai-slide-up 0.2s ease-out both' }}>
            اسأل مساعد تساهيل
            <div className="absolute bottom-[-4px] left-6 w-2 h-2 bg-surface-900 dark:bg-surface-800 rotate-45" />
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-[52px] h-[52px] rounded-[16px] bg-surface-900 dark:bg-surface-800 shadow-fab flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="اسأل مساعد تساهيل"
        >
          {isOpen ? (
            <X size={22} className="text-white" />
          ) : (
            <Bot size={22} className="text-white" />
          )}
        </button>
      </div>

      <style>{`
        @keyframes ai-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ai-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-msg { animation: ai-msg-in 0.2s ease-out both; }
      `}</style>
    </>
  );
}
