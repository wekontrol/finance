import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, UserRole, Transaction, SavingsGoal, TransactionType, BackupConfig, BudgetLimit, GoalTransaction, ExchangeRates, FamilyTask, FamilyEvent, RateProvider, UserStatus, SavedSimulation, LoanSimulation, Notification as AppNotification } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import FamilyMode from './components/FamilyMode';
import AdminPanel from './components/AdminPanel';
import BudgetControl from './components/BudgetControl';
import InflationControl from './components/InflationControl';
import Simulations from './components/Simulations';
import Login from './components/Login';
import AIAssistant from './components/AIAssistant';
import AIPlanning from './components/AIPlanning';
import TranslationManager from './components/TranslationManager'; 
import AppHeader from './components/AppHeader';
import { Loader2, Menu, Moon, Sun, Globe, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getExchangeRates } from './services/marketData';
import { getDefaultProvider as getDefaultCurrencyProvider, setDefaultProvider as setDefaultCurrencyProvider } from './services/currencyProviderService';
import { authApi, transactionsApi, goalsApi, usersApi, familyApi, budgetApi } from './services/api';
import { LanguageProvider } from './contexts/LanguageContext';

// Dados Iniciais Atualizados com Hierarquia Familiar
const INITIAL_USERS: User[] = [
  {
    id: 'u0',
    username: 'admin',
    password: 'admin',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    avatar: '/default-avatar.svg',
    status: UserStatus.APPROVED,
    securityQuestion: { question: 'Nome do primeiro animal', answer: 'rex' }
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_GOALS: SavingsGoal[] = [];

// Helper para carregar dados com segurança
const safeLoad = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.warn(`Dados corrompidos em ${key}. Resetando para padrão.`);
    return fallback;
  }
};


