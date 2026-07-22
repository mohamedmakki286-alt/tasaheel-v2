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

export default function AIAssistant() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 400);
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
      <style>{`
        @keyframes ai-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
          50% { box-shadow: 0 0 0 16px rgba(245, 158, 11, 0); }
        }
        @keyframes ai-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ai-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-pulse { animation: ai-pulse 3s ease-in-out infinite; }
        .ai-slide-up { animation: ai-slide-up 0.3s ease-out both; }
        .ai-msg { animation: ai-msg-in 0.2s ease-out both; }
        .ai-panel { max-height: calc(100dvh - 120px); }
      `}</style>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:bg-black/20 lg:backdrop-blur-none" onClick={() => setIsOpen(false)} />
      )}

      <div className="fixed bottom-24 left-4 z-50 lg:bottom-24 lg:left-6">
        {isOpen && (
          <div
            className="w-[calc(100vw-32px)] sm:w-96 ai-panel h-[520px] bg-surface-900 rounded-2xl shadow-2xl border border-surface-700/50 flex flex-col overflow-hidden ai-slide-up mb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center gap-3 border-b border-surface-700/50 bg-gradient-to-l from-accent-600 to-accent-700">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{t('components.aiAssistant.title')}</p>
                <p className="text-[10px] text-white/60">{t('components.aiAssistant.subtitle')}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ai-msg ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDelay: '0.05s' }}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-500 text-black rounded-bl-md'
                      : 'bg-surface-800 text-surface-200 border border-surface-700/50 rounded-br-md'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Wrench size={12} className="text-accent-400" />
                        <span className="text-[10px] font-bold text-accent-400">ساهل</span>
                      </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] text-surface-500 text-center">{t('components.aiAssistant.quickQuestions')}</p>
                  {quickActions.map((action) => (
                    <button
                      key={action.text}
                      onClick={() => handleQuickAction(action.text)}
                      className="w-full flex items-center gap-2.5 text-xs text-surface-300 bg-surface-800/50 border border-surface-700/30 rounded-xl px-3 py-2.5 hover:border-accent-500/30 hover:text-accent-400 hover:bg-accent-500/5 transition-all duration-200"
                    >
                      <action.icon size={14} className="text-accent-500 shrink-0" />
                      {action.text}
                    </button>
                  ))}
                </div>
              )}

              {mutation.isPending && (
                <div className="flex justify-start ai-msg">
                  <div className="bg-surface-800 border border-surface-700/50 rounded-2xl rounded-br-md px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Wrench size={12} className="text-accent-400" />
                      <span className="text-[10px] font-bold text-accent-400">{t('components.aiAssistant.name')}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-accent-400/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-2 h-2 bg-accent-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-2 h-2 bg-accent-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-surface-700/50 bg-surface-900">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('components.aiAssistant.placeholder')}
                  dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                  className="flex-1 bg-surface-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                  disabled={mutation.isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || mutation.isPending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 bg-accent-500 text-black hover:bg-accent-400 active:scale-95 shrink-0"
                >
                  {mutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
          className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-br from-accent-500 to-accent-600 ${!isOpen ? 'ai-pulse' : ''}`}
        >
          {isOpen ? (
            <X size={22} className="text-black lg:size-24" />
          ) : (
            <div className="flex flex-col items-center">
              <Bot size={24} className="text-black lg:size-7" />
            </div>
          )}
        </button>
      </div>
    </>
  );
}
