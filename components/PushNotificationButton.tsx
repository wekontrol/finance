import React, { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { pushApi } from '../services/pushApi';

const PushNotificationButton: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const status = await pushApi.getStatus();
      setIsSubscribed(status.isSubscribed);
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  };

  const handleToggleSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isSubscribed) {
        await pushApi.unsubscribeFromPush();
      } else {
        await pushApi.subscribeToPush();
      }
      setIsSubscribed(!isSubscribed);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar notificações push');
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleToggleSubscription}
        disabled={isLoading}
        className={`w-full p-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
          isSubscribed
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Bell size={18} />
        )}
        {isLoading
          ? 'Processando...'
          : isSubscribed
          ? '🔔 Notificações Ativas'
          : '🔕 Ativar Notificações Push'}
      </button>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
          <p className="text-sm text-rose-700 dark:text-rose-400">⚠️ {error}</p>
        </div>
      )}

      {isSubscribed && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            ✓ Notificações push ativadas. Receberá alertas em tempo real.
          </p>
        </div>
      )}
    </div>
  );
};

export default PushNotificationButton;
