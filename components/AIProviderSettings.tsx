import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, Loader2 } from 'lucide-react';

interface AIProviderSettingsProps {
  onClose?: () => void;
}

const AI_FUNCTIONS = [
  { id: 'categorize', label: 'Categorização de Transações' },
  { id: 'financial_advice', label: 'Dicas Financeiras' },
  { id: 'analyze_behavior', label: 'Análise de Comportamento' },
  { id: 'analyze_waste', label: 'Análise de Desperdícios' },
  { id: 'chat', label: 'Chat com IA' },
  { id: 'chat_streaming', label: 'Chat Streaming (Tempo Real)' },
  { id: 'parse_text', label: 'Parsing de Texto' },
  { id: 'parse_audio', label: 'Parsing de Áudio' },
  { id: 'parse_receipt', label: 'Parsing de Recibos' },
  { id: 'suggest_budgets', label: 'Sugestão de Orçamentos' },
  { id: 'analyze_loan', label: 'Análise de Empréstimos' }
];

const PROVIDERS = [
  { id: 'google_gemini', label: 'Google Gemini', color: 'bg-blue-100 text-blue-800' },
  { id: 'puter', label: 'Puter', color: 'bg-purple-100 text-purple-800' },
  { id: 'openrouter', label: 'OpenRouter', color: 'bg-orange-100 text-orange-800' },
  { id: 'groq', label: 'Groq', color: 'bg-emerald-100 text-emerald-800' }
];

const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [functionProviders, setFunctionProviders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadFunctionProviders();
  }, []);

  const loadFunctionProviders = async () => {
    try {
      const response = await fetch('/api/settings/ai-function-providers', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFunctionProviders(data);
      }
    } catch (error) {
      console.error('Error loading function providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (functionId: string, provider: string) => {
    setFunctionProviders(prev => ({
      ...prev,
      [functionId]: provider
    }));

    setSaving(true);
    try {
      const response = await fetch('/api/settings/ai-function-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          functionName: functionId,
          provider: provider
        })
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="animate-spin inline text-blue-600" size={24} />
        <p className="text-slate-600 mt-2">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 Selecione qual provedor IA você prefere para cada funcionalidade. Você economiza usando Groq (gratuito) ou Puter em funções específicas!
        </p>
      </div>

      <div className="grid gap-4">
        {AI_FUNCTIONS.map(func => (
          <div key={func.id} className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-white">{func.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ID: {func.id}</p>
              </div>
              
              <select
                value={functionProviders[func.id] || 'google_gemini'}
                onChange={(e) => handleProviderChange(func.id, e.target.value)}
                disabled={saving}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {saved && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2">
          ✅ Configuração salva com sucesso!
        </div>
      )}
    </div>
  );
};

export default AIProviderSettings;
