import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { User, UserRole } from '../types';
import { Languages, Plus, Save, Loader2, AlertTriangle, BarChart3, Search, Filter, Download, Upload, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';

interface Translation {
  language: string;
  key: string;
  value: string;
  created_by: string;
  updated_at: string;
}

interface TranslationManagerProps {
  currentUser: User;
}

interface LanguageStat {
  language: string;
  total: number;
  translated: number;
  percentage: number;
}

const TranslationManager: React.FC<TranslationManagerProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [languages, setLanguages] = useState<string[]>(['pt', 'en', 'es', 'um', 'ln', 'fr']);
  const [stats, setStats] = useState<LanguageStat[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showUntranslated, setShowUntranslated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Language names mapping - dynamic to support new languages
  const languageNames: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    um: 'Umbundu',
    ln: 'Lingala',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    zh: '中文',
    ar: 'العربية',
    ru: 'Русский'
  };
  
  const getLanguageName = (code: string) => {
    return languageNames[code] || code.toUpperCase();
  };

  // Check access - with safety check
  const hasAccess = currentUser?.role === UserRole.TRANSLATOR || currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (hasAccess) {
      loadTranslations();
      loadLanguages();
      loadStats();
    }
  }, []);

  const loadTranslations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/translations/editor/all');
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
      }
    } catch (error) {
      console.error('Erro ao carregar traduções:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLanguages = async () => {
    try {
      const response = await fetch('/api/translations/languages');
      if (response.ok) {
        const data = await response.json();
        setLanguages(data);
      }
    } catch (error) {
      console.error('Erro ao carregar idiomas:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/translations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSaveTranslation = async (key: string) => {
    setIsSaving(true);
    try {
      for (const lang of languages) {
        const value = editingValues[`${lang}-${key}`];
        if (value !== undefined) {
          await fetch('/api/translations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang, key, value })
          });
        }
      }
      setEditingKey(null);
      setEditingValues({});
      loadTranslations();
      loadStats();
    } catch (error) {
      console.error('Erro ao salvar tradução:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLanguage = async () => {
    if (!newLanguage.trim()) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/translations/language/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLanguage, baseLanguage: 'pt' })
      });
      if (response.ok) {
        setNewLanguage('');
        loadLanguages();
        loadTranslations();
      }
    } catch (error) {
      console.error('Erro ao adicionar idioma:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Export functionality
  const handleExport = async () => {
    try {
      setIsSaving(true);
      
      // Se translations estiver vazio, carregar do backend
      let transData = translations;
      if (transData.length === 0) {
        console.log('Translations vazio no state, carregando do backend...');
        const response = await fetch('/api/translations/editor/all');
        if (response.ok) {
          transData = await response.json();
          console.log('Dados carregados do backend:', transData.length, 'chaves');
        } else {
          throw new Error('Falha ao carregar traduções');
        }
      }

      const zip = new JSZip();
      const allKeys = [...new Set(transData.map(t => t.key))];
      console.log('Total de chaves:', allKeys.length);

      for (const lang of languages) {
        const langData: Record<string, string> = {};
        allKeys.forEach(key => {
          const trans = transData.find(t => t.language === lang && t.key === key);
          langData[key] = trans?.value || '';
        });
        
        console.log(`JSON para ${lang}:`, Object.keys(langData).length, 'chaves');
        zip.file(`${lang}.json`, JSON.stringify(langData, null, 2));
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      console.log('ZIP size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        setImportMessage({ type: 'error', text: "ZIP vazio! Dados não foram carregados." });
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `traducoes-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setImportMessage({ type: 'success', text: t("translations.export_success") + ` (${allKeys.length} chaves)` });
      setTimeout(() => setImportMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      setImportMessage({ type: 'error', text: t("translations.export_error") + ': ' + (error as any).message });
    } finally {
      setIsSaving(false);
    }
  };

  // Import functionality
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      console.log('Import iniciado com arquivo:', file.name);
      
      const zip = new JSZip();
      const loaded = await zip.loadAsync(file);
      console.log('ZIP carregado com', Object.keys(loaded.files).length, 'ficheiros');
      
      let importedCount = 0;
      const allKeys = [...new Set(translations.map(t => t.key))];
      console.log('Total de chaves esperadas:', allKeys.length);

      for (const lang of languages) {
        const jsonFile = loaded.file(`${lang}.json`);
        if (jsonFile) {
          const content = await jsonFile.async('text');
          const data = JSON.parse(content);
          console.log(`Importando ${lang}:`, Object.keys(data).length, 'chaves no arquivo');

          for (const key of allKeys) {
            if (data[key] && data[key].trim()) {
              const response = await fetch('/api/translations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: lang, key, value: data[key] })
              });
              if (response.ok) {
                importedCount++;
              }
            }
          }
        } else {
          console.warn(`Ficheiro ${lang}.json não encontrado no ZIP`);
        }
      }

      console.log('Total importado:', importedCount);
      setImportMessage({ 
        type: 'success', 
        text: t("translations.import_success") + ` (${importedCount} ${t("translations.keys")})`
      });
      loadTranslations();
      loadStats();
      
      setTimeout(() => setImportMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao importar:', error);
      setImportMessage({ type: 'error', text: t("translations.import_error") + ': ' + (error as any).message });
    } finally {
      setIsImporting(false);
    }
  };

  // Get unique keys
  const allKeys = [...new Set(translations.map(t => t.key))];

  // Get categories
  const categories = [...new Set(allKeys.map(k => k.split('.')[0]))];

  // Filter keys
  let filteredKeys = allKeys.filter(k => 
    (searchKey === '' || k.toLowerCase().includes(searchKey.toLowerCase())) &&
    (filterCategory === '' || k.startsWith(filterCategory + '.'))
  );

  if (showUntranslated) {
    filteredKeys = filteredKeys.filter(key => 
      languages.some(lang => 
        !translations.find(t => t.language === lang && t.key === key && t.value.trim())
      )
    );
  }

  if (!hasAccess) {
    return (
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-8 text-center">
        <AlertTriangle className="mx-auto text-rose-600 mb-4" size={32} />
        <h3 className="text-lg font-bold text-rose-700 dark:text-rose-300 mb-2">{t("translations.access_denied")}</h3>
        <p className="text-sm text-rose-600 dark:text-rose-400">{t("translations.translator_only")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">🌐 {t("sidebar.translations")}</h1>
        <p className="text-slate-600 dark:text-slate-400">{t("translations.manager_title")}</p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Languages className="text-primary-600" size={24} />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t("translations.manager_title")}</h2>
      </div>

      {/* Import Message */}
      {importMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          importMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <CheckCircle size={20} />
          <span className="text-sm font-bold">{importMessage.text}</span>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(stat => (
          <div key={stat.language} className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/20 rounded-2xl p-4 border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase">{stat.language}</span>
              <BarChart3 size={14} className="text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-primary-900 dark:text-primary-100">{stat.percentage}%</div>
            <p className="text-xs text-primary-600 dark:text-primary-400">{stat.translated}/{stat.total} {t("translations.keys")}</p>
            <div className="mt-2 bg-primary-200 dark:bg-primary-900/50 rounded-full h-1">
              <div className="bg-primary-600 h-1 rounded-full transition-all" style={{ width: `${stat.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Export/Import Buttons */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t("translations.import_export")}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold transition"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {t("translations.export_json")}
          </button>

          <label className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold transition cursor-pointer">
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {t("translations.import_json")}
            <input
              type="file"
              accept=".zip"
              onChange={handleImportFile}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">{t("translations.import_export_tip")}</p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 space-y-4">
        {/* Language Selector + Add Language */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">
              {t("translations.add_language")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value.toLowerCase())}
                placeholder={t("translations.language_code_placeholder")}
                className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button
                onClick={handleAddLanguage}
                disabled={isSaving}
                className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">
              {t("translations.search_keys")}
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder={t("translations.search_placeholder")}
                className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">
              {t("translations.filter_category")}
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">{t("translations.all_categories")}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <input
                type="checkbox"
                checked={showUntranslated}
                onChange={(e) => setShowUntranslated(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t("translations.show_untranslated")}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Multi-Language Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto text-primary-600" size={32} />
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {t("translations.no_results")}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-900/50 z-10">
                  {t("translations.key")}
                </th>
                {languages.map(lang => (
                  <th key={lang} className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {getLanguageName(lang)}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400">{t("translations.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredKeys.map(key => (
                <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-3 text-sm font-mono text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800 z-10">
                    {key}
                  </td>
                  {languages.map(lang => {
                    const translation = translations.find(t => t.language === lang && t.key === key);
                    const isEditing = editingKey === key;
                    const value = editingValues[`${lang}-${key}`] !== undefined 
                      ? editingValues[`${lang}-${key}`]
                      : (translation?.value || '');
                    const isEmpty = !translation?.value?.trim();

                    return (
                      <td key={`${lang}-${key}`} className="px-4 py-3 text-sm">
                        {isEditing ? (
                          <textarea
                            value={value}
                            onChange={(e) => setEditingValues({ ...editingValues, [`${lang}-${key}`]: e.target.value })}
                            className="w-full p-2 rounded border border-primary-300 dark:border-primary-700 dark:bg-slate-700 dark:text-white text-sm resize-none"
                            rows={2}
                          />
                        ) : (
                          <div className={`p-2 rounded ${isEmpty ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}>
                            {value || <span className="italic">{t("translations.missing")}</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    {editingKey === key ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveTranslation(key)}
                          disabled={isSaving}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          {t("translations.save")}
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600"
                        >
                          {t("translations.cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingKey(key);
                          const newValues: Record<string, string> = {};
                          languages.forEach(lang => {
                            const trans = translations.find(t => t.language === lang && t.key === key);
                            newValues[`${lang}-${key}`] = trans?.value || '';
                          });
                          setEditingValues(newValues);
                        }}
                        className="px-3 py-1 bg-primary-600 text-white rounded text-xs font-bold hover:bg-primary-700"
                      >
                        {t("translations.edit")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TranslationManager;
