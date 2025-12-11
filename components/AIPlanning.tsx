import React, { useState } from 'react';
import { Brain, Send, Sparkles, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AIPlanning {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

const AIPlanning: React.FC = () => {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<AIPlanning[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPlan = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    const newPlan: AIPlanning = {
      id: `plan_${Date.now()}`,
      title,
      description,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setPlans([newPlan, ...plans]);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setIsLoading(false);
  };

  const toggleStatus = (id: string) => {
    setPlans(plans.map(plan =>
      plan.id === id
        ? { ...plan, status: plan.status === 'completed' ? 'pending' : 'completed' }
        : plan
    ));
  };

  const deletePlan = (id: string) => {
    setPlans(plans.filter(plan => plan.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return '';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return t('planning.priority_high') || 'Alta';
      case 'medium':
        return t('planning.priority_medium') || 'Média';
      case 'low':
        return t('planning.priority_low') || 'Baixa';
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain size={28} className="text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-300">
            {t('planning.title') || 'Planeamento IA'}
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 ml-11">
          {t('planning.subtitle') || 'Planeie suas metas financeiras com inteligência artificial'}
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('planning.plan_title') || 'Título do Plano'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('planning.enter_title') || 'Ex: Economizar 1000 AOA para emergências'}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('planning.description') || 'Descrição'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('planning.enter_description') || 'Descreva seus detalhes do plano...'}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('planning.priority') || 'Prioridade'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              >
                <option value="high">{t('planning.priority_high') || 'Alta'}</option>
                <option value="medium">{t('planning.priority_medium') || 'Média'}</option>
                <option value="low">{t('planning.priority_low') || 'Baixa'}</option>
              </select>
            </div>

            <button
              onClick={handleAddPlan}
              disabled={!title.trim() || isLoading}
              className="col-span-2 md:col-span-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('planning.adding') || 'Adicionando...'}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t('planning.add_plan') || 'Adicionar Plano'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {plans.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Target size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {t('planning.no_plans') || 'Nenhum plano ainda. Comece adicionando um!'}
            </p>
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl p-5 border transition-all duration-300 ${getStatusColor(plan.status)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <input
                      type="checkbox"
                      checked={plan.status === 'completed'}
                      onChange={() => toggleStatus(plan.id)}
                      className="w-5 h-5 rounded cursor-pointer accent-primary-600"
                    />
                    <h3 className={`font-bold text-lg ${plan.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {plan.title}
                    </h3>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getPriorityColor(plan.priority)}`}>
                      {getPriorityLabel(plan.priority)}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm ml-8 mb-2">
                      {plan.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ml-8">
                    <Sparkles size={14} />
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => deletePlan(plan.id)}
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title={t('planning.delete') || 'Deletar'}
                >
                  <AlertCircle size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('planning.total_plans') || 'Total de Planos'}</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{plans.length}</p>
              </div>
              <Target size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{t('planning.completed') || 'Completados'}</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{plans.filter(p => p.status === 'completed').length}</p>
              </div>
              <Sparkles size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">{t('planning.pending') || 'Pendentes'}</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{plans.filter(p => p.status === 'pending').length}</p>
              </div>
              <TrendingUp size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPlanning;