const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('appName') || 'Gestão Financeira';
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [userLanguage, setUserLanguage] = useState<any>('pt');
  const [currency, setCurrency] = useState('AOA'); 
  const [rateProvider, setRateProvider] = useState<RateProvider>('EXCHANGERATE_API');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'PDF' | 'CSV' | null>(null);
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 8) + '01');
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  
  const [backupConfig, setBackupConfig] = useState<BackupConfig>({
    networkPath: '',
    rootDataFolder: '',
    frequency: 'manual',
    lastBackup: null
  });

  const [familyTasks, setFamilyTasks] = useState<FamilyTask[]>([]);
  const [familyEvents, setFamilyEvents] = useState<FamilyEvent[]>([]);
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>(() => safeLoad('savedSimulations', []));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => safeLoad('notifications', []));

  // Listen for system theme preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem('theme');
      if (!hasManualPreference) {
        setDarkMode(e.matches);
      }
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
    // Fallback for older browsers
    else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleThemeChange);
      return () => (mediaQuery as any).removeListener(handleThemeChange);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await authApi.me();
        setCurrentUser(response.user);
        setUserLanguage(response.user.languagePreference || 'pt');
        setIsLoggedIn(true);
        await loadAllData();
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const loadAllData = async () => {
    try {
      // Create default budgets for the user if they don't exist
      try {
        const response = await fetch('/api/budget/create-defaults', { method: 'POST' });
        if (!response.ok) {
          console.warn('Failed to create default budgets:', response.status);
        }
      } catch (error) {
        console.warn('Error creating default budgets:', error);
      }
      
      const [transactionsData, goalsData, usersData, tasksData, eventsData, budgetsData] = await Promise.all([
        transactionsApi.getAll(),
        goalsApi.getAll(),
        usersApi.getAll(),
        familyApi.getTasks(),
        familyApi.getEvents(),
        budgetApi.getLimits()
      ]);
      setTransactions(transactionsData);
      setGoals(goalsData);
      setAllUsers(usersData);
      setFamilyTasks(tasksData);
      setFamilyEvents(eventsData);
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    const loadRates = async () => {
      try {
        let provider = rateProvider;
        // If rateProvider is not set, load user's saved preference
        if (!rateProvider || rateProvider === 'BNA') {
          provider = await getDefaultCurrencyProvider();
          setRateProvider(provider);
        }
        const rates = await getExchangeRates(provider);
        setExchangeRates(rates);
      } catch (error) {
        console.error("Erro ao carregar taxas", error);
      }
    };
    loadRates();
    const interval = setInterval(loadRates, 300000); 
    return () => clearInterval(interval);
  }, [rateProvider]); 

  // Audio Context Logic (Same as before)
  const audioContextRef = useRef<AudioContext | null>(null);
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playClickSound = () => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Fallback if audio not available
    }
  };

  const formatCurrency = (value: number, currencyCode: string = currency): string => {
    let convertedValue = value;
    
    // Convert from AOA to target currency if rates are available
    if (exchangeRates && currencyCode !== 'AOA') {
      const rate = exchangeRates[currencyCode] as number;
      if (rate && rate > 0) {
        convertedValue = value * rate;
      }
    }
    
    const formatter = new Intl.NumberFormat(userLanguage || 'pt-BR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    });
    return formatter.format(convertedValue);
  };

  const handleThemeToggle = () => {
    playClickSound();
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setAllUsers(allUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await transactionsApi.create(transaction);
      // Add new transaction at the beginning (most recent)
      setTransactions([newTransaction, ...transactions]);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      await transactionsApi.update(transaction.id, transaction);
      setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const addGoal = async (goal: Omit<SavingsGoal, 'id'>) => {
    try {
      const newGoal = await goalsApi.create(goal);
      setGoals([newGoal, ...goals]);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await goalsApi.delete(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const addGoalContribution = async (goalId: string, amount: number, note?: string) => {
    try {
      await goalsApi.contribute(goalId, amount, note);
      await loadAllData();
    } catch (error) {
      console.error('Error adding contribution:', error);
    }
  };

  const editGoalContribution = async (goalId: string, contribution: GoalTransaction) => {
    try {
      await loadAllData();
    } catch (error) {
      console.error('Error updating contribution:', error);
    }
  };

  const deleteGoalContribution = async (goalId: string) => {
    try {
      await loadAllData();
    } catch (error) {
      console.error('Error deleting contribution:', error);
    }
  };

  const saveBudget = async (budget: BudgetLimit) => {
    try {
      await budgetApi.saveBudget(budget);
      // Reload all budgets from server to ensure they're persisted and no duplicates
      const data = await budgetApi.getLimits();
      setBudgets(data);
      console.log(`[saveBudget] Saved and reloaded ${data.length} budgets from server`);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const openExportModal = (type: 'PDF' | 'CSV') => {
    setExportType(type);
    setShowExportModal(true);
  };

  const handleExportConfirm = async () => {
    if (!exportType) return;
    await handleExportClick(exportType, exportStartDate, exportEndDate);
    setShowExportModal(false);
  };

  const handleExportClick = async (type: 'PDF' | 'CSV', startDate: string, endDate: string) => {
    const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    
    if (type === 'PDF') {
      const doc = new jsPDF();
      const tableData = filteredTransactions.map(t => [
        t.description,
        t.category,
        t.date,
        formatCurrency(t.amount),
        t.type
      ]);
      
      autoTable(doc, {
        head: [['Descrição', 'Categoria', 'Data', 'Valor', 'Tipo']],
        body: tableData,
        startY: 10
      });
      
      doc.save('transacoes.pdf');
    } else if (type === 'CSV') {
      const headers = ['Descrição', 'Categoria', 'Data', 'Valor', 'Tipo'];
      const rows = filteredTransactions.map(t => [
        t.description,
        t.category,
        t.date,
        t.amount,
        t.type
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transacoes.csv';
      a.click();
    }
  };

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      const newUser = await usersApi.create(userData);
      setAllUsers([newUser, ...allUsers]);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersApi.delete(userId);
      setAllUsers(allUsers.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const updateBackupConfig = (config: BackupConfig) => {
    setBackupConfig(config);
    localStorage.setItem('backupConfig', JSON.stringify(config));
  };

  const triggerManualBackup = async () => {
    console.log('Manual backup triggered');
  };

  const handleRestoreBackup = async () => {
    console.log('Restore backup triggered');
  };

  const canViewData = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN) return true;
    return true;
  };

  const addFamilyTask = async (task: Omit<FamilyTask, 'id'>) => {
    try {
      const newTask = await familyApi.createTask(task);
      setFamilyTasks([newTask, ...familyTasks]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleFamilyTask = async (taskId: string) => {
    try {
      await familyApi.updateTask(taskId, {});
      await loadAllData();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteFamilyTask = async (taskId: string) => {
    try {
      await familyApi.deleteTask(taskId);
      setFamilyTasks(familyTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const addFamilyEvent = async (event: Omit<FamilyEvent, 'id'>) => {
    try {
      const newEvent = await familyApi.createEvent(event);
      setFamilyEvents([newEvent, ...familyEvents]);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const deleteFamilyEvent = async (eventId: string) => {
    try {
      await familyApi.deleteEvent(eventId);
      setFamilyEvents(familyEvents.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const saveSimulation = async (simulation: SavedSimulation) => {
    const updated = [simulation, ...savedSimulations];
    setSavedSimulations(updated);
    localStorage.setItem('savedSimulations', JSON.stringify(updated));
  };

  const deleteSimulation = async (simulationId: string) => {
    const updated = savedSimulations.filter(s => s.id !== simulationId);
    setSavedSimulations(updated);
    localStorage.setItem('savedSimulations', JSON.stringify(updated));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setNotifications(notifications.filter(n => n.id !== notification.id));
  };

  return (
    <LanguageProvider initialLanguage={userLanguage}>
      <div className={`${darkMode ? 'dark' : ''}`}>
        {isLoading && (
          <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-500 to-primary-600">
            <Loader2 size={48} className="animate-spin text-white" />
          </div>
        )}

        {!isLoggedIn && !isLoading && (
          <Login appName={appName} onLogin={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            setUserLanguage(user.languagePreference || 'pt');
          }} />
        )}

        {isLoggedIn && !isLoading && (
        <div className="flex h-screen bg-slate-50 dark:bg-[#09090b] overflow-hidden font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
          <Sidebar 
            appName={appName}
            currentUser={currentUser}
            currentView={currentView}
            setCurrentView={setCurrentView}
            isMobileOpen={isMobileMenuOpen}
            setIsMobileOpen={setIsMobileMenuOpen}
            logout={handleLogout}
            onUpdateUser={handleUpdateUser}
          />

          {/* Controlled AI Assistant Component */}
          <AIAssistant 
            isOpen={isAiOpen}
            onClose={() => setIsAiOpen(false)}
            transactions={transactions} 
            goals={goals} 
            currencyFormatter={formatCurrency} 
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
            <AppHeader 
              appName={appName}
              currentView={currentView}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              currency={currency}
              setCurrency={setCurrency}
              isAiOpen={isAiOpen}
              setIsAiOpen={setIsAiOpen}
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              onClearAll={clearNotifications}
              darkMode={darkMode}
              handleThemeToggle={handleThemeToggle}
            />

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 scroll-smooth pb-32">
              <div className="max-w-7xl mx-auto">
                {currentView === 'dashboard' && <Dashboard transactions={transactions} savingsGoals={goals} budgets={budgets} currencyFormatter={formatCurrency} darkMode={darkMode} />}
                {currentView === 'transactions' && currentUser && <Transactions transactions={transactions} addTransaction={addTransaction} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} currentUserId={currentUser.id} currencyFormatter={formatCurrency} onExport={openExportModal} onImportSuccess={loadAllData} />}
                {currentView === 'budget' && <BudgetControl transactions={transactions} budgets={budgets} saveBudget={saveBudget} currencyFormatter={formatCurrency} />}
                {currentView === 'goals' && currentUser && <Goals goals={goals} addGoal={addGoal} deleteGoal={deleteGoal} addContribution={addGoalContribution} editContribution={editGoalContribution} deleteContribution={deleteGoalContribution} currencyFormatter={formatCurrency} currentUser={currentUser} />}
                {currentView === 'inflation' && <InflationControl rateProvider={rateProvider} setRateProvider={setRateProvider} currencyFormatter={formatCurrency} />}
                {currentView === 'simulations' && <Simulations currencyFormatter={formatCurrency} savedSimulations={savedSimulations} onSaveSimulation={saveSimulation} onDeleteSimulation={deleteSimulation} />}
                {currentView === 'family' && currentUser && <FamilyMode transactions={transactions} currencyFormatter={formatCurrency} currentUser={currentUser} allUsers={allUsers} tasks={familyTasks} events={familyEvents} addTask={addFamilyTask} toggleTask={toggleFamilyTask} deleteTask={deleteFamilyTask} addEvent={addFamilyEvent} deleteEvent={deleteFamilyEvent} canViewData={canViewData} />}
                {currentView === 'planning' && <AIPlanning />}
                {currentView === 'admin' && currentUser && <AdminPanel appName={appName} setAppName={setAppName} backupConfig={backupConfig} updateBackupConfig={updateBackupConfig} triggerManualBackup={triggerManualBackup} users={allUsers} currentUser={currentUser} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onRestoreBackup={handleRestoreBackup} />}
                {currentView === 'translations' && currentUser && <TranslationManager currentUser={currentUser} />}
              </div>
            </main>
          </div>

          {showExportModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-700 animate-scale-in">
                 <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Exportar {exportType}</h3>
                 <div className="space-y-4">
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Data Inicial</label>
                     <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Data Final</label>
                     <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                   </div>
                   <div className="flex gap-3 pt-2">
                     <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition active:scale-95">Cancelar</button>
                     <button onClick={handleExportConfirm} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition active:scale-95">Confirmar</button>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
        )}
      </div>
    </LanguageProvider>
  );
};

export default App;
