import React, { useState, useEffect } from 'react';
import { Bell, Save, AlertCircle, Key } from 'lucide-react';
import { notificationApi } from '../services/notificationApi';
import PushNotificationButton from './PushNotificationButton';
import EmailNotificationButton from './EmailNotificationButton';
import NotificationCredentialsConfig from './NotificationCredentialsConfig';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationSettingsProps {
  isSuperAdmin?: boolean;
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isSuperAdmin, onClose }) => {
  const [prefs, setPrefs] = useState({
    budget_alerts: 1,
    subscription_alerts: 1,
    financial_tips: 1,
    goal_progress: 1,
    email_notifications: 1,
    push_notifications: 1
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await notificationApi.getPreferences();
      setPrefs({
        budget_alerts: data.budget_alerts || 1,
        subscription_alerts: data.subscription_alerts || 1,
        financial_tips: data.financial_tips || 1,
        goal_progress: data.goal_progress || 1,
        email_notifications: data.email_notifications || 1,
        push_notifications: data.push_notifications || 1
      });
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await notificationApi.updatePreferences(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const Toggle = ({ label, fieldName }: { label: string; fieldName: keyof typeof prefs }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <label className="text-sm font-bold text-slate-600 dark:text-slate-300">{label}</label>
      <input
        type="checkbox"
        checked={prefs[fieldName] === 1}
        onChange={(e) => setPrefs({ ...prefs, [fieldName]: e.target.checked ? 1 : 0 })}
        className="w-5 h-5 rounded border-slate-300 text-primary-600"
      />
    </div>
  );

  const { t } = useLanguage?.() || { t: (key: string) => key };
  if (loading) return <div className="text-center py-8">{t("common.loading")}...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bell size={24} className="text-primary-600" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          {isSuperAdmin ? t("settings.global_notifications") : t("settings.my_notifications")}
        </h3>
      </div>

      {isSuperAdmin && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {t("settings.global_applies_all")}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase">{t("settings.alerts")}</h4>
          <div className="space-y-2">
            <Toggle label={t("settings.budget_alerts")} fieldName="budget_alerts" />
            <Toggle label={t("settings.subscription_alerts")} fieldName="subscription_alerts" />
            <Toggle label={t("settings.financial_tips")} fieldName="financial_tips" />
            <Toggle label={t("settings.goal_progress")} fieldName="goal_progress" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase">{t("settings.delivery_preferences")}</h4>
          <div className="space-y-2">
            <Toggle label={t("settings.email_notifications")} fieldName="email_notifications" />
            <Toggle label={t("settings.push_notifications")} fieldName="push_notifications" />
          </div>
        </div>

        {isSuperAdmin && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase flex items-center gap-2">
              <Key size={16} />
              {t("settings.credentials_config")}
            </h4>
            <NotificationCredentialsConfig />
          </div>
        )}

        {!isSuperAdmin && (
          <>
            <div>
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase">🔔 {t("settings.enable_push")}</h4>
              <PushNotificationButton />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase">📧 {t("settings.configure_email")}</h4>
              <EmailNotificationButton />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition"
        >
          <Save size={18} />
          {t("common.save")}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 font-bold transition"
          >
            {t("common.close")}
          </button>
        )}
      </div>

      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3 text-center font-bold">✓ {t("common.saved_success")}</p>}
    </div>
  );
};

export default NotificationSettings;
