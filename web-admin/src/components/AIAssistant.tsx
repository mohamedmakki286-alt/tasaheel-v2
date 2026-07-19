import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Wrench } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { sendChatMessage } from '../api/ai.api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('components.aiAssistant.welcome') },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions = [
    t('components.aiAssistant.suggestions.workshopsCount'),
    t('components.aiAssistant.suggestions.topRequest'),
    t('components.aiAssistant.suggestions.performanceReports'),
    t('components.aiAssistant.suggestions.tips'),
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
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
      setMessages((prev) => [...prev, { role: 'assistant', content: t('components.aiAssistant.errorMessage') }]);
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
        <div className="fixed inset-0 bg-black/20 z-50 lg:bg-transparent lg:pointer-events-none" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${isOpen ? 'lg:bottom-20' : ''}`}>
        {isOpen && (
          <div
            className="mb-3 w-80 sm:w-96 h-[520px] bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-surface-800 flex flex-col overflow-hidden animate-slide-up pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-surface-800" style={{ background: 'linear-gradient(135deg, #0f1724, #1a2744)' }}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{t('components.aiAssistant.title')}</p>
                <p className="text-[10px] text-white/50">{t('components.aiAssistant.subtitle')}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-surface-950/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-surface-800 text-gray-700 dark:text-surface-200 border border-gray-200 dark:border-surface-700 rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Wrench size={12} className="text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-500">{t('components.aiAssistant.aiName')}</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-400 dark:text-surface-500 mb-2 text-center">{t('components.aiAssistant.quickQuestions')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickActions.slice(0, 4).map((action) => (
                      <button
                        key={action}
                        onClick={() => handleQuickAction(action)}
                        className="text-[11px] text-gray-600 dark:text-surface-300 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl px-2.5 py-2 hover:border-amber-400 hover:text-amber-600 transition-all text-right"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-surface-800 bg-white dark:bg-surface-900">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('components.aiAssistant.inputPlaceholder')}
                  dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                  className="flex-1 bg-gray-100 dark:bg-surface-800 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-surface-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  disabled={mutation.isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || mutation.isPending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 bg-primary-500 text-white hover:bg-primary-600"
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

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 pointer-events-auto"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
        >
          {isOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <MessageCircle size={24} className="text-white" />
          )}
        </button>
      </div>
    </>
  );
}
