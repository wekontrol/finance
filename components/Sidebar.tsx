import React, { useRef, useState } from 'react';
import { LayoutDashboard, Wallet, PiggyBank, Users, Settings, LogOut, X, Activity, Camera, TrendingUp, Calculator, PieChart, Languages } from 'lucide-react';
import { User, UserRole } from '../types';
import ProfileModal from './ProfileModal';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  appName: string;
  currentUser: User;
  currentView: string;
  setCurrentView: (view: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  logout: () => void;
  onUpdateUser?: (user: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  appName,
  currentUser, 
  currentView, 
  setCurrentView, 
  isMobileOpen, 
  setIsMobileOpen,
  logout,
  onUpdateUser
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('sidebar.transactions'), icon: Wallet },
    { id: 'budget', label: t('sidebar.budget'), icon: PieChart },
    { id: 'goals', label: t('sidebar.goals'), icon: PiggyBank },
    { id: 'inflation', label: t('sidebar.inflation'), icon: TrendingUp },
    { id: 'simulations', label: t('sidebar.simulations'), icon: Calculator },
    { id: 'family', label: t('sidebar.family'), icon: Users },
  ];

  if (currentUser.role === UserRole.TRANSLATOR || currentUser.role === UserRole.SUPER_ADMIN) {
    menuItems.push({ id: 'translations', label: t('sidebar.translations') || 'Traduções', icon: Languages });
  }

  if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.MANAGER) {
    menuItems.push({ id: 'admin', label: t('sidebar.settings'), icon: Settings });
  }

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    setIsMobileOpen(false);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleProfileSave = (formData: any) => {
    if (onUpdateUser) {
      onUpdateUser({ ...currentUser, ...formData });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpdateUser) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ ...currentUser, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getRoleLabel = () => {
    if (currentUser.role === UserRole.SUPER_ADMIN) return t('sidebar.role.superadmin');
    if (currentUser.role === UserRole.ADMIN) return t('sidebar.role.admin');
    if (currentUser.role === UserRole.MANAGER) return t('sidebar.role.manager');
    if (currentUser.role === UserRole.TRANSLATOR) return t('sidebar.role.translator') || 'Tradutor';
    return t('sidebar.role.member');
  };

  return (
    <>
      <div 
        className={`
          fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity duration-300
          ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      <aside className={`
        fixed inset-y-0 left-0 z-[101] w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0 flex flex-col md:shadow-none
      `}>
        <div className="h-16 md:h-20 flex items-center px-4 md:px-6 border-b border-slate-50 dark:border-slate-800">
          <div className="w-9 md:w-10 h-9 md:h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-glow mr-2 md:mr-3 shrink-0">
            <Activity size={20} className="md:w-6 md:h-6" />
          </div>
          <h1 className="text-base md:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 truncate tracking-tight min-w-0">
            {appName}
          </h1>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden ml-auto text-slate-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0 active:scale-95 transition-transform">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 md:p-4 flex-1 overflow-y-auto scrollbar-thin">
          <div className="mb-6 md:mb-8" data-tour="sidebar-menu">
            <p className="px-3 md:px-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Principal</p>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl transition-all duration-300 group active:scale-95 hover:scale-[1.02]
                      ${isActive 
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/10 text-primary-700 dark:text-primary-300 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-primary-600 dark:hover:text-primary-400'}
                    `}
                  >
                    <Icon size={16} className={`md:w-5 md:h-5 mr-2 md:mr-3 shrink-0 transition-all duration-300 ${isActive ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-slate-400 group-hover:text-primary-500 group-hover:scale-125'}`} />
                    <span className="truncate">{item.label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-pulse-soft"></div>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-50 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center mb-2 border border-slate-100 dark:border-slate-700 group transition-colors hover:border-slate-200 dark:hover:border-slate-600 active:scale-95 cursor-pointer" onClick={handleProfileClick}>
            <div className="relative shrink-0" title="Editar perfil">
              <img src={currentUser.avatar} alt="Avatar" className="w-9 h-9 rounded-full border border-white dark:border-slate-600 shadow-sm object-cover group-hover:opacity-80 transition" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition">
                <span className="text-xs text-white font-bold">Edit</span>
              </div>
            </div>
            <div className="ml-3 overflow-hidden min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition" title={currentUser.name}>
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {getRoleLabel()}
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all active:scale-95"
          >
            <LogOut size={16} className="mr-2 shrink-0" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {showProfileModal && (
        <ProfileModal 
          user={currentUser} 
          onClose={() => setShowProfileModal(false)} 
          onSave={handleProfileSave}
        />
      )}
    </>
  );
};

export default Sidebar;