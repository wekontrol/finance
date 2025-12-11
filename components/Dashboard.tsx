
import React, { useMemo, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, Sector
} from 'recharts';
import { Transaction, TransactionType, SavingsGoal, BudgetLimit, UserBehaviorAnalysis } from '../types';
import { TrendingUp, TrendingDown, Calendar, Sparkles, ArrowUpRight, ArrowDownRight, Wallet, BrainCircuit, Lightbulb, User, PieChart as PieChartIcon, Download, Bell, X } from 'lucide-react';
import { getFinancialAdvice, analyzeUserBehavior, analyzeExpensesForWaste, predictFutureExpenses } from '../services/aiProviderService';
import { generatePDFReport, generateAnalysisPDF } from '../services/reportService';
import Hint from './Hint';
import AlertsPanel from './AlertsPanel';
import CategoryBreakdown from './CategoryBreakdown';
import NotificationSettings from './NotificationSettings';

interface DashboardProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgets: BudgetLimit[]; 
  currencyFormatter: (value: number) => string;
  currentInflation?: number;
  currentUser?: any;
  darkMode?: boolean;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#06b6d4', '#84cc16'];

type DateRange = '7days' | 'month' | 'year' | 'all';

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  savingsGoals, 
  budgets = [], 
  currencyFormatter,
  currentInflation = 0,
  currentUser,
  darkMode = false
}) => {
  const { t, language } = useLanguage();
  const [advice, setAdvice] = useState<string>(t("dashboard.analyzing"));
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [showAlerts, setShowAlerts] = useState(true);
  
  const [behavior, setBehavior] = useState<UserBehaviorAnalysis | null>(null);
  const [isAnalyzingBehavior, setIsAnalyzingBehavior] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [waste, setWaste] = useState<any>(null);
  const [isAnalyzingWaste, setIsAnalyzingWaste] = useState(false);
  const [forecast, setForecast] = useState<any>(null);
  const [isAnalyzingForecast, setIsAnalyzingForecast] = useState(false);

  // Custom Tooltips
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 min-w-[200px] animate-scale-in">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">{label}</p>
          <div className="space-y-3">
            {payload.map((entry: any) => (
              <div key={entry.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm" style={{ backgroundColor: entry.stroke }} />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className={`text-sm font-extrabold tabular-nums ${entry.name === 'Receitas' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {currencyFormatter(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = categoryData.reduce((acc, curr) => acc + curr.value, 0);
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 animate-scale-in">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm" style={{ backgroundColor: data.payload.fill }} />
            <span className="text-sm font-bold text-slate-700 dark:text-white">{data.name}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
              {currencyFormatter(data.value)}
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              {percent}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    getFinancialAdvice(transactions, savingsGoals, language).then(setAdvice);
  }, [transactions, savingsGoals, language]);

  const handleAnalyzeBehavior = async () => {
    setIsAnalyzingBehavior(true);
    try {
      const result = await analyzeUserBehavior(transactions, language);
      setBehavior(result);
    } catch (e) {
      alert(t("dashboard.error_analyzing_behavior"));
    } finally {
      setIsAnalyzingBehavior(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      switch (dateRange) {
        case '7days':
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return tDate >= sevenDaysAgo;
        case 'month':
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        case 'year':
          return tDate.getFullYear() === now.getFullYear();
        case 'all':
        default:
          return true;
      }
    });
    return filtered;
  }, [transactions, dateRange]);

  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => {
        const type = String(t.type).toUpperCase();
        return type === 'RECEITA' || t.type === TransactionType.INCOME;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter(t => {
        const type = String(t.type).toUpperCase();
        return type === 'DESPESA' || t.type === TransactionType.EXPENSE;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalSavings = savingsGoals.reduce((acc, curr) => acc + curr.currentAmount, 0);

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, totalSavings };
  }, [filteredTransactions, savingsGoals]);

  const healthScore = useMemo(() => {
    const allIncome = transactions.filter(t => {
    const type = String(t.type).toUpperCase();
    return type === 'RECEITA' || t.type === TransactionType.INCOME;
  }).reduce((acc, t) => acc + t.amount, 0);
  
  const allExpense = transactions.filter(t => {
    const type = String(t.type).toUpperCase();
    return type === 'DESPESA' || t.type === TransactionType.EXPENSE;
  }).reduce((acc, t) => acc + t.amount, 0);
    const allSavings = savingsGoals.reduce((acc, t) => acc + t.currentAmount, 0);
    
    if (allIncome === 0) return 0;

    const savingsRate = (allSavings / allIncome) * 100;
    const savingsScore = Math.min(100, (savingsRate / 20) * 100) * 0.4;

    const expenseRatio = (allExpense / allIncome) * 100;
    const expenseScore = expenseRatio > 90 ? 0 : Math.min(100, (1 - (expenseRatio - 50)/50) * 100) * 0.3; 

    const goalsOnTrack = savingsGoals.filter(g => g.currentAmount > 0).length;
    const goalsScore = savingsGoals.length > 0 ? (goalsOnTrack / savingsGoals.length) * 100 * 0.3 : 0;

    return Math.min(100, Math.round(savingsScore + (expenseScore > 0 ? expenseScore : 0) + goalsScore));
  }, [transactions, savingsGoals]);

  const healthData = [{ name: 'Score', value: healthScore, fill: healthScore > 70 ? '#10b981' : healthScore > 40 ? '#f59e0b' : '#ef4444' }];

  const barChartData = useMemo(() => {
    const dataMap = new Map<string, { income: number, expense: number, date: Date }>();

    filteredTransactions.forEach(t => {
      const tDate = new Date(t.date);
      let key = '';
      if (dateRange === 'year' || dateRange === 'all') {
        key = tDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      } else {
        key = tDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }

      if (!dataMap.has(key)) {
        dataMap.set(key, { income: 0, expense: 0, date: tDate });
      }

      const entry = dataMap.get(key)!;
      const type = String(t.type).toUpperCase();
      if (type === 'RECEITA' || t.type === TransactionType.INCOME) entry.income += t.amount;
      else entry.expense += t.amount;
    });

    return Array.from(dataMap.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([name, val]) => ({
        name,
        Receitas: val.income,
        Despesas: val.expense
      }));

  }, [filteredTransactions, dateRange]);

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => {
      const type = String(t.type).toUpperCase();
      return type === 'DESPESA' || t.type === TransactionType.EXPENSE;
    });
    const catMap = new Map<string, number>();
    expenses.forEach(t => {
      catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
    });
    return Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by highest expense
      .map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const getRangeLabel = () => {
    switch(dateRange) {
      case '7days': return t('dashboard.last7days');
      case 'month': return t('dashboard.thisMonth');
      case 'year': return t('dashboard.thisYear');
      case 'all': return t('dashboard.allTime');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">{t('dashboard.overview')}</h3>
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">{t('dashboard.financial_health')}</p>
        </div>
        <div className="flex items-center gap-1 md:gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            className="p-2 md:p-2.5 bg-white dark:bg-slate-800 rounded-lg md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition text-slate-600 dark:text-slate-300"
            title={t("dashboard.notification_preferences")}
          >
            <Bell size={18} className="md:w-5 md:h-5" />
          </button>
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg md:rounded-2xl p-1 md:p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 flex-1 sm:flex-none hover:border-primary-400 transition-colors">
          <Calendar size={14} className="md:w-4 md:h-4 text-primary-500 ml-1 md:ml-2 mr-1 md:mr-2 shrink-0" />
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="bg-transparent border-none text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none py-1 w-full"
          >
            <option value="7days">{t('dashboard.last_7_days')}</option>
            <option value="month">{t('dashboard.this_month')}</option>
            <option value="year">{t('dashboard.this_year')}</option>
            <option value="all">{t('dashboard.all_time')}</option>
          </select>
          </div>
        </div>
      </div>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 animate-slide-in-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1 md:gap-2 truncate">
              <Bell size={18} className="md:w-5 md:h-5 text-primary-600 flex-shrink-0" />
              <span className="truncate">{t('dashboard.myNotifications')}</span>
            </h3>
            <button onClick={() => setShowNotificationSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
              <X size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
          <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
        </div>
      )}

      {/* AI Behavior Analysis Widget */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden min-w-0">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
         
         <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
              <div className="max-w-full min-w-0">
                <h3 className="text-sm sm:text-base md:text-lg font-bold flex items-center gap-2 truncate">
                  <BrainCircuit className="text-cyan-400 shrink-0" size={18} /> <span className="truncate">{t('dashboard.behavioral_analysis')}</span>
                  <Hint text={t("dashboard.hint_analyze_behavior")} className="text-white ml-2 hidden sm:inline-block" />
                </h3>
                <p className="text-blue-200 text-sm mt-1 truncate max-w-full">{t("dashboard.discover_spending_profile")}</p>
              </div>
              {!behavior && (
                <button 
                  onClick={handleAnalyzeBehavior}
                  disabled={isAnalyzingBehavior}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold text-sm transition flex items-center whitespace-nowrap border border-white/10 active:scale-95"
                >
                  {isAnalyzingBehavior ? <Sparkles className="animate-spin mr-2" size={16}/> : <Sparkles className="mr-2 text-yellow-300" size={16}/>}
                  {isAnalyzingBehavior ? t('dashboard.analyzing_dot') : t('dashboard.analyzeBehavior')}
                </button>
              )}
            </div>

            {behavior && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-scale-in bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                 <div className="flex flex-col items-center justify-center text-center p-2 md:border-r border-white/10">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-2 text-cyan-300">
                       <User size={24} />
                    </div>
                    <p className="text-xs uppercase font-bold text-cyan-300">{t("dashboard.your_persona")}</p>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold break-words line-clamp-2">{behavior.persona}</p>
                 </div>
                 
                 <div className="flex flex-col justify-center md:border-r border-white/10 px-2 md:px-4 py-2 md:py-0 border-t border-b md:border-t-0 md:border-b-0 border-white/10 my-2 md:my-0">
                    <p className="text-xs uppercase font-bold text-yellow-300 mb-1 flex items-center"><Lightbulb size={12} className="mr-1"/> {t("dashboard.detected_pattern")}</p>
                    <p className="text-sm font-medium leading-relaxed break-words">"{behavior.patternDescription}"</p>
                    <p className="text-xs text-blue-200 mt-2 break-words">{t("dashboard.tip")}: {behavior.tip}</p>
                 </div>

                 <div className="flex flex-col justify-center items-center px-4">
                    <p className="text-xs uppercase font-bold text-emerald-300 mb-1 text-center">{t("dashboard.next_month_projection")}</p>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-tight break-words text-center min-w-0">{currencyFormatter(behavior.nextMonthProjection)}</p>
                    <p className="text-[10px] text-blue-200">{t("dashboard.estimated_by_ai")}</p>
                 </div>
              </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Premium Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="dashboard-cards">
          {/* Saldo */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden min-w-0 transition-all duration-300 border border-indigo-400/30 hover:border-indigo-300/60 group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Wallet className="text-white" size={24} />
              </div>
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-lg text-white">
                {getRangeLabel()}
              </span>
            </div>
            <p className="text-indigo-100 text-sm font-medium mb-1">{t('dashboard.balance_liquid')}</p>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-tight break-words min-w-0" title={currencyFormatter(summary.balance)}>
              {currencyFormatter(summary.balance)}
            </h3>
          </div>

          {/* Receitas */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-soft border border-slate-100 dark:border-slate-700 relative group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 min-w-0">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <ArrowUpRight className="text-emerald-500" size={20} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{t('dashboard.income')}</p>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800 dark:text-white break-words min-w-0" title={currencyFormatter(summary.totalIncome)}>
              {currencyFormatter(summary.totalIncome)}
            </h3>
          </div>

          {/* Despesas */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-soft border border-slate-100 dark:border-slate-700 relative group hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-300 min-w-0">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <TrendingDown size={24} />
              </div>
              <ArrowDownRight className="text-rose-500" size={20} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{t('dashboard.expenses')}</p>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800 dark:text-white break-words min-w-0" title={currencyFormatter(summary.totalExpense)}>
              {currencyFormatter(summary.totalExpense)}
            </h3>
          </div>
        </div>

        {/* Financial Health Score Widget */}
        <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-soft border transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden h-[180px] md:h-[200px] group ${healthScore > 70 ? 'border-emerald-200 dark:border-emerald-900/30 hover:border-emerald-300' : healthScore > 40 ? 'border-amber-200 dark:border-amber-900/30 hover:border-amber-300' : 'border-rose-200 dark:border-rose-900/30 hover:border-rose-300'}`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r transition-all duration-300 ${healthScore > 70 ? 'from-emerald-400 to-emerald-500' : healthScore > 40 ? 'from-amber-400 to-amber-500' : 'from-rose-400 to-rose-500'}`}></div>
            
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex-1 flex flex-col items-center justify-center">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center z-10 w-full justify-center text-center">
                  💰 Score
                </h3>
                <div className="animate-bounce-in">
                   <span className={`text-base sm:text-lg md:text-2xl lg:text-3xl font-extrabold transition-colors duration-300 break-words min-w-0 ${healthScore > 70 ? 'text-emerald-500' : healthScore > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                     {healthScore}
                   </span>
                   <span className="text-[10px] text-slate-400 block font-bold">/ 100</span>
                </div>
              </div>
              
              <div className="flex-1 text-center z-10">
                 <p className={`text-[10px] md:text-xs font-bold py-1.5 px-2 rounded-full bg-gradient-to-r transition-all duration-300 ${healthScore > 70 ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-300' : healthScore > 40 ? 'from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/20 text-amber-700 dark:text-amber-300' : 'from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
                   {healthScore > 80 ? t('dashboard.score_excellent') : healthScore > 50 ? t('dashboard.score_good') : t('dashboard.score_critical')}
                 </p>
                 <p className="text-[9px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">{t('dashboard.savings_percentage')}<br/>{t('dashboard.expense_percentage')}<br/>{t('dashboard.goals_percentage')}</p>
              </div>
            </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Insight */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-slate-900 rounded-3xl p-1 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="bg-white/5 backdrop-blur-sm p-4 md:p-6 rounded-[20px]">
             <h3 className="font-bold text-lg mb-2 flex items-center text-white">
              <Sparkles className="mr-2 text-yellow-300 animate-pulse shrink-0" size={20} /> {t('dashboard.intelligent_insight')}
            </h3>
            <p className="text-slate-200 leading-relaxed font-light text-sm md:text-base break-words">"{advice}"</p>
          </div>
        </div>

        {/* Waste Analysis */}
        <div className="bg-gradient-to-r from-rose-900 to-red-800 dark:from-rose-900 dark:to-red-900 rounded-3xl p-1 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500"></div>
          <div className="bg-white/5 backdrop-blur-sm p-4 md:p-6 rounded-[20px]">
            <h3 className="font-bold text-lg mb-3 flex items-center text-white justify-between">
              <span className="flex items-center"><TrendingDown className="mr-2 text-rose-300 animate-pulse shrink-0" size={20} /> {t('dashboard.waste_analysis')}</span>
              <button onClick={async () => { setIsAnalyzingWaste(true); const w = await analyzeExpensesForWaste(transactions, language); setWaste(w); setIsAnalyzingWaste(false); }} disabled={isAnalyzingWaste} className="text-xs bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded disabled:opacity-50">
                {isAnalyzingWaste ? t('dashboard.analyzing_dot') : t('dashboard.analyzeWaste')}
              </button>
            </h3>
            {waste ? (
              <div className="space-y-2 text-sm">
                <p className="text-rose-200 font-semibold">{t('dashboard.waste_indicators')}:</p>
                <ul className="text-slate-300 text-xs space-y-1 list-disc list-inside">{waste.wasteIndicators?.slice(0, 3).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
                <p className="text-rose-300 font-bold pt-2">{t('dashboard.waste_estimate')} {currencyFormatter(waste.totalWaste || 0)}</p>
                <button onClick={() => generateAnalysisPDF(waste, forecast, currencyFormatter, currentUser)} className="mt-2 text-xs bg-rose-500/30 hover:bg-rose-500/50 px-2 py-1 rounded text-rose-200 font-bold">📥 Exportar</button>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">{t('dashboard.click_analyze')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 dark:from-emerald-900 dark:to-teal-900 rounded-3xl p-1 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <div className="bg-white/5 backdrop-blur-sm p-4 md:p-6 rounded-[20px]">
          <h3 className="font-bold text-lg mb-3 flex items-center text-white justify-between">
            <span className="flex items-center"><TrendingUp className="mr-2 text-emerald-300 animate-pulse shrink-0" size={20} /> {t('dashboard.financial_forecast')}</span>
            <button onClick={async () => { setIsAnalyzingForecast(true); const f = await predictFutureExpenses(transactions, 3, language); setForecast(f); setIsAnalyzingForecast(false); }} disabled={isAnalyzingForecast} className="text-xs bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded disabled:opacity-50">
              {isAnalyzingForecast ? t('dashboard.predicting') : t('dashboard.forecast')}
            </button>
          </h3>
          {forecast?.predictions?.length > 0 ? (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                {forecast.predictions.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="bg-white/10 p-2 rounded">
                    <p className="text-emerald-300 font-bold text-xs">{p.month}</p>
                    <p className="text-slate-200 font-semibold">{currencyFormatter(p.predictedExpense || 0)}</p>
                  </div>
                ))}
              </div>
              <p className="text-slate-300 text-xs pt-2">{t('dashboard.confidence_label')} <span className="text-emerald-300 font-bold">{forecast.confidence || 0}%</span> • {forecast.notes}</p>
              <button onClick={() => generateAnalysisPDF(waste, forecast, currencyFormatter, currentUser)} className="mt-2 text-xs bg-emerald-500/30 hover:bg-emerald-500/50 px-2 py-1 rounded text-emerald-200 font-bold">📥 Exportar</button>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">{t('dashboard.click_forecast')}</p>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 min-h-[400px]">
          <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white flex items-center">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></div>
            {t('dashboard.cash_flow')}
          </h3>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#475569" : "#e2e8f0"} opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={darkMode ? "#94a3b8" : "#64748b"} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                  minTickGap={20}
                />
                <YAxis 
                  stroke={darkMode ? "#94a3b8" : "#64748b"} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} 
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="Receitas" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Despesas" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 min-h-[400px]">
          <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white flex items-center">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full mr-3"></div>
            {t('dashboard.by_category')}
          </h3>
          {categoryData.length > 0 ? (
            <div className="h-64 md:h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    cornerRadius={5}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend with scrollable area if needed */}
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 max-h-[100px] overflow-y-auto scrollbar-thin">
                 {categoryData.map((entry, index) => (
                   <div key={index} className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                     <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                     <span className="truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            <div className="h-64 md:h-80 flex flex-col items-center justify-center text-slate-400">
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-full mb-3">
                <PieChartIcon size={32} />
              </div>
              <p>{t("common.no_data_period")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
