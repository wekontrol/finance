import React, { useState } from 'react';
import { Mail, Save, AlertCircle } from 'lucide-react';

interface EmailProfileSettingsProps {
  currentEmail?: string;
  currentUser?: any;
  onUpdate?: (email: string) => void;
}

const EmailProfileSettings: React.FC<EmailProfileSettingsProps> = ({ currentEmail = '', currentUser, onUpdate }) => {
  const [email, setEmail] = useState(currentEmail);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(email);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Mail size={20} className="text-primary-600" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Email para Notificações</h3>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Configure seu email para receber notificações por email quando ativar essa opção.
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu.email@exemplo.com"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition flex items-center justify-center gap-2"
      >
        <Save size={18} />
        Salvar Email
      </button>

      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">✓ Email salvo com sucesso!</p>
        </div>
      )}
    </div>
  );
};

export default EmailProfileSettings;
