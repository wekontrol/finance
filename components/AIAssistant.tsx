import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Minimize2, X, Maximize2 } from 'lucide-react';
import { getAiChatResponseStreaming } from '../services/aiProviderService';
import { useLanguage } from '../contexts/LanguageContext';
import { Transaction, SavingsGoal } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  goals: SavingsGoal[];
  currencyFormatter: (val: number) => string;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, transactions, goals, currencyFormatter }) => {
  const { t } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: t("ai.assistant_greeting") }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    // Prepare context data summary
    const totalIncome = transactions.filter(t => t.type === 'RECEITA').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + t.amount, 0);
    const categoryData: Record<string, number> = {};
    transactions.filter(t => t.type === 'DESPESA').forEach(t => {
      categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });

    const contextData = {
      balance: currencyFormatter(totalIncome - totalExpense),
      recentTransactions: transactions.slice(0, 5).map(t => `${t.date}: ${t.description} (${currencyFormatter(t.amount)})`),
      categoryData: Object.entries(categoryData).map(([k,v]) => `${k}: ${currencyFormatter(v)}`),
      goals: goals.map(g => `${g.name}: ${currencyFormatter(g.currentAmount)} de ${currencyFormatter(g.targetAmount)}`),
    };

    try {
      let fullResponse = '';
      const responseStream = await getAiChatResponseStreaming(userMsg);
      
      // Add initial message
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);
      
      // Stream response
      for await (const chunk of responseStream) {
        fullResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'ai', content: fullResponse };
          return updated;
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: t("ai.error_processing") }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[90] md:hidden" onClick={onClose}></div>

      <div className={`
        fixed z-[100] transition-all duration-300 flex flex-col overflow-hidden 
        bg-white dark:bg-slate-800 border-t md:border border-slate-200 dark:border-slate-700 
        shadow-2xl
        
        /* Mobile: Full Screen / Sheet */
        inset-x-0 bottom-0 top-10 md:top-auto rounded-t-3xl md:rounded-3xl
        
        /* Desktop: Floating Widget */
        md:left-auto md:right-6 md:bottom-6 md:w-96
        
        ${isMinimized && window.innerWidth >= 768
          ? 'md:h-16' 
          : 'h-[calc(100%-40px)] md:h-[550px]'
        }
      `}>
        
        {/* Header */}
        <div 
          className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center cursor-pointer shrink-0" 
          onClick={() => window.innerWidth >= 768 && setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center text-white">
            <Sparkles size={18} className="mr-2 text-yellow-300" />
            <h3 className="font-bold">{t("ai.assistant_title")}</h3>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <button 
              className="hidden md:block hover:text-white"
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button 
              className="hover:text-white p-1"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {(!isMinimized || window.innerWidth < 768) && (
          <>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((msg, idx) => (
                <div key={`msg-${msg.role}-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-600'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-600">
                     <Loader2 size={16} className="animate-spin text-indigo-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2 shrink-0 pb-safe">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("ai.placeholder_question")}
                className="flex-1 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                autoFocus={window.innerWidth >= 768} // Only autofocus on desktop to prevent keyboard jump on mobile open
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default AIAssistant;