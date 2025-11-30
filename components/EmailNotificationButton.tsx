import React, { useState, useEffect } from 'react';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface EmailConfig {
  hasEmail: boolean;
  email: string | null;
}

const EmailNotificationButton: React.FC = () => {
  const { t } = useLanguage();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/email/config');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    }
  };

  const handleSendTest = async () => {
    setIsSending(true);
    setMessage(null);

    try {
      const res = await fetch('/api/email/test', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: t('email_notifications.test_sent_success')
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || t('email_notifications.send_error')
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || t('email_notifications.send_error')
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!config) {
    return <div className="text-center py-4">{t('email_notifications.loading')}</div>;
  }

  return (
    <div className="space-y-3">
      {!config.hasEmail && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t('email_notifications.email_not_configured')}
          </p>
        </div>
      )}

      {config.hasEmail && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            {t('email_notifications.registered_email')} <strong>{config.email}</strong>
          </p>
        </div>
      )}

      <button
        onClick={handleSendTest}
        disabled={isSending}
        className="w-full p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition flex items-center justify-center gap-2"
      >
        {isSending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Mail size={18} />
        )}
        {isSending ? t('email_notifications.sending') : t('email_notifications.send_test_email')}
      </button>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-bold ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {t('email_notifications.how_to_use')}
        </p>
      </div>
    </div>
  );
};

export default EmailNotificationButton;
