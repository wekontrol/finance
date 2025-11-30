import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { RateProvider } from '../types';
import { Check, Loader2 } from 'lucide-react';

interface CurrencyProviderSettingsProps {
  currentProvider: RateProvider;
  onProviderChange: (provider: RateProvider) => void;
}

const CurrencyProviderSettings: React.FC<CurrencyProviderSettingsProps> = ({ 
  currentProvider, 
  onProviderChange 
}) => {
  const { t } = useLanguage();
  const [selectedProvider, setSelectedProvider] = useState<RateProvider>(currentProvider);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const providers: RateProvider[] = ['EXCHANGERATE_API', 'FAWAZ_AHMED', 'BNA', 'FOREX', 'PARALLEL'];

  const providerInfo: Record<RateProvider, { name: string; description: string; icon: string }> = {
    EXCHANGERATE_API: { 
      name: 'ExchangeRate-API', 
      description: 'Open Access - Sem limites',
      icon: '🌐'
    },
    FAWAZ_AHMED: { 
      name: 'Fawaz Ahmed', 
      description: 'Open Source - Sem limites',
      icon: '⚡'
    },
    BNA: { 
      name: 'BNA', 
      description: 'Banco Nacional de Angola',
      icon: '🏦'
    },
    FOREX: { 
      name: 'FOREX', 
      description: 'Mercado Forex',
      icon: '💱'
    },
    PARALLEL: { 
      name: 'Mercado Paralelo', 
      description: 'Taxa de mercado negro',
      icon: '📊'
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/default-currency-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: selectedProvider })
      });

      if (response.ok) {
        onProviderChange(selectedProvider);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving currency provider:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Seleccione o Provedor</label>
      
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {providers.map((provider) => (
          <button
            key={provider}
            onClick={() => setSelectedProvider(provider)}
            className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-bold transition active:scale-95 flex-1 min-w-max ${
              selectedProvider === provider
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="mr-2">{providerInfo[provider].icon}</span>
            {providerInfo[provider].name}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <strong>{providerInfo[selectedProvider].name}:</strong> {providerInfo[selectedProvider].description}
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || selectedProvider === currentProvider}
        className={`w-full py-3 rounded-lg font-bold text-white transition flex items-center justify-center gap-2 ${
          isSaving || selectedProvider === currentProvider
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {isSaving && <Loader2 size={18} className="animate-spin" />}
        ✓ {isSaving ? 'Salvando...' : 'Confirmar Seleção'}
      </button>

      {saved && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg flex items-center gap-2">
          <Check size={16} /> Provedor actualizado com sucesso!
        </div>
      )}
    </div>
  );
};

export default CurrencyProviderSettings;
