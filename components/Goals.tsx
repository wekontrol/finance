
import React, { useState, useMemo } from 'react';
import { SavingsGoal, GoalTransaction, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Trash2, Target, ArrowLeft, TrendingUp, Calendar, Info, MinusCircle, PlusCircle, TrendingDown, Edit2, X, Save } from 'lucide-react';
import { 
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Scatter 
} from 'recharts';

interface GoalsProps {
  goals: SavingsGoal[];
  addGoal: (g: Omit<SavingsGoal, 'id'>) => void;
  deleteGoal: (id: string) => void;
  addContribution: (id: string, amount: number, note?: string) => void;
  editContribution: (goalId: string, contribution: GoalTransaction) => void;
  deleteContribution: (goalId: string, contributionId: string) => void;
  currencyFormatter: (value: number) => string;
  currentUser: User;
}

type TransactionType = 'deposit' | 'withdraw';

const Goals: React.FC<GoalsProps> = ({ 
  goals, 
  addGoal, 
  deleteGoal, 
  addContribution,
  editContribution,
  deleteContribution,
  currencyFormatter,
  currentUser
}) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('deposit');
  const [editingHistoryItem, setEditingHistoryItem] = useState<GoalTransaction | null>(null);
  const [historyEditForm, setHistoryEditForm] = useState({ amount: '', date: '', note: '' });
  const [newGoal, setNewGoal] = useState({
    name: '', targetAmount: '', deadline: '', color: '#8b5cf6', initialAmount: '', interestRate: ''
  });

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal({
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      currentAmount: Number(newGoal.initialAmount) || 0,
      deadline: newGoal.deadline,
      color: newGoal.color,
      interestRate: Number(newGoal.interestRate) || 0,
      history: []
    });
    setShowForm(false);
    setNewGoal({ name: '', targetAmount: '', deadline: '', color: '#8b5cf6', initialAmount: '', interestRate: '' });
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoalId && transactionAmount) {
      const value = Number(transactionAmount);
      if (transactionType === 'withdraw' && selectedGoal && value > selectedGoal.currentAmount) {
        alert(t("goals.insufficient_balance"));
        return;
      }
      const finalAmount = transactionType === 'withdraw' ? -value : value;
      const defaultNote = transactionNote || (transactionType === 'withdraw' ? 'Resgate' : 'Depósito');
      addContribution(selectedGoalId, finalAmount, defaultNote);
      setTransactionAmount(''); setTransactionNote(''); setTransactionType('deposit');
    }
  };

  const handleEditClick = (item: GoalTransaction) => {
    setEditingHistoryItem(item);
    setHistoryEditForm({ amount: Math.abs(item.amount).toString(), date: item.date, note: item.note || '' });
  };

  const handleHistoryEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistoryItem || !selectedGoalId) return;
    const isOriginallyNegative = editingHistoryItem.amount < 0;
    let newAmount = Number(historyEditForm.amount);
    if (isOriginallyNegative) newAmount = -Math.abs(newAmount);
    else newAmount = Math.abs(newAmount);
    editContribution(selectedGoalId, { ...editingHistoryItem, amount: newAmount, date: historyEditForm.date, note: historyEditForm.note });
    setEditingHistoryItem(null);
  };

  const chartData = useMemo(() => {
    if (!selectedGoal) return [];
    const sortedHistory = [...selectedGoal.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningTotal = 0;
    const data = sortedHistory.map(item => {
      runningTotal += item.amount;
      return {
        date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        amount: runningTotal,
        deposit: item.amount > 0 ? item.amount : null,
        withdrawal: item.amount < 0 ? Math.abs(item.amount) : null,
        note: item.note
      };
    });
    if (data.length === 0) return [{ date: 'Início', amount: 0, deposit: null, withdrawal: null, note: '' }];
    return data;
  }, [selectedGoal]);

  if (selectedGoal) {
    const percentage = selectedGoal.targetAmount > 0 
      ? Math.min(100, (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100) 
      : 0;
    
    return (
      <div className="space-y-8 animate-fade-in pb-10 w-full max-w-full overflow-hidden">
        <button 
          onClick={() => setSelectedGoalId(null)}
          className="flex items-center text-slate-500 hover:text-primary-600 transition font-semibold bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm active:scale-95"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t("common.back")}
        </button>

        {editingHistoryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700 animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t("goals.edit_record")}</h3>
                <button onClick={() => setEditingHistoryItem(null)} className="active:scale-95 transition-transform"><X size={24} className="text-slate-400" /></button>
              </div>
              <form onSubmit={handleHistoryEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("common.value")}</label>
                  <input type="number" step="0.01" required min="0" value={historyEditForm.amount} onChange={e => setHistoryEditForm({...historyEditForm, amount: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("common.date")}</label>
                  <input type="date" required value={historyEditForm.date} onChange={e => setHistoryEditForm({...historyEditForm, date: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("common.note")}</label>
                  <input type="text" value={historyEditForm.note} onChange={e => setHistoryEditForm({...historyEditForm, note: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setEditingHistoryItem(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl active:scale-95 transition-transform">{t("common.cancel")}</button>
                  <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold active:scale-95 transition-transform">{t("common.save")}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: Card Info */}
           <div className="lg:col-span-1 space-y-6">
             <div 
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${selectedGoal.color}, #1e293b)` }}
             >
               <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-white opacity-10 rounded-full blur-3xl -mr-6 -mt-6 md:-mr-10 md:-mt-10 pointer-events-none"></div>
               <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                   <Target size={32} />
                 </div>
                 {selectedGoal.interestRate && (
                   <span className="bg-emerald-500/20 text-emerald-100 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/30 whitespace-nowrap">
                     +{selectedGoal.interestRate}% a.a.
                   </span>
                 )}
               </div>
               <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 tracking-tight truncate line-clamp-2">{selectedGoal.name}</h2>
               <p className="text-white/70 mb-8 text-sm font-medium">{t("goals.target")}: {new Date(selectedGoal.deadline).toLocaleDateString('pt-BR')}</p>
               
               <div className="mb-2 flex justify-between items-end">
                 <span className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold tracking-tight break-words min-w-0">{currencyFormatter(selectedGoal.currentAmount)}</span>
               </div>
               <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                 <div style={{ width: `${percentage}%` }} className="bg-white h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
               </div>
               <div className="flex justify-between text-xs font-medium text-white/60">
                 <span>{percentage.toFixed(0)}%</span>
                 <span className="truncate ml-2">{t("goals.goal")}: {currencyFormatter(selectedGoal.targetAmount)}</span>
               </div>
             </div>

             {/* Transaction Input */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700">
               <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t("goals.new_entry")}</h3>
               <div className="flex p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-4">
                 <button onClick={() => setTransactionType('deposit')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${transactionType === 'deposit' ? 'bg-white dark:bg-slate-600 shadow text-emerald-600' : 'text-slate-500'}`}>{t("goals.deposit")}</button>
                 <button onClick={() => setTransactionType('withdraw')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${transactionType === 'withdraw' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-slate-500'}`}>{t("goals.withdrawal")}</button>
               </div>
               <form onSubmit={handleTransactionSubmit} className="space-y-3">
                 <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">Kz</span>
                    <input type="number" required min="0" step="0.01" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} className="w-full pl-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 tabular-nums" placeholder="0.00" />
                 </div>
                 {transactionAmount && (
                    <p className="text-right text-xs font-bold text-primary-600 dark:text-primary-400">
                      {currencyFormatter(Number(transactionAmount))}
                    </p>
                 )}
                 <input type="text" value={transactionNote} onChange={(e) => setTransactionNote(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-sm focus:ring-2 focus:ring-primary-500" placeholder={t("goals.optional_description")} />
                 <button type="submit" className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${transactionType === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'}`}>
                   {t("common.confirm")}
                 </button>
               </form>
             </div>
           </div>

           {/* Right: Chart & History */}
           <div className="lg:col-span-2 space-y-6">
             <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 min-h-[350px]">
               <h3 className="text-sm sm:text-base md:text-lg font-bold mb-6 text-slate-800 dark:text-white truncate">{t("goals.asset_growth")}</h3>
               <div className="h-64 md:h-72">
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={chartData}>
                     <defs>
                       <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor={selectedGoal.color} stopOpacity={0.3}/>
                         <stop offset="95%" stopColor={selectedGoal.color} stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                     <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
                     <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                     <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: 'white' }} />
                     <ReferenceLine y={selectedGoal.targetAmount} stroke="red" strokeDasharray="3 3" opacity={0.3} />
                     <Area type="monotone" dataKey="amount" stroke={selectedGoal.color} strokeWidth={3} fill="url(#colorGoal)" />
                     <Scatter dataKey="deposit" fill="#10B981" shape="circle" />
                     <Scatter dataKey="withdrawal" fill="#EF4444" shape="wye" />
                   </ComposedChart>
                 </ResponsiveContainer>
               </div>
             </div>

             <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                 <h3 className="font-bold text-slate-800 dark:text-white">{t("goals.transaction_history")}</h3>
               </div>
               <div className="max-h-80 overflow-y-auto overflow-x-auto">
                 <table className="w-full text-left min-w-[500px]">
                   <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                     <tr>
                       <th className="p-4 text-xs font-bold text-slate-400 uppercase">{t("common.date")}</th>
                       <th className="p-4 text-xs font-bold text-slate-400 uppercase">{t("common.description")}</th>
                       <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">{t("common.value")}</th>
                       <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">{t("common.options")}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {selectedGoal.history.slice().reverse().map((item) => (
                       <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition group">
                         <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                         <td className="p-4 text-sm text-slate-600 dark:text-slate-300 min-w-[120px]">{item.note || (item.amount > 0 ? t("goals.deposit") : t("goals.withdrawal"))}</td>
                         <td className={`p-4 text-sm font-bold text-right whitespace-nowrap tabular-nums ${item.amount > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                           {item.amount > 0 ? '+' : '-'} {currencyFormatter(Math.abs(item.amount))}
                         </td>
                         <td className="p-4 text-right whitespace-nowrap">
                           {item.userId === currentUser.id && (
                             <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition">
                               <button onClick={() => handleEditClick(item)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded active:scale-95 transition-transform"><Edit2 size={14}/></button>
                               <button onClick={() => deleteContribution(selectedGoal.id, item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded active:scale-95 transition-transform"><Trash2 size={14}/></button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-white truncate">{t("goals.title")}</h2>
          <p className="text-slate-500 text-sm">{t("goals.subtitle")}</p>
        </div>
        <button 
          data-tour="btn-new-goal"
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 font-bold whitespace-nowrap active:scale-95"
        >
          <Plus size={20} className="mr-2" />
          {t("goals.new_goal")}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-6 text-slate-800 dark:text-white truncate">{t("goals.plan_new_goal")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("common.name")}</label>
                <input type="text" required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" placeholder="Ex: Casa Própria" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("goals.target_amount")}</label>
                <input type="number" required value={newGoal.targetAmount} onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums" placeholder="0.00" />
                {newGoal.targetAmount && <p className="text-right text-xs font-bold text-primary-600 dark:text-primary-400 mt-1">{currencyFormatter(Number(newGoal.targetAmount))}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("goals.initial_balance")}</label>
                <input type="number" value={newGoal.initialAmount} onChange={e => setNewGoal({...newGoal, initialAmount: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums" placeholder="0.00" />
                {newGoal.initialAmount && <p className="text-right text-xs font-bold text-primary-600 dark:text-primary-400 mt-1">{currencyFormatter(Number(newGoal.initialAmount))}</p>}
              </div>
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("goals.annual_interest")}</label>
                <input type="number" value={newGoal.interestRate} onChange={e => setNewGoal({...newGoal, interestRate: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums" placeholder="Ex: 5" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("goals.deadline")}</label>
                <input type="date" required value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t("goals.card_color")}</label>
                <div className="flex gap-2 flex-wrap">
                  {['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1'].map(c => (
                    <div 
                      key={c} 
                      onClick={() => setNewGoal({...newGoal, color: c})}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95 ${newGoal.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                      style={{ backgroundColor: c }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
               <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium active:scale-95 transition-transform">{t("common.cancel")}</button>
               <button type="submit" className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg active:scale-95 transition-transform">{t("goals.create_goal")}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="goals-grid">
        {goals.map((goal) => {
          const percentage = goal.targetAmount > 0 
            ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
            : 0;
          return (
            <div 
              key={goal.id} 
              className="group relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-soft hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-700 overflow-hidden min-w-0 active:scale-[0.98]"
              onClick={() => setSelectedGoalId(goal.id)}
            >
              <div 
                className="absolute top-0 left-0 w-2 h-full" 
                style={{ backgroundColor: goal.color }}
              ></div>
              
              <div className="flex justify-between items-start mb-6 pl-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-white">
                  <Target size={24} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm(t("goals.delete_confirm"))) deleteGoal(goal.id); }}
                  className="text-slate-300 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition active:scale-90"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="pl-4 mb-6">
                <h3 className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-slate-800 dark:text-white mb-1 truncate line-clamp-2" title={goal.name}>{goal.name}</h3>
                <p className="text-sm text-slate-400">{t("goals.expires_on")} {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
              </div>

              <div className="pl-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-slate-800 dark:text-white tracking-tight break-words min-w-0">{currencyFormatter(goal.currentAmount)}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase truncate ml-2">{t("goals.of")} {currencyFormatter(goal.targetAmount)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Goals;
