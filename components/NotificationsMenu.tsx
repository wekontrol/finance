
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsMenuProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearAll: () => void;
}

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ 
  notifications, 
  onNotificationClick, 
  onClearAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (title: string) => {
    if (title.includes('Orçamento')) return <AlertTriangle size={16} className="text-rose-500" />;
    if (title.includes('Meta')) return <CheckCircle size={16} className="text-emerald-500" />;
    return <Info size={16} className="text-blue-500" />;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition group"
        title="Notificações"
      >
        <Bell size={20} className={isOpen ? 'text-primary-500' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-scale-in origin-top-right">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notificações</h3>
            {notifications.length > 0 && (
              <button 
                onClick={onClearAll}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center transition"
              >
                <Trash2 size={12} className="mr-1" /> Limpar
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-full mb-3">
                  <Bell size={24} className="opacity-50" />
                </div>
                <p className="text-sm">Tudo limpo por aqui!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => {
                       onNotificationClick(notif);
                       setIsOpen(false);
                    }}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer flex gap-3 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className={`mt-1 p-2 rounded-full shrink-0 h-fit ${!notif.read ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      {getIcon(notif.title)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-bold ${!notif.read ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {notif.title}
                        </h4>
                        {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {new Date(notif.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
