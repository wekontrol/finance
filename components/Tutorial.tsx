
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TutorialProps {
  currentUser: User;
  currentView: string;
}

interface Step {
  target: string; // data-tour ID
  title: string;
  content: string;
}

// Mapeamento de passos por visualização
const VIEW_STEPS: Record<string, Step[]> = {
  'global': [
    {
      target: 'sidebar-menu',
      title: 'Menu Principal',
      content: 'Navegue entre as diferentes ferramentas financeiras aqui. Cada aba tem recursos específicos.',
    },
    {
      target: 'theme-toggle',
      title: 'Ajustes Rápidos',
      content: 'Alterne entre modo claro/escuro e mude a moeda de exibição (Kz, USD, EUR) instantaneamente.',
    }
  ],
  'dashboard': [
    {
      target: 'dashboard-cards',
      title: 'Resumo Financeiro',
      content: 'Veja seu saldo, receitas e despesas num relance. Os dados são atualizados em tempo real.',
    }
  ],
  'transactions': [
    {
      target: 'smart-input',
      title: 'IA Generativa',
      content: 'Digite ou fale naturalmente (ex: "Gastei 5000 no almoço") e a IA criará a transação para você.',
    },
    {
      target: 'transactions-tabs',
      title: 'Assinaturas',
      content: 'Alterne para a aba "Assinaturas" para gerenciar seus gastos fixos e recorrentes.',
    },
    {
      target: 'btn-new-transaction',
      title: 'Lançamento Manual',
      content: 'Prefere do jeito clássico? Clique aqui para abrir o formulário detalhado.',
    }
  ],
  'budget': [
    {
      target: 'ai-budget-suggest',
      title: 'Sugestões Inteligentes',
      content: 'Não sabe quanto gastar? Peça para a IA analisar seu histórico e sugerir limites ideais.',
    },
    {
      target: 'budget-cards',
      title: 'Acompanhamento Visual',
      content: 'As barras mostram quanto você já consumiu do orçamento. Fique atento às cores de alerta!',
    }
  ],
  'goals': [
    {
      target: 'btn-new-goal',
      title: 'Realize Sonhos',
      content: 'Crie metas para comprar uma casa, carro ou viajar. Defina um valor e uma data alvo.',
    },
    {
      target: 'goals-grid',
      title: 'Progresso',
      content: 'Acompanhe visualmente o quanto falta para atingir seu objetivo.',
    }
  ],
  'inflation': [
    {
      target: 'inflation-source',
      title: 'Dados Reais',
      content: 'Escolha entre taxas oficiais (BNA), mercado global ou paralelo para simulações realistas.',
    },
    {
      target: 'purchasing-power',
      title: 'Poder de Compra',
      content: 'Descubra quanto seu dinheiro realmente vale hoje comparado ao passado devido à inflação.',
    }
  ],
  'simulations': [
    {
      target: 'pdf-upload',
      title: 'Leitura de Contratos',
      content: 'Envie o PDF da proposta do banco. A IA extrairá as taxas, prazos e valores automaticamente.',
    },
    {
      target: 'saved-simulations',
      title: 'Histórico',
      content: 'Acesse suas simulações salvas anteriormente aqui.',
    }
  ],
  'family': [
    {
      target: 'family-tasks',
      title: 'Tarefas Compartilhadas',
      content: 'Crie listas de compras ou afazeres que todos os membros da família podem ver e marcar.',
    }
  ]
};

const Tutorial: React.FC<TutorialProps> = ({ currentUser, currentView }) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
  const [tutorialType, setTutorialType] = useState<'global' | 'view'>('global');

  useEffect(() => {
    // 1. Verifica Tutorial Global (Primeiro Acesso)
    const globalSeen = localStorage.getItem(`tutorial_global_${currentUser.id}`);
    
    if (!globalSeen) {
      setTutorialType('global');
      setActiveSteps(VIEW_STEPS['global']);
      setIsVisible(true);
      return;
    }

    // 2. Se global já foi visto, verifica tutorial da View Atual
    const viewSeen = localStorage.getItem(`tutorial_${currentView}_${currentUser.id}`);
    const viewSteps = VIEW_STEPS[currentView];

    if (!viewSeen && viewSteps && viewSteps.length > 0) {
      // Pequeno delay para garantir que a tela renderizou
      const timer = setTimeout(() => {
        setTutorialType('view');
        setActiveSteps(viewSteps);
        setCurrentStepIndex(0);
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentUser.id, currentView]);

  useEffect(() => {
    if (!isVisible || activeSteps.length === 0) return;

    // Limpeza de destaques anteriores
    document.querySelectorAll('.ring-4').forEach(el => {
      el.classList.remove('ring-4', 'ring-primary-500', 'ring-offset-4', 'z-[50]', 'relative', 'bg-white', 'dark:bg-slate-800', 'rounded-xl');
    });

    const step = activeSteps[currentStepIndex];
    const element = document.querySelector(`[data-tour="${step.target}"]`);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Adiciona destaque visual com Z-Index 50 (Acima do Backdrop 40)
      element.classList.add('ring-4', 'ring-primary-500', 'ring-offset-4', 'z-[50]', 'relative');
      // Fix para elementos com fundo transparente ficarem legíveis
      if (window.getComputedStyle(element).backgroundColor === 'rgba(0, 0, 0, 0)') {
         element.classList.add('bg-white', 'dark:bg-slate-800', 'rounded-xl');
      }
    }
  }, [currentStepIndex, isVisible, activeSteps]);

  const handleNext = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    
    // Marca como visto
    if (tutorialType === 'global') {
      localStorage.setItem(`tutorial_global_${currentUser.id}`, 'true');
    } else {
      localStorage.setItem(`tutorial_${currentView}_${currentUser.id}`, 'true');
    }

    // Limpa estilos
    document.querySelectorAll('.ring-4').forEach(el => {
      el.classList.remove('ring-4', 'ring-primary-500', 'ring-offset-4', 'z-[50]', 'relative', 'bg-white', 'dark:bg-slate-800', 'rounded-xl');
    });
  };

  if (!isVisible || activeSteps.length === 0) return null;

  const currentStep = activeSteps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-[40] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop Escuro (Z-40, lighter opacity) */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm pointer-events-auto transition-opacity duration-500" onClick={handleClose}></div>

      {/* Card do Tutorial (Z-60 para ficar acima do elemento destacado se colidir, embora o elemento seja z-50) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm m-6 pointer-events-auto relative border-2 border-primary-500/20 animate-scale-in z-[60]">
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-xs font-bold uppercase tracking-wider">
              {tutorialType === 'global' ? t('tutorial.welcome_badge') : t('tutorial.quick_tip_badge')}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {currentStepIndex + 1} / {activeSteps.length}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {currentStep.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={handleClose}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2"
          >
            {t('tutorial.skip_button')}
          </button>
          <button 
            onClick={handleNext}
            className="flex items-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all transform active:scale-95"
          >
            {currentStepIndex === activeSteps.length - 1 ? (
              <>{t('tutorial.finish_button')} <Check size={18} className="ml-2" /></>
            ) : (
              <>{t('tutorial.next_button')} <ChevronRight size={18} className="ml-2" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
