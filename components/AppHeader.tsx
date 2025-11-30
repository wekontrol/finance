import React from 'react';
import { Menu, Moon, Sun, Globe, Sparkles, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationsMenu from './NotificationsMenu';
import { Notification } from '../types';

interface AppHeaderProps {
  appName: string;
  currentView: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  isAiOpen: boolean;
  setIsAiOpen: (open: boolean) => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearAll: () => void;
  darkMode: boolean;
  handleThemeToggle: () => void;
}

const VIEW_TITLE_KEYS: Record<string, string> = {
  'dashboard': 'common.view_dashboard',
  'simulations': 'common.view_simulations',
  'transactions': 'common.view_transactions',
  'budget': 'common.view_budget',
  'goals': 'common.view_goals',
  'inflation': 'common.view_inflation',
  'admin': 'common.view_admin',
  'family': 'common.view_family',
  'translations': 'common.view_translations'
};

const AppHeader: React.FC<AppHeaderProps> = ({
  appName,
  currentView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currency,
  setCurrency,
  isAiOpen,
  setIsAiOpen,
  notifications,
  onNotificationClick,
  onClearAll,
  darkMode,
  handleThemeToggle
}) => {
  const { t } = useLanguage();
  const titleKey = VIEW_TITLE_KEYS[currentView] || 'common.view_dashboard';

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-2 md:py-4 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 border-b border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors duration-300">
      <div className="flex items-center">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="mr-2 md:mr-3 text-slate-500 md:hidden hover:text-primary-500 transition active:scale-95"
        >
          <Menu size={20} className="md:hidden" />
        </button>
        <h2 className="text-base sm:text-lg md:text-2xl font-bold text-slate-800 dark:text-white capitalize truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">
          {t(titleKey)}
        </h2>
      </div>
      
      <div className="flex items-center space-x-1 md:space-x-3">
         <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg md:rounded-xl px-1.5 md:px-3 py-1 md:py-1.5 border border-slate-200 dark:border-slate-700">
          <DollarSign size={14} className="md:hidden text-primary-500 mr-1" />
          <Globe size={14} className="hidden md:block text-primary-500 mr-1 md:mr-2" />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-transparent border-none text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[60px] md:max-w-none">
            <option value="AOA">AOA (Kz)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="BRL">BRL (R$)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="CNY">CNY (¥)</option>
            <option value="INR">INR (₹)</option>
            <option value="ZAR">ZAR (R)</option>
            <option value="MZN">MZN (MT)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="CAD">CAD (C$)</option>
          </select>
        </div>
        
        {/* AI Trigger Button in Header */}
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className={`p-2 md:p-2.5 rounded-full transition group active:scale-95 ${isAiOpen ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          title="Assistente Gemini"
        >
          <Sparkles size={18} className={`md:w-5 md:h-5 ${isAiOpen ? 'fill-current' : ''}`} />
        </button>

        <NotificationsMenu 
          notifications={notifications} 
          onNotificationClick={onNotificationClick} 
          onClearAll={onClearAll} 
        />

        <button 
          data-tour="theme-toggle" 
          onClick={handleThemeToggle} 
          className="p-2 md:p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition active:scale-95"
        >
          {darkMode ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
