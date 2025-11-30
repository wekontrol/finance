
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, User, FamilyTask, FamilyEvent } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, CheckSquare, Square, Trash2, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface FamilyModeProps {
  transactions: Transaction[];
  currencyFormatter: (value: number) => string;
  currentUser: User;
  allUsers: User[];
  tasks: FamilyTask[];
  events: FamilyEvent[];
  addTask: (task: Omit<FamilyTask, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addEvent: (event: Omit<FamilyEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
  canViewData: (viewer: User, targetUser: User) => boolean;
}

const FamilyMode: React.FC<FamilyModeProps> = ({ 
  transactions, 
  currencyFormatter, 
  currentUser, 
  allUsers,
  tasks,
  events,
  addTask,
  toggleTask,
  deleteTask,
  addEvent,
  deleteEvent,
  canViewData
}) => {
  const { t } = useLanguage();
  // ISOLATION: Filter users to only show members of the same family
  const familyUsers = useMemo(() => {
    return allUsers.filter(u => u.familyId === currentUser.familyId);
  }, [allUsers, currentUser.familyId]);

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(familyUsers.map(u => u.id));
  
  // To-Do State
  const [newTaskDesc, setNewTaskDesc] = useState('');
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<FamilyEvent['type']>('general');

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  // Logic to mask data
  const processedTransactions = useMemo(() => {
     // Filter transactions to only show selected family members
     const familyUserIds = familyUsers.map(u => u.id);
     return transactions
       .filter(t => familyUserIds.includes(t.userId)) // Security check: Only family txs
       .filter(t => selectedUserIds.includes(t.userId))
       .map(t => {
         const owner = familyUsers.find(u => u.id === t.userId);
         if (owner && !canViewData(currentUser, owner)) {
           return { ...t, amount: 0, isMasked: true }; // Mask amount
         }
         return { ...t, isMasked: false };
       });
  }, [transactions, selectedUserIds, currentUser, familyUsers, canViewData]);

  const totalIncome = processedTransactions.filter(t => t.type === TransactionType.INCOME && !t.isMasked).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = processedTransactions.filter(t => t.type === TransactionType.EXPENSE && !t.isMasked).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;
  const hasMaskedData = processedTransactions.some(t => t.isMasked);

  const data = [{ name: 'Receitas', value: totalIncome }, { name: 'Despesas', value: totalExpense }];
  const COLORS = ['#10b981', '#ef4444'];

  // Filter tasks and events for the family (assuming they are shared within family context or global - here we filter if assignedTo is in family)
  const familyTasks = tasks.filter(t => familyUsers.some(u => u.id === t.assignedTo));
  // Events are currently global in type, usually should link to familyId. Assuming global list filtered by logic or add familyId to event. 
  // For now, let's assume events are filtered by app context or we filter purely by view. 
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;
    addTask({
      description: newTaskDesc,
      assignedTo: currentUser.id,
      isCompleted: false
    });
    setNewTaskDesc('');
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newEventTitle) return;
    addEvent({
      title: newEventTitle,
      date: selectedDate,
      type: newEventType
    });
    setNewEventTitle('');
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto py-4 md:py-8 space-y-8 md:space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 md:p-5 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 md:mb-6 text-blue-600 dark:text-blue-400 shadow-glow">
          <Users size={32} className="md:w-12 md:h-12" />
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 md:mb-3 tracking-tight">{t('family_mode.family_hub')}</h2>
        <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{t('family_mode.family_hub_desc')}</p>
      </div>

      {/* Financial Summary */}
      <section>
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{t('family_mode.financial_summary')}</h3>
            <div className="flex -space-x-2">
              {familyUsers.map(user => (
                <div key={user.id} className="relative group">
                  <img 
                    src={user.avatar} 
                    onClick={() => toggleUser(user.id)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${selectedUserIds.includes(user.id) ? 'border-primary-500 opacity-100' : 'border-slate-300 opacity-50 grayscale'}`} 
                    title={user.name}
                  />
                  {!canViewData(currentUser, user) && user.id !== currentUser.id && (
                     <div className="absolute -top-1 -right-1 bg-slate-800 text-white rounded-full p-0.5"><Lock size={10} /></div>
                  )}
                </div>
              ))}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-soft border-b-4 border-slate-200 dark:border-slate-700 text-center relative">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('family_mode.total_balance')}</p>
              <p className={`text-2xl md:text-4xl font-extrabold mt-2 ${balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
                {currencyFormatter(balance)}
                {hasMaskedData && <span className="text-sm align-top text-slate-400">*</span>}
              </p>
            </div>
            <div className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-soft border-b-4 border-emerald-500/30 text-center">
              <p className="text-xs font-bold text-emerald-500 uppercase">{t('family_mode.income')}</p>
              <p className="text-2xl md:text-4xl font-extrabold mt-2 text-emerald-600">{currencyFormatter(totalIncome)}</p>
            </div>
            <div className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-soft h-full flex items-center justify-center relative overflow-hidden">
               {totalIncome === 0 && totalExpense === 0 ? (
                  <p className="text-slate-400 text-sm">{t('family_mode.no_combined_data')}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => currencyFormatter(value)} contentStyle={{borderRadius: '12px', border: 'none', background: '#1e293b', color: 'white'}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </div>
         </div>
         {hasMaskedData && <p className="text-xs text-center text-slate-400 mt-2">* Alguns dados estão ocultos devido a configurações de privacidade.</p>}
      </section>

      {/* To-Do List & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <section 
          data-tour="family-tasks"
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 p-4 md:p-6 flex flex-col h-[500px]"
        >
          <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-4 md:mb-6 flex items-center">
            <CheckSquare className="mr-3 text-primary-500" /> {t('family_mode.tasks_plans')}
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
            {familyTasks.length === 0 && <p className="text-center text-slate-400 py-10">{t('family_mode.no_pending_tasks')}</p>}
            {familyTasks.map(task => {
              const assignedUser = familyUsers.find(u => u.id === task.assignedTo);
              return (
                <div key={task.id} className={`flex items-center justify-between p-3 md:p-4 rounded-2xl transition-all ${task.isCompleted ? 'bg-slate-50 dark:bg-slate-900/50 opacity-60' : 'bg-white dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleTask(task.id)} className={`text-xl md:text-2xl ${task.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-primary-500'}`}>
                      {task.isCompleted ? <CheckSquare /> : <Square />}
                    </button>
                    <div>
                      <p className={`text-sm md:text-base font-semibold ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>{task.description}</p>
                      <div className="flex items-center mt-1">
                        <img src={assignedUser?.avatar} className="w-3 h-3 md:w-4 md:h-4 rounded-full mr-1.5" />
                        <span className="text-[10px] md:text-xs text-slate-500">{assignedUser?.name}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-rose-500 transition"><Trash2 size={16}/></button>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddTask} className="mt-auto relative">
             <input type="text" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder={t('family_mode.add_new_task')} className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base" />
             <button type="submit" className="absolute right-2 top-2 p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"><Plus size={18} /></button>
          </form>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 p-4 md:p-6 flex flex-col h-auto md:h-[500px]">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center"><CalendarIcon className="mr-2 md:mr-3 text-orange-500" /> {t('family_mode.calendar')}</h3>
            <div className="flex items-center gap-2 md:gap-4 bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1">
              <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full"><ChevronLeft size={16}/></button>
              <span className="font-bold text-xs md:text-sm min-w-[90px] md:min-w-[100px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full"><ChevronRight size={16}/></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 text-center mb-2">{['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i} className="text-[10px] md:text-xs font-bold text-slate-400">{d}</span>)}</div>
            <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1 auto-rows-fr">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate === dateStr;
                return (
                  <div key={day} onClick={() => setSelectedDate(dateStr)} className={`relative rounded-xl border flex flex-col items-center justify-start pt-1 cursor-pointer transition-all hover:border-primary-300 min-h-[50px] md:min-h-0 overflow-hidden ${isSelected ? 'bg-primary-50 border-primary-500 ring-1 ring-primary-500' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    <span className={`text-[10px] md:text-xs font-bold ${isSelected ? 'text-primary-600' : 'text-slate-600 dark:text-slate-300'}`}>{day}</span>
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1 w-full px-0.5">{dayEvents.map(ev => (<div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${ev.type === 'bill' ? 'bg-rose-500' : ev.type === 'birthday' ? 'bg-purple-500' : 'bg-blue-500'}`} />))}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {selectedDate && (
             <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 animate-slide-up">
                <h4 className="font-bold text-sm mb-3 text-slate-700 dark:text-white">Eventos em {selectedDate.split('-').reverse().join('/')}</h4>
                
                {/* Form moved UP to prevent overlap with floating AI button on mobile */}
                <form onSubmit={handleAddEvent} className="mb-3 flex flex-col md:flex-row gap-2">
                  <input type="text" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder={t('family_mode.new_event')} className="flex-1 p-3 md:p-2 text-sm border rounded-xl dark:bg-slate-900 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 min-w-0" />
                  <div className="flex gap-2">
                    <select value={newEventType} onChange={e => setNewEventType(e.target.value as any)} className="p-3 md:p-2 text-sm border rounded-xl dark:bg-slate-900 dark:text-white dark:border-slate-700 outline-none flex-1 md:w-auto">
                      <option value="general">Geral</option>
                      <option value="bill">Conta</option>
                      <option value="birthday">Niver</option>
                    </select>
                    <button type="submit" className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shrink-0 shadow-lg shadow-primary-500/20"><Plus size={18}/></button>
                  </div>
                </form>

                {getEventsForDay(parseInt(selectedDate.split('-')[2])).length === 0 && <p className="text-xs text-slate-400 italic">Sem eventos para este dia.</p>}
                
                <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1">
                  {getEventsForDay(parseInt(selectedDate.split('-')[2])).map(ev => (
                    <div key={ev.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-600">
                      <div className="flex items-center gap-2 overflow-hidden">
                         <div className={`w-2 h-2 rounded-full shrink-0 ${ev.type === 'bill' ? 'bg-rose-500' : ev.type === 'birthday' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                         <span className="text-sm font-medium dark:text-white truncate" title={ev.title}>{ev.title}</span>
                      </div>
                      <button onClick={() => deleteEvent(ev.id)} className="text-slate-400 hover:text-rose-500 shrink-0 p-1"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FamilyMode;
