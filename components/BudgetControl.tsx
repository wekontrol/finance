
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, BudgetLimit } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { PieChart, Save, AlertTriangle, CheckCircle, Edit3, Sparkles, Loader2, Plus, X, History, Calendar, Trash2 } from 'lucide-react';
import Hint from './Hint';
import { suggestBudgets } from '../services/geminiService';
import { budgetApi } from '../services/api';

interface BudgetControlProps {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  saveBudget: (budget: BudgetLimit) => void;
  currencyFormatter: (value: number) => string;
}

interface HistoryEntry {
  category: string;
  limit: number;
  spent: number;
}

const BudgetControl: React.FC<BudgetControlProps> = ({ 
  transactions, 
  budgets, 
  saveBudget,
  currencyFormatter 
}) => {
  const { t } = useLanguage();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [budgetHistory, setBudgetHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Get all existing budget categories for current user
  const existingBudgetCategories = useMemo(() => {
    return new Set(budgets.map(b => b.category));
  }, [budgets]);

  const categorySpending = useMemo(() => {
    const now = new Date();
    const spending: Record<string, number> = {};
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (t.type === TransactionType.EXPENSE && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      }
    });
    return spending;
  }, [transactions]);

  const handleEdit = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditAmount(currentLimit.toString());
  };

  const handleSave = (category: string) => {
    saveBudget({ category, limit: Number(editAmount) });
    setEditingCategory(null);
  };

  const handleAiSuggestion = async () => {
    setIsSuggesting(true);
    try {
      const suggestions = await suggestBudgets(transactions);
      if (suggestions.length === 0) {
        alert(t("ai.no_sufficient_data"));
        return;
      }

      const confirm = window.confirm(
        `${t("ai.suggested_budgets")} ${suggestions.length} ${t("ai.based_on_history")}?\n\n` + 
        suggestions.map(s => `${s.category}: ${currencyFormatter(s.limit)}`).join('\n')
      );

      if (confirm) {
        suggestions.forEach(s => saveBudget(s));
      }
    } catch (e) {
      alert(t("ai.error_generating_suggestions"));
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleDeleteBudget = async (category: string) => {
    const isDefault = budgets.find(b => b.category === category && (b as any).isDefault);
    
    if (isDefault) {
      alert(t("budget.cannot_delete_default"));
      return;
    }

    const confirm = window.confirm(`${t("budget.confirm_delete")} "${category}"?\n\n${t("budget.delete_warning")}`);
    if (!confirm) return;

    try {
      const response = await fetch(`/api/budget/limits/${encodeURIComponent(category)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(t("budget.delete_success"));
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        alert(t("budget.delete_error") + ': ' + (errorData?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert(t("budget.delete_error") + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleAddNewBudget = () => {
    if (!newCategory.trim() || !newAmount.trim()) {
      alert(t("budget.define_category_value"));
      return;
    }

    if (existingBudgetCategories.has(newCategory.trim())) {
      alert(t("budget.already_exists") + ` "${newCategory}"`);
      return;
    }
    
    const amount = Number(newAmount);
    if (amount <= 0) {
      alert(t("budget.value_greater_than_zero"));
      return;
    }

    saveBudget({ category: newCategory.trim(), limit: amount });
    setNewCategory('');
    setNewAmount('');
    setIsAddingNew(false);
  };

  const loadHistory = async () => {
    try {
      const data = await budgetApi.getHistory();
      setBudgetHistory(data);
      const months = Object.keys(data).sort().reverse();
      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleSaveHistory = async () => {
    try {
      const result = await budgetApi.saveHistory();
      alert(result.message);
      loadHistory();
    } catch (error: any) {
      alert('Erro ao salvar histórico: ' + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
         <div className="absolute -right-8 -top-8 md:-right-16 md:-top-16 w-48 h-48 md:w-64 md:h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
         <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold flex items-center mb-2">
                <PieChart className="mr-3" /> {t("budget.monthly_budget")}
                <Hint text="Defina um teto máximo de gastos para cada categoria. O app te avisa quando você estiver perto de estourar o limite." className="text-white ml-3" />
              </h2>
              <p className="text-blue-100 font-medium max-w-xl text-sm md:text-base">Defina tetos de gastos para cada categoria. Manter-se dentro do orçamento é o primeiro passo para a liberdade financeira.</p>
            </div>
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <button 
                onClick={() => {
                  setShowHistory(true);
                  loadHistory();
                }}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 md:px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/30 transition text-sm md:text-base"
              >
                <History size={18} />
                {t("common.history")}
              </button>
              <button 
                data-tour="ai-budget-suggest"
                onClick={handleAiSuggestion}
                disabled={isSuggesting}
                className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 md:px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/30 transition disabled:opacity-70 text-sm md:text-base"
              >
                {isSuggesting ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-yellow-300" />}
                {t("budget.suggest_ai")}
              </button>
            </div>
         </div>
      </div>

      {/* Visualizar Histórico */}
      {showHistory && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 p-6 animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <History size={20} className="text-primary-600" />
              {t("budget.history")}
            </h3>
            <button 
              onClick={() => setShowHistory(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Seletor de Mês */}
            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">{t("budget.select_month")}:</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              >
                <option value="">{t("budget.choose_month")}...</option>
                {Object.keys(budgetHistory).sort().reverse().map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Dados do Mês Selecionado */}
            {selectedMonth && budgetHistory[selectedMonth] && (
              <div className="space-y-3">
                {budgetHistory[selectedMonth].map((item) => {
                  const percentage = item.limit > 0 ? (item.spent / item.limit) * 100 : 0;
                  const isOverBudget = item.limit > 0 && item.spent > item.limit;
                  
                  return (
                    <div key={item.category} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white">{item.category}</h4>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isOverBudget ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400">{t("budget.limit")}: <span className="font-bold">{item.limit.toFixed(2)} Kz</span></span>
                        <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                          {t("budget.spent")}: {item.spent.toFixed(2)} Kz
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 transition-all duration-300 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {Object.keys(budgetHistory).length === 0 && (
              <p className="text-center text-slate-400 py-8">{t("budget.no_history")}</p>
            )}

            <button 
              onClick={handleSaveHistory}
              className="w-full p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {t("budget.save_current_history")}
            </button>
          </div>
        </div>
      )}

      {/* Adicionar Novo Orçamento */}
      {isAddingNew && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 p-6 animate-slide-in-left">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4 flex items-center gap-2">
            <Plus size={20} className="text-primary-600" />
            {t("budget.new_budget")}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">{t("budget.category_name")}</label>
              <input 
                type="text" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={t("budget.placeholder")}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("budget.unique_category_hint")}
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">{t("budget.monthly_limit")}</label>
              <input 
                type="number" 
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {newAmount && (
                <p className="text-right text-xs font-bold text-primary-600 dark:text-primary-400 mt-1">
                  {currencyFormatter(Number(newAmount))}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAddNewBudget}
                className="flex-1 p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {t("budget.create_budget")}
              </button>
              <button 
                onClick={() => {
                  setIsAddingNew(false);
                  setNewCategory('');
                  setNewAmount('');
                }}
                className="flex-1 p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition flex items-center justify-center gap-2"
              >
                <X size={18} />
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="budget-cards">
        {/* Botão Flutuante para Adicionar */}
        {!isAddingNew && (
          <button 
            onClick={() => setIsAddingNew(true)}
            className="h-full min-h-[280px] bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-primary-100/50 dark:to-primary-900/10 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-3xl flex flex-col items-center justify-center hover:border-primary-500 dark:hover:border-primary-500 transition hover:shadow-md dark:hover:shadow-primary-500/20"
          >
            <Plus size={40} className="text-primary-500 mb-2" />
            <span className="font-bold text-primary-600 dark:text-primary-400">{t("budget.add_budget")}</span>
          </button>
        )}

        {budgets.map(budget => {
          const limit = budget.limit;
          const cat = budget.category;
          const isDefault = (budget as any).isDefault || false;
          const spent = categorySpending[cat] || 0;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const isOverBudget = limit > 0 && spent > limit;
          const isNearLimit = limit > 0 && spent > limit * 0.9 && !isOverBudget;

          return (
            <div key={cat} className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 p-4 sm:p-6 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300">
              <div>
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base md:text-lg line-clamp-2 break-words">{cat}</h3>
                    {isDefault && <span className="text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full whitespace-nowrap flex-shrink-0">{t("budget.default")}</span>}
                  </div>
                  {isOverBudget && <AlertTriangle className="text-rose-500 animate-pulse" size={22} />}
                  {!isOverBudget && limit > 0 && <CheckCircle className="text-emerald-500" size={22} />}
                </div>

                <div className="flex justify-between items-end mb-2 gap-2 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <span className="text-slate-600 dark:text-slate-400 text-xs uppercase">{t("budget.spent")}</span>
                    <span className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate ${isOverBudget ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                      {currencyFormatter(spent)}
                    </span>
                  </div>
                  <div className="text-right flex flex-col min-w-0">
                    <span className="text-slate-600 dark:text-slate-400 text-xs uppercase">{t("budget.target")}</span>
                    <span className="block text-slate-400 font-medium text-xs sm:text-sm truncate">
                      {currencyFormatter(limit)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 mb-6 overflow-hidden">
                  <div 
                    className={`h-4 rounded-full transition-all duration-700 ease-out ${
                      isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="border-t border-slate-50 dark:border-slate-700 pt-3 sm:pt-4 space-y-2">
                {editingCategory === cat ? (
                  <div className="flex items-center space-x-2 animate-fade-in gap-1 sm:gap-2">
                    <div className="flex-1 flex flex-col min-w-0">
                      <input 
                        type="number" 
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        autoFocus
                        placeholder={t("budget.new_limit_placeholder")}
                      />
                      {editAmount && (
                        <p className="text-right text-xs font-bold text-primary-600 dark:text-primary-400 mt-1 truncate">
                          {currencyFormatter(Number(editAmount))}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleSave(cat)}
                      className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow flex-shrink-0"
                    >
                      <Save size={16} className="sm:w-18" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center gap-2 min-w-0">
                    <button 
                      onClick={() => handleEdit(cat, limit)}
                      className="flex items-center text-xs sm:text-sm font-bold text-slate-400 hover:text-primary-600 transition truncate"
                    >
                      <Edit3 size={14} className="sm:w-16 mr-1 flex-shrink-0" />
                      <span className="hidden sm:inline">{limit === 0 ? t("budget.set_limit") : t("budget.adjust_target")}</span>
                      <span className="sm:hidden">{limit === 0 ? t("budget.set_limit") : t("budget.adjust_target")}</span>
                    </button>
                    {!isDefault && (
                      <button 
                        onClick={() => handleDeleteBudget(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg flex-shrink-0"
                        title={t("budget.delete")}
                      >
                        <Trash2 size={14} className="sm:w-16" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetControl;
