import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface BudgetCategory {
  category: string;
  limit: number;
}

interface BudgetDefaultsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currencyFormatter: (value: number) => string;
}

const BudgetDefaultsManager: React.FC<BudgetDefaultsManagerProps> = ({
  isOpen,
  onClose,
  currencyFormatter
}) => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDefaults();
    }
  }, [isOpen]);

  const loadDefaults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/budget/defaults', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading defaults:', error);
      alert('Erro ao carregar categorias padrão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (index: number, field: keyof BudgetCategory, value: any) => {
    const updated = [...categories];
    if (field === 'limit') {
      updated[index][field] = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setCategories(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/budget/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categories })
      });

      if (response.ok) {
        alert('Categorias padrão atualizadas com sucesso!');
        onClose();
      } else {
        alert('Erro ao salvar categorias');
      }
    } catch (error) {
      console.error('Error saving defaults:', error);
      alert('Erro ao salvar: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Tem certeza que deseja resetar TODOS os orçamentos para os valores padrão? Esta ação não pode ser desfeita.')) {
      setIsResetting(true);
      try {
        const response = await fetch('/api/budget/reset', {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          alert('✅ Orçamentos resetados com sucesso! Você agora tem 16 categorias padrão.');
          loadDefaults();
          window.location.reload();
        } else {
          alert('Erro ao resetar orçamentos');
        }
      } catch (error) {
        console.error('Error resetting budgets:', error);
        alert('Erro ao resetar: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsResetting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Gerenciar Categorias Padrão
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <X size={24} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-primary-500" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((cat, index) => (
                  <div key={`${cat.category}-${index}`} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase">
                        {cat.category}
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={cat.limit}
                      onChange={(e) => handleCategoryChange(index, 'limit', e.target.value)}
                      className="w-24 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-right font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400 w-8">Kz</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3 justify-end">
            <button
              onClick={handleReset}
              disabled={isSaving || isResetting}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 font-bold transition disabled:opacity-50 flex items-center gap-2"
            >
              {isResetting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
              {isResetting ? 'Resetando...' : 'Resetar Tudo'}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BudgetDefaultsManager;
