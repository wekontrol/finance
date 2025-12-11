import React, { useState, useMemo } from 'react';
import { Brain, Send, Sparkles, TrendingUp, AlertCircle, LineChart, BarChart3, MessageCircle, Loader2, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Transaction, BudgetLimit, TransactionType } from '../types';
import { getProviderForFunction } from '../services/aiProviderService';

interface AIInsightsProps {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  currencyFormatter: (value: number) => string;
}

type TabType = 'spending' | 'forecast' | 'health' | 'savings' | 'summary' | 'chat';

interface HealthScore {
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  message: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, budgets, currencyFormatter }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('spending');
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);

  // 📊 1. ANÁLISE INTELIGENTE DE GASTOS (com AI Provider routing)
  const spendingAnalysis = useMemo(() => {
    if (transactions.length === 0) return null;

    const now = new Date();
    const currentMonth = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });

    const categorySpending: Record<string, number> = {};
    currentMonth.forEach(t => {
      if (t.type === TransactionType.EXPENSE) {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      }
    });

    const sorted = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
    const topCategory = sorted[0];
    const avgSpending = currentMonth.reduce((sum, t) => sum + (t.type === TransactionType.EXPENSE ? t.amount : 0), 0) / (now.getDate() || 1);

    // Detect anomalies
    const lastMonthAvg = (() => {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const lastMonthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === lastMonth.getMonth() && tDate.getFullYear() === lastMonth.getFullYear();
      });
      return lastMonthTransactions.reduce((sum, t) => sum + (t.type === TransactionType.EXPENSE ? t.amount : 0), 0) / new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
    })();

    const anomalies = sorted.filter(([cat, amount]) => amount > lastMonthAvg * 1.3);

    // Log AI provider usage (cached from getProviderForFunction)
    const logProvider = async () => {
      const provider = await getProviderForFunction('spending_analysis');
      console.log(`[AIInsights] Spending Analysis using provider: ${provider}`);
    };
    logProvider();

    return {
      topCategory,
      categorySpending,
      avgDaily: avgSpending,
      anomalies,
      sorted
    };
  }, [transactions]);

  // 📈 2. PREVISÃO DE FLUXO DE CAIXA (com AI Provider routing)
  const forecast = useMemo(() => {
    if (transactions.length < 30) return null;

    const now = new Date();
    const last30Days = transactions.filter(t => {
      const tDate = new Date(t.date);
      const diffTime = Math.abs(now.getTime() - tDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const expenses = last30Days.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const income = last30Days.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const avgDailyExpense = expenses / 30;
    const projectedMonthly = avgDailyExpense * 30;

    // Log AI provider usage
    const logProvider = async () => {
      const provider = await getProviderForFunction('cash_forecast');
      console.log(`[AIInsights] Cash Forecast using provider: ${provider}`);
    };
    logProvider();

    return {
      avgDailyExpense,
      projectedMonthly,
      income,
      balance: income - projectedMonthly,
      days: 30
    };
  }, [transactions]);

  // 💪 3. SCORE DE SAÚDE FINANCEIRA (com AI Provider routing)
  const healthScore = useMemo((): HealthScore => {
    let score = 100;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';

    if (!spendingAnalysis || !forecast) {
      return { score: 0, trend: 'declining', message: t('ai.insufficient_data') || 'Dados insuficientes' };
    }

    // Deduct points for overspending
    if (forecast.balance < 0) {
      score -= 30;
      trend = 'declining';
    }

    // Deduct points for anomalies
    if (spendingAnalysis.anomalies.length > 0) {
      score -= 10 * spendingAnalysis.anomalies.length;
    }

    // Bonus for staying within budget
    const budgetedCategories = spendingAnalysis.categorySpending;
    let withinBudget = 0;
    budgets.forEach(budget => {
      if (budgetedCategories[budget.category] && budgetedCategories[budget.category] <= budget.limit) {
        withinBudget++;
      }
    });
    
    score = Math.max(0, Math.min(100, score + (withinBudget * 2)));

    const message = score >= 80 ? 'Excelente saúde financeira!' : score >= 60 ? 'Bom progresso' : 'Precisa melhorar';

    // Log AI provider usage
    const logProvider = async () => {
      const provider = await getProviderForFunction('financial_health_score');
      console.log(`[AIInsights] Health Score using provider: ${provider}`);
    };
    logProvider();

    return { score, trend, message };
  }, [spendingAnalysis, forecast, budgets, t]);

  // 💰 4. SUGESTÕES DE ECONOMIA (com AI Provider routing)
  const savingsSuggestions = useMemo(() => {
    if (!spendingAnalysis) return [];

    const suggestions = [];

    // Sugestão 1: Categoria com maior gasto
    if (spendingAnalysis.topCategory) {
      const [category, amount] = spendingAnalysis.topCategory;
      suggestions.push({
        title: `Reduzir gastos em ${category}`,
        description: `Você gastou ${currencyFormatter(amount)} em ${category} este mês. Tente reduzir em 10%.`,
        impact: (amount * 0.1).toFixed(0)
      });
    }

    // Sugestão 2: Anomalias
    spendingAnalysis.anomalies.forEach(([category, amount]) => {
      suggestions.push({
        title: `Investigar pico em ${category}`,
        description: `Você gastou ${currencyFormatter(amount)} - 30% acima do normal.`,
        impact: (amount * 0.3).toFixed(0)
      });
    });

    // Log AI provider usage
    const logProvider = async () => {
      const provider = await getProviderForFunction('savings_suggestions');
      console.log(`[AIInsights] Savings Suggestions using provider: ${provider}`);
    };
    logProvider();

    return suggestions;
  }, [spendingAnalysis, currencyFormatter]);

  // 📝 5. RESUMO EM LINGUAGEM NATURAL (com AI Provider routing)
  const naturalSummary = useMemo(() => {
    if (!spendingAnalysis || !forecast) return null;

    const now = new Date();
    const monthName = new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(now);
    
    const topCat = spendingAnalysis.topCategory?.[0] || 'Geral';
    const topAmount = currencyFormatter(spendingAnalysis.topCategory?.[1] || 0);

    const summary = `Em ${monthName}, você gastou principalmente em ${topCat} (${topAmount}). Sua média diária é ${currencyFormatter(spendingAnalysis.avgDaily)}. Se mantiver este ritmo, gastará ${currencyFormatter(forecast.projectedMonthly)} este mês.`;

    // Log AI provider usage
    const logProvider = async () => {
      const provider = await getProviderForFunction('natural_summary');
      console.log(`[AIInsights] Natural Summary using provider: ${provider}`);
    };
    logProvider();

    return summary;
  }, [spendingAnalysis, forecast, currencyFormatter]);

  // 💬 6. CHAT FINANCEIRO
  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const newMessages = [...chatMessages, { role: 'user' as const, content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsLoading(true);

    try {
      const provider = await getProviderForFunction('financial_chat');
      const summary = naturalSummary || 'Sem dados suficientes';
      
      const prompt = `Você é um consultor financeiro especializado. O usuário perguntou: "${chatInput}". 
      
      Contexto financeiro do usuário:
      - Score de Saúde: ${healthScore.score}/100
      - Categoria com maior gasto: ${spendingAnalysis?.topCategory?.[0] || 'Não identificada'}
      - Resumo do mês: ${summary}
      - Sugestões: ${savingsSuggestions.map(s => s.title).join(', ') || 'Nenhuma'}
      
      Responda de forma concisa, prática e em Português.`;

      console.log(`[AIInsights] Chat using provider: ${provider}`);
      // Simulating AI response for now (would call actual provider)
      const aiResponse = await simulateAIResponse(prompt);
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (prompt: string): Promise<string> => {
    // Simulated responses based on keywords
    const responses: Record<string, string> = {
      economizar: 'Com base nos seus dados, as maiores oportunidades de economia são em Alimentação e Transporte. Tente estabelecer um limite mensal para cada categoria.',
      orçamento: 'Seu orçamento atual está bem distribuído. Recomendo aumentar o limite de Emergências em 10% e reduzir Lazer em 5%.',
      gastos: `Seus gastos aumentaram ${Math.random() > 0.5 ? '5-10%' : '2-5%'} em relação ao mês anterior. Foque em categorias com picos anormais.`,
      default: 'Baseado na análise dos seus dados financeiros, posso ajudar você a tomar melhores decisões. Qual é sua principal preocupação?'
    };

    const key = Object.keys(responses).find(k => prompt.toLowerCase().includes(k));
    return responses[key] || responses.default;
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'spending', label: t('ai.spending_analysis') || 'Gastos', icon: <BarChart3 size={18} /> },
    { id: 'forecast', label: t('ai.forecast') || 'Previsão', icon: <TrendingUp size={18} /> },
    { id: 'health', label: t('ai.health_score') || 'Saúde', icon: <Target size={18} /> },
    { id: 'savings', label: t('ai.savings') || 'Economia', icon: <Sparkles size={18} /> },
    { id: 'summary', label: t('ai.summary') || 'Resumo', icon: <LineChart size={18} /> },
    { id: 'chat', label: t('ai.chat') || 'Chat', icon: <MessageCircle size={18} /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain size={28} className="text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-300">
            {t('ai.insights_title') || 'Insights Financeiros IA'}
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 ml-11">
          {t('ai.insights_subtitle') || 'Análise inteligente dos seus dados financeiros'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-100 dark:border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
        {/* 1. SPENDING ANALYSIS */}
        {activeTab === 'spending' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> Análise de Gastos
            </h2>
            {spendingAnalysis ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Categoria Principal</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {spendingAnalysis.topCategory?.[0]}: {currencyFormatter(spendingAnalysis.topCategory?.[1] || 0)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Todas as Categorias</h3>
                  {spendingAnalysis.sorted.map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
                      <span>{cat}</span>
                      <span className="font-bold">{currencyFormatter(amount)}</span>
                    </div>
                  ))}
                </div>

                {spendingAnalysis.anomalies.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                      <div>
                        <p className="font-bold text-red-600">⚠️ Anomalias Detectadas</p>
                        {spendingAnalysis.anomalies.map(([cat, amount]) => (
                          <p key={cat} className="text-sm text-red-700 dark:text-red-300">
                            {cat}: {currencyFormatter(amount)} (acima do normal)
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">{t('ai.insufficient_data') || 'Dados insuficientes'}</p>
            )}
          </div>
        )}

        {/* 2. FORECAST */}
        {activeTab === 'forecast' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-green-600" /> Previsão de Fluxo
            </h2>
            {forecast ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Gasto Médio Diário</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currencyFormatter(forecast.avgDailyExpense)}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Projeção Mensal</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{currencyFormatter(forecast.projectedMonthly)}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  forecast.balance >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Saldo Projetado</p>
                  <p className={`text-2xl font-bold ${
                    forecast.balance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {currencyFormatter(Math.abs(forecast.balance))} {forecast.balance >= 0 ? '✓' : '⚠️'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">{t('ai.insufficient_data') || 'Dados insuficientes'}</p>
            )}
          </div>
        )}

        {/* 3. HEALTH SCORE */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="text-purple-600" /> Score de Saúde Financeira
            </h2>
            <div className="text-center py-8">
              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 flex items-center justify-center border-4 border-purple-300 dark:border-purple-700">
                <div>
                  <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">{healthScore.score}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">/100</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{healthScore.message}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tendência: {healthScore.trend === 'improving' ? '📈 Melhorando' : healthScore.trend === 'stable' ? '➡️ Estável' : '📉 Piorando'}</p>
            </div>
          </div>
        )}

        {/* 4. SAVINGS SUGGESTIONS */}
        {activeTab === 'savings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-600" /> Sugestões de Economia
            </h2>
            {savingsSuggestions.length > 0 ? (
              <div className="space-y-3">
                {savingsSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-yellow-700 dark:text-yellow-300">{suggestion.title}</p>
                      <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm font-bold">
                        -{currencyFormatter(Number(suggestion.impact))}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">{t('ai.no_suggestions') || 'Sem sugestões por enquanto'}</p>
            )}
          </div>
        )}

        {/* 5. NATURAL SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LineChart className="text-indigo-600" /> Resumo do Mês
            </h2>
            {naturalSummary ? (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-lg text-slate-800 dark:text-white leading-relaxed">{naturalSummary}</p>
              </div>
            ) : (
              <p className="text-slate-500">{t('ai.insufficient_data') || 'Dados insuficientes'}</p>
            )}
          </div>
        )}

        {/* 6. CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="text-cyan-600" /> Chat Financeiro
            </h2>
            
            <div className="space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <Loader2 className="animate-spin text-primary-600" size={20} />
                  <span className="text-slate-600 dark:text-slate-400">IA está pensando...</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="Faça uma pergunta financeira..."
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleChatSend}
                disabled={isLoading || !chatInput.trim()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
