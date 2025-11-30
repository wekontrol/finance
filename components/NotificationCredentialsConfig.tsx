import React, { useState, useEffect } from 'react';
import { Key, Save, AlertCircle, Check } from 'lucide-react';

const NotificationCredentialsConfig: React.FC = () => {
  const [sendgridKey, setSendgridKey] = useState('');
  const [sendgridEmail, setSendgridEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/settings/notification-config');
      if (res.ok) {
        const data = await res.json();
        setSendgridKey(data.sendgridKeyExists ? '••••••••••••••••' : '');
        setSendgridEmail(data.sendgridFromEmail || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/settings/notification-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendgridKey: sendgridKey !== '••••••••••••••••' ? sendgridKey : undefined,
          sendgridEmail
        })
      });

      if (res.ok) {
        setSaved(true);
        setMessage({ type: 'success', text: '✓ Configuração salva com sucesso!' });
        setTimeout(() => setSaved(false), 3000);
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar configuração' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
        <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>SendGrid (Opcional):</strong> Configure suas credenciais para ativar envio de emails real. Sem isso, emails serão apenas registados em logs.
        </p>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">SendGrid API Key</label>
        <input
          type="password"
          value={sendgridKey}
          onChange={(e) => setSendgridKey(e.target.value)}
          placeholder="SG.xxxxxxxxxxxx..."
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Obtenha em: https://app.sendgrid.com/settings/api_keys
        </p>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">Email de Origem</label>
        <input
          type="email"
          value={sendgridEmail}
          onChange={(e) => setSendgridEmail(e.target.value)}
          placeholder="noreply@sua-empresa.com"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Email que aparecerá como remetente
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition flex items-center justify-center gap-2"
      >
        <Save size={18} />
        Salvar Credenciais
      </button>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          }`}
        >
          {message.type === 'success' && <Check size={16} />}
          {message.text}
        </div>
      )}
    </div>
  );
};

export default NotificationCredentialsConfig;
