import React, { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, FileUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ModelManagementProps {
  onClose: () => void;
}

const ModelManagement: React.FC<ModelManagementProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const transactionFileRef = useRef<HTMLInputElement>(null);
  const goalsFileRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileUpload = async (file: File, modelType: 'transacoes' | 'metas') => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadStatus({
        type: 'error',
        message: 'Apenas arquivos .xlsx e .xls são permitidos'
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelType', modelType);

    try {
      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus({
          type: 'success',
          message: `Modelo ${modelType === 'transacoes' ? 'Transações' : 'Metas'} atualizado com sucesso!`
        });
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Erro ao fazer upload do arquivo'
        });
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Erro na conexão. Tente novamente'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Upload size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            Gerenciar Modelos
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>

        {uploadStatus.type && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            uploadStatus.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {uploadStatus.type === 'success' ? <Check size={20} /> : <X size={20} />}
            {uploadStatus.message}
          </div>
        )}

        <div className="space-y-4">
          {/* Transações */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              📊 Modelo de Transações
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Faça upload de um arquivo Excel com suas transações (intervalo A9:G124)
            </p>
            <button
              onClick={() => transactionFileRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition font-bold text-sm border border-blue-100 dark:border-blue-800 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
              Fazer Upload
            </button>
            <input
              ref={transactionFileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'transacoes');
                }
              }}
              className="hidden"
            />
          </div>

          {/* Metas */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              🎯 Modelo de Metas
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Faça upload de um arquivo Excel com suas metas
            </p>
            <button
              onClick={() => goalsFileRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition font-bold text-sm border border-green-100 dark:border-green-800 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
              Fazer Upload
            </button>
            <input
              ref={goalsFileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0], 'metas');
                }
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelManagement;
