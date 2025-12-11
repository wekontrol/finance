import React, { useState, useRef, useEffect } from 'react';
import { Menu, Moon, Sun, Globe, Sparkles, ChevronDown } from 'lucide-react';
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

const CURRENCY_FLAGS: Record<string, string> = {
  'AOA': '🇦🇴',
  'USD': '🇺🇸',
  'EUR': '🇪🇺',
  'BRL': '🇧🇷',
  'GBP': '🇬🇧',
  'JPY': '🇯🇵',
  'CNY': '🇨🇳',
  'INR': '🇮🇳',
  'ZAR': '🇿🇦',
  'MZN': '🇲🇿',
  'AUD': '🇦🇺',
  'CAD': '🇨🇦',
};

const CURRENCIES = [
  { code: 'AOA', label: 'AOA (Kz)', flag: '🇦🇴' },
  { code: 'USD', label: 'USD ($)', flag: '🇺🇸' },
  { code: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
  { code: 'BRL', label: 'BRL (R$)', flag: '🇧🇷' },
  { code: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
  { code: 'JPY', label: 'JPY (¥)', flag: '🇯🇵' },
  { code: 'CNY', label: 'CNY (¥)', flag: '🇨🇳' },
  { code: 'INR', label: 'INR (₹)', flag: '🇮🇳' },
  { code: 'ZAR', label: 'ZAR (R)', flag: '🇿🇦' },
  { code: 'MZN', label: 'MZN (MT)', flag: '🇲🇿' },
  { code: 'AUD', label: 'AUD (A$)', flag: '🇦🇺' },
  { code: 'CAD', label: 'CAD (C$)', flag: '🇨🇦' },
];

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
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCurrencyData = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

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
        {/* Currency Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
            className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-200 active:scale-95"
          >
            <Globe size={14} className="hidden sm:block md:w-5 md:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-lg sm:text-xl leading-none">{currentCurrencyData.flag}</span>
            <span className="text-xs sm:text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 hidden sm:inline leading-tight">
              {currency}
            </span>
            <ChevronDown 
              size={14} 
              className={`hidden sm:block text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu - Mobile optimized */}
          {isCurrencyDropdownOpen && (
            <>
              {/* Mobile Overlay */}
              <div 
                className="fixed inset-0 bg-black/20 dark:bg-black/40 sm:hidden z-40"
                onClick={() => setIsCurrencyDropdownOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 w-80 sm:w-56 bg-white dark:bg-slate-800 rounded-2xl sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl sm:shadow-lg z-50 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setCurrency(curr.code);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-3.5 py-2.5 text-xs sm:text-sm transition-colors ${
                        currency === curr.code
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">{curr.flag}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{curr.code}</span>
                        <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">({curr.label.split('(')[1]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
