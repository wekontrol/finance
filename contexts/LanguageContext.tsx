import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'en' | 'es' | 'um' | 'ln' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fallback hardcoded translations (for login screen before JSON loads)
const fallbackTranslations = {
  pt: {
    // Login
    'login.title': 'Gestão Financeira',
    'login.subtitle': 'Gestão Financeira Familiar',
    'login.username': 'Usuário',
    'login.password': 'Senha',
    'login.enter': 'Entrar',
    'login.forgotPassword': 'Esqueci minha senha',
    'login.createFamily': 'Criar Família',
    'login.language': 'Idioma',
    'login.select_language': 'Selecionar idioma...',
    'login.portuguese': 'Português',
    'login.english': 'English',
    'login.spanish': 'Español',
    'login.umbundu': 'Umbundu',
    'login.lingala': 'Lingala',

    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.transactions': 'Transações',
    'sidebar.budget': 'Orçamentos',
    'sidebar.goals': 'Metas',
    'sidebar.inflation': 'Inflação',
    'sidebar.simulations': 'Simulações',
    'sidebar.family': 'Família',
    'sidebar.translations': 'Traduções',
    'sidebar.settings': 'Configurações',
    'sidebar.logout': 'Sair',
    'sidebar.role.superadmin': 'Super Admin',
    'sidebar.role.admin': 'Administrador',
    'sidebar.role.manager': 'Gestor Familiar',
    'sidebar.role.translator': 'Tradutor',
    'sidebar.role.member': 'Membro',

    // Dashboard
    'dashboard.title': 'Painel Geral',
    'dashboard.overview': 'Visão Geral',
    'dashboard.financial_health': 'Saúde financeira.',
    'dashboard.behavioral_analysis': 'Análise Comportamental',
    'dashboard.waste_analysis': 'Análise de Desperdício',
    'dashboard.expenses_by_category': '📊 Despesas por Categoria',
    'dashboard.income': 'Receitas',
    'dashboard.expenses': 'Despesas',
    'dashboard.balance': 'Saldo',
    'dashboard.balance_liquid': 'Saldo Líquido',
    'dashboard.aiAdvice': 'Conselho de IA',
    'dashboard.analyzing': 'Analisando suas finanças com IA...',
    'dashboard.analyzing_dot': 'Analisando...',
    'dashboard.analyze': 'Analisar',
    'dashboard.analyzeBehavior': 'Analisar Padrão',
    'dashboard.analyzeWaste': 'Analisar Desperdício',
    'dashboard.forecast': 'Prever',
    'dashboard.predicting': 'Prevendo...',
    'dashboard.alerts': 'Alertas',
    'dashboard.excellent': '✨ Ótimo',
    'dashboard.good': '⚠️ Bom',
    'dashboard.critical': '🚨 Crítico',
    'dashboard.thisMonth': 'Este Mês',
    'dashboard.thisYear': 'Este Ano',
    'dashboard.7days': '7 Dias',
    'dashboard.current_month': 'Mês Atual',
    'dashboard.current_year': 'Ano Atual',
    'dashboard.allTime': 'Tudo',
    'dashboard.monthly': 'Mensal',
    'dashboard.annual': 'Anual',
    'dashboard.last7days': 'Últimos 7 Dias',
    'dashboard.myNotifications': 'Minhas Notificações',
    'dashboard.waste_indicators': 'Sinais de Desperdício',
    'dashboard.click_analyze': 'Clique em "Analisar" para detectar desperdícios',
    'dashboard.click_forecast': 'Clique em "Prever" para análise dos próximos 3 meses',

    // Transactions
    'transactions.title': 'Transações',
    'transactions.new': 'Nova Transação',
    'transactions.history': 'Histórico',
    'transactions.subscriptions': 'Subscrições',
    'transactions.search': 'Pesquisar',
    'transactions.edit': 'Editar Transação',
    'transactions.delete': 'Excluir?',
    'transactions.description': 'Descrição',
    'transactions.amount': 'Valor',
    'transactions.type': 'Tipo',
    'transactions.category': 'Categoria',
    'transactions.date': 'Data',
    'transactions.attachment': 'Anexo',
    'transactions.recurring': 'Repetindo',
    'transactions.frequency': 'Frequência',
    'transactions.monthly': 'Mensal',
    'transactions.weekly': 'Semanal',
    'transactions.biweekly': 'Quinzenal',
    'transactions.quarterly': 'Trimestral',
    'transactions.yearly': 'Anual',
    'transactions.add': 'Adicionar',
    'transactions.update': 'Atualizar',
    'transactions.cancel': 'Cancelar',
    'transactions.export': 'Exportar',
    'transactions.csv': 'CSV',
    'transactions.pdf': 'PDF',
    'transactions.note': 'Você só pode editar suas próprias transações.',

    // Budget
    'budget.title': 'Orçamentos',
    'budget.add': 'Adicionar Orçamento',
    'budget.category': 'Categoria',
    'budget.limit': 'Limite',
    'budget.spent': 'Gasto',
    'budget.remaining': 'Restante',
    'budget.delete': 'Excluir',
    'budget.save': 'Guardar',

    // Goals
    'goals.title': 'Metas',
    'goals.new': 'Nova Meta',
    'goals.name': 'Nome',
    'goals.target': 'Alvo',
    'goals.current': 'Atual',
    'goals.contribution': 'Contribuição',
    'goals.delete': 'Excluir',
    'goals.addContribution': 'Adicionar Contribuição',

    // Admin
    'admin.title': 'Administração',
    'admin.appName': 'Nome da App',
    'admin.users': 'Utilizadores',
    'admin.backup': 'Backup',
    'admin.settings': 'Configurações',
    'admin.addUser': 'Adicionar Utilizador',
    'admin.editUser': 'Editar Utilizador',
    'admin.deleteUser': 'Excluir Utilizador',
    'admin.manualBackup': 'Backup Manual',
    'admin.lastBackup': 'Último Backup',
    'admin.autoBackup': 'Auto Backup',
    'admin.aiIntegration': 'Integração IA',
    'admin.geminiKey': 'Chave Gemini',
    'admin.save': 'Guardar',
    'admin.saved': 'Guardado!',

    // Family Mode
    'family.title': 'Família',
    'family.tasks': 'Tarefas',
    'family.events': 'Eventos',
    'family.addTask': 'Adicionar Tarefa',
    'family.addEvent': 'Adicionar Evento',
    'family.complete': 'Concluir',
    'family.delete': 'Excluir',
    'family.selectMembers': 'Selecionar Membros',
    'family.noData': 'Dados Mascarados',

    // InflationControl
    'inflation.title': 'Inflação',
    'inflation.purchaseAmount': 'Valor de Compra',
    'inflation.realValue': 'Valor Real',
    'inflation.currentRate': 'Taxa Atual',
    'inflation.baseCurrency': 'Moeda Base',
    'inflation.targetCurrency': 'Moeda Alvo',
    'inflation.period': 'Período',
    'inflation.swap': 'Trocar',

    // Simulations
    'simulations.title': 'Simulações',
    'simulations.loanAmount': 'Valor do Empréstimo',
    'simulations.interestRate': 'Taxa de Juros',
    'simulations.termMonths': 'Duração (Meses)',
    'simulations.calculate': 'Calcular',
    'simulations.save': 'Guardar',
    'simulations.delete': 'Excluir',
    'simulations.system': 'Sistema',
    'simulations.uploadPDF': 'Carregar PDF',

    // InflationControl messages
    'inflation.maintainsRates': 'BNA mantém taxas inalteradas.',
    'inflation.basketRises': 'Cesta básica sobe 2.3%.',
    'inflation.highVolatility': 'Alta volatilidade no mercado paralelo.',
    'inflation.transportInflation': 'Transportes impulsionam inflação.',

    // General
    'app.dashboard': 'Dashboard',
    'app.transactions': 'Transações',
    'app.goals': 'Metas',
    'app.family': 'Família',
    'app.admin': 'Administrador',
    'app.budget': 'Orçamento',
    'app.inflation': 'Inflação',
    'app.simulations': 'Simulações',
    'app.logout': 'Sair',
    'app.settings': 'Configurações',
  },
  en: {
    // Login
    'login.title': 'Financial Management',
    'login.subtitle': 'Family Financial Management',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.enter': 'Login',
    'login.forgotPassword': 'Forgot password',
    'login.createFamily': 'Create Family',
    'login.language': 'Language',
    'login.select_language': 'Select language...',
    'login.portuguese': 'Português',
    'login.english': 'English',
    'login.spanish': 'Español',
    'login.umbundu': 'Umbundu',
    'login.lingala': 'Lingala',

    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.transactions': 'Transactions',
    'sidebar.budget': 'Budget',
    'sidebar.goals': 'Goals',
    'sidebar.inflation': 'Inflation',
    'sidebar.simulations': 'Simulations',
    'sidebar.family': 'Family',
    'sidebar.settings': 'Settings',
    'sidebar.logout': 'Logout',
    'sidebar.role.superadmin': 'Super Admin',
    'sidebar.role.admin': 'Administrator',
    'sidebar.role.manager': 'Family Manager',
    'sidebar.role.member': 'Member',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.income': 'Income',
    'dashboard.expenses': 'Expenses',
    'dashboard.balance': 'Balance',
    'dashboard.aiAdvice': 'AI Advice',
    'dashboard.analyzing': 'Analyzing your finances with AI...',
    'dashboard.analyzing_dot': 'Analyzing...',
    'dashboard.analyze': 'Analyze',
    'dashboard.analyzeBehavior': 'Analyze Pattern',
    'dashboard.analyzeWaste': 'Analyze Waste',
    'dashboard.forecast': 'Forecast',
    'dashboard.predicting': 'Predicting...',
    'dashboard.alerts': 'Alerts',
    'dashboard.excellent': '✨ Excellent',
    'dashboard.good': '⚠️ Good',
    'dashboard.critical': '🚨 Critical',
    'dashboard.thisMonth': 'This Month',
    'dashboard.thisYear': 'This Year',
    'dashboard.7days': '7 Days',
    'dashboard.allTime': 'All Time',
    'dashboard.monthly': 'Monthly',
    'dashboard.annual': 'Annual',

    // Transactions
    'transactions.title': 'Transactions',
    'transactions.new': 'New Transaction',
    'transactions.history': 'History',
    'transactions.subscriptions': 'Subscriptions',
    'transactions.search': 'Search',
    'transactions.edit': 'Edit Transaction',
    'transactions.delete': 'Delete?',
    'transactions.description': 'Description',
    'transactions.amount': 'Amount',
    'transactions.type': 'Type',
    'transactions.category': 'Category',
    'transactions.date': 'Date',
    'transactions.attachment': 'Attachment',
    'transactions.recurring': 'Recurring',
    'transactions.frequency': 'Frequency',
    'transactions.monthly': 'Monthly',
    'transactions.weekly': 'Weekly',
    'transactions.biweekly': 'Biweekly',
    'transactions.quarterly': 'Quarterly',
    'transactions.yearly': 'Yearly',
    'transactions.add': 'Add',
    'transactions.update': 'Update',
    'transactions.cancel': 'Cancel',
    'transactions.export': 'Export',
    'transactions.csv': 'CSV',
    'transactions.pdf': 'PDF',
    'transactions.note': 'You can only edit your own transactions.',

    // Budget
    'budget.title': 'Budget',
    'budget.add': 'Add Budget',
    'budget.category': 'Category',
    'budget.limit': 'Limit',
    'budget.spent': 'Spent',
    'budget.remaining': 'Remaining',
    'budget.delete': 'Delete',
    'budget.save': 'Save',

    // Goals
    'goals.title': 'Goals',
    'goals.new': 'New Goal',
    'goals.name': 'Name',
    'goals.target': 'Target',
    'goals.current': 'Current',
    'goals.contribution': 'Contribution',
    'goals.delete': 'Delete',
    'goals.addContribution': 'Add Contribution',

    // Admin
    'admin.title': 'Administration',
    'admin.appName': 'App Name',
    'admin.users': 'Users',
    'admin.backup': 'Backup',
    'admin.settings': 'Settings',
    'admin.addUser': 'Add User',
    'admin.editUser': 'Edit User',
    'admin.deleteUser': 'Delete User',
    'admin.manualBackup': 'Manual Backup',
    'admin.lastBackup': 'Last Backup',
    'admin.autoBackup': 'Auto Backup',
    'admin.aiIntegration': 'AI Integration',
    'admin.geminiKey': 'Gemini Key',
    'admin.save': 'Save',
    'admin.saved': 'Saved!',

    // Family Mode
    'family.title': 'Family',
    'family.tasks': 'Tasks',
    'family.events': 'Events',
    'family.addTask': 'Add Task',
    'family.addEvent': 'Add Event',
    'family.complete': 'Complete',
    'family.delete': 'Delete',
    'family.selectMembers': 'Select Members',
    'family.noData': 'Masked Data',

    // InflationControl
    'inflation.title': 'Inflation',
    'inflation.purchaseAmount': 'Purchase Amount',
    'inflation.realValue': 'Real Value',
    'inflation.currentRate': 'Current Rate',
    'inflation.baseCurrency': 'Base Currency',
    'inflation.targetCurrency': 'Target Currency',
    'inflation.period': 'Period',
    'inflation.swap': 'Swap',

    // Simulations
    'simulations.title': 'Simulations',
    'simulations.loanAmount': 'Loan Amount',
    'simulations.interestRate': 'Interest Rate',
    'simulations.termMonths': 'Duration (Months)',
    'simulations.calculate': 'Calculate',
    'simulations.save': 'Save',
    'simulations.delete': 'Delete',
    'simulations.system': 'System',
    'simulations.uploadPDF': 'Upload PDF',

    // InflationControl messages
    'inflation.maintainsRates': 'BNA maintains rates unchanged.',
    'inflation.basketRises': 'Basic basket rises 2.3%.',
    'inflation.highVolatility': 'High market volatility.',
    'inflation.transportInflation': 'Transport drives inflation.',

    // General
    'app.dashboard': 'Dashboard',
    'app.transactions': 'Transactions',
    'app.goals': 'Goals',
    'app.family': 'Family',
    'app.admin': 'Admin',
    'app.budget': 'Budget',
    'app.inflation': 'Inflation',
    'app.simulations': 'Simulations',
    'app.logout': 'Logout',
    'app.settings': 'Settings',
  },
  es: {
    // Login
    'login.title': 'Gestión Financiera',
    'login.subtitle': 'Gestión Financiera Familiar',
    'login.username': 'Usuario',
    'login.password': 'Contraseña',
    'login.enter': 'Entrar',
    'login.forgotPassword': 'Olvidé mi contraseña',
    'login.createFamily': 'Crear Familia',
    'login.language': 'Idioma',
    'login.select_language': 'Seleccionar idioma...',
    'login.portuguese': 'Português',
    'login.english': 'English',
    'login.spanish': 'Español',
    'login.umbundu': 'Umbundu',
    'login.lingala': 'Lingala',

    // Sidebar
    'sidebar.dashboard': 'Panel de Control',
    'sidebar.transactions': 'Transacciones',
    'sidebar.budget': 'Presupuesto',
    'sidebar.goals': 'Objetivos',
    'sidebar.inflation': 'Inflación',
    'sidebar.simulations': 'Simulaciones',
    'sidebar.family': 'Familia',
    'sidebar.settings': 'Configuración',
    'sidebar.logout': 'Cerrar Sesión',
    'sidebar.role.superadmin': 'Super Admin',
    'sidebar.role.admin': 'Administrador',
    'sidebar.role.manager': 'Gestor Familiar',
    'sidebar.role.member': 'Miembro',

    // Dashboard
    'dashboard.title': 'Panel de Control',
    'dashboard.income': 'Ingresos',
    'dashboard.expenses': 'Gastos',
    'dashboard.balance': 'Saldo',
    'dashboard.aiAdvice': 'Consejo de IA',
    'dashboard.analyzing': 'Analizando sus finanzas con IA...',
    'dashboard.analyzing_dot': 'Analizando...',
    'dashboard.analyze': 'Analizar',
    'dashboard.analyzeBehavior': 'Analizar Patrón',
    'dashboard.analyzeWaste': 'Analizar Desperdicio',
    'dashboard.forecast': 'Pronosticar',
    'dashboard.predicting': 'Pronosticando...',
    'dashboard.alerts': 'Alertas',
    'dashboard.excellent': '✨ Excelente',
    'dashboard.good': '⚠️ Bueno',
    'dashboard.critical': '🚨 Crítico',
    'dashboard.thisMonth': 'Este Mes',
    'dashboard.thisYear': 'Este Año',
    'dashboard.7days': '7 Días',
    'dashboard.allTime': 'Todos los Tiempos',
    'dashboard.monthly': 'Mensual',
    'dashboard.annual': 'Anual',

    // Transactions
    'transactions.title': 'Transacciones',
    'transactions.new': 'Nueva Transacción',
    'transactions.history': 'Historial',
    'transactions.subscriptions': 'Suscripciones',
    'transactions.search': 'Buscar',
    'transactions.edit': 'Editar Transacción',
    'transactions.delete': '¿Eliminar?',
    'transactions.description': 'Descripción',
    'transactions.amount': 'Cantidad',
    'transactions.type': 'Tipo',
    'transactions.category': 'Categoría',
    'transactions.date': 'Fecha',
    'transactions.attachment': 'Archivo',
    'transactions.recurring': 'Repetible',
    'transactions.frequency': 'Frecuencia',
    'transactions.monthly': 'Mensual',
    'transactions.weekly': 'Semanal',
    'transactions.biweekly': 'Quincenal',
    'transactions.quarterly': 'Trimestral',
    'transactions.yearly': 'Anual',
    'transactions.add': 'Agregar',
    'transactions.update': 'Actualizar',
    'transactions.cancel': 'Cancelar',
    'transactions.export': 'Exportar',
    'transactions.csv': 'CSV',
    'transactions.pdf': 'PDF',
    'transactions.note': 'Solo puede editar sus propias transacciones.',

    // Budget
    'budget.title': 'Presupuesto',
    'budget.add': 'Agregar Presupuesto',
    'budget.category': 'Categoría',
    'budget.limit': 'Límite',
    'budget.spent': 'Gastado',
    'budget.remaining': 'Restante',
    'budget.delete': 'Eliminar',
    'budget.save': 'Guardar',

    // Goals
    'goals.title': 'Objetivos',
    'goals.new': 'Nuevo Objetivo',
    'goals.name': 'Nombre',
    'goals.target': 'Meta',
    'goals.current': 'Actual',
    'goals.contribution': 'Contribución',
    'goals.delete': 'Eliminar',
    'goals.addContribution': 'Agregar Contribución',

    // Admin
    'admin.title': 'Administración',
    'admin.appName': 'Nombre de la App',
    'admin.users': 'Usuarios',
    'admin.backup': 'Respaldo',
    'admin.settings': 'Configuración',
    'admin.addUser': 'Agregar Usuario',
    'admin.editUser': 'Editar Usuario',
    'admin.deleteUser': 'Eliminar Usuario',
    'admin.manualBackup': 'Respaldo Manual',
    'admin.lastBackup': 'Último Respaldo',
    'admin.autoBackup': 'Respaldo Automático',
    'admin.aiIntegration': 'Integración IA',
    'admin.geminiKey': 'Clave Gemini',
    'admin.save': 'Guardar',
    'admin.saved': '¡Guardado!',

    // Family Mode
    'family.title': 'Familia',
    'family.tasks': 'Tareas',
    'family.events': 'Eventos',
    'family.addTask': 'Agregar Tarea',
    'family.addEvent': 'Agregar Evento',
    'family.complete': 'Completar',
    'family.delete': 'Eliminar',

    // General
    'app.dashboard': 'Panel de Control',
    'app.transactions': 'Transacciones',
    'app.goals': 'Objetivos',
    'app.family': 'Familia',
    'app.admin': 'Administrador',
    'app.budget': 'Presupuesto',
    'app.inflation': 'Inflación',
    'app.simulations': 'Simulaciones',
    'app.logout': 'Cerrar Sesión',
    'app.settings': 'Configuración',
  },
  um: {
    // Umbundu translations (simplified placeholders - may need native speaker review)
    'login.title': 'Okusundila Ovimali',
    'login.subtitle': 'Okusundila Ovimali wa Elamba',
    'login.username': 'Olusungu',
    'login.password': 'Okusipi',
    'login.enter': 'Okuyingila',
    'login.forgotPassword': 'Nayiseka okusipi',
    'login.createFamily': 'Okwambula Elamba',
    'login.language': 'Oluvali',
    'sidebar.dashboard': 'Oyilo',
    'sidebar.transactions': 'Otegulelo',
    'sidebar.budget': 'Omanyumba',
    'sidebar.goals': 'Ondanda',
    'sidebar.inflation': 'Okuwanduka',
    'sidebar.family': 'Elamba',
    'sidebar.logout': 'Okupumbula',
    'dashboard.title': 'Oyilo',
    'dashboard.income': 'Ongonji',
    'dashboard.expenses': 'Omansende',
    'dashboard.balance': 'Okuwatala',
    'dashboard.analyzing': 'Okusundila ovimali vako...',
    'dashboard.alerts': 'Okulumuka',
    'transactions.title': 'Otegulelo',
    'transactions.new': 'Otegulelo okiliki',
    'transactions.search': 'Okukundeka',
    'budget.title': 'Omanyumba',
    'goals.title': 'Ondanda',
    'goals.new': 'Ondanda iliki',
    'family.title': 'Elamba',
    'admin.title': 'Omusunga',
  },
  ln: {
    // Lingala translations (simplified placeholders - may need native speaker review)
    'login.title': 'Boyambisi ya Mbongo',
    'login.subtitle': 'Boyambisi ya Mbongo ya Libota',
    'login.username': 'Nkombo ya Mosepe',
    'login.password': 'Motele',
    'login.enter': 'Kota',
    'login.forgotPassword': 'Nabosani motele',
    'login.createFamily': 'Wumela Libota',
    'login.language': 'Lokota',
    'sidebar.dashboard': 'Plateau',
    'sidebar.transactions': 'Bandumba',
    'sidebar.budget': 'Mpakatano',
    'sidebar.goals': 'Makanisi',
    'sidebar.inflation': 'Mbalela',
    'sidebar.family': 'Libota',
    'sidebar.logout': 'Kamatá',
    'dashboard.title': 'Plateau',
    'dashboard.income': 'Mbongo ya Koya',
    'dashboard.expenses': 'Mbongo ya Tumba',
    'dashboard.balance': 'Mbongo Oyo Bakala',
    'dashboard.analyzing': 'Kotalaka mbongo na yo...',
    'dashboard.alerts': 'Binduni',
    'transactions.title': 'Bandumba',
    'transactions.new': 'Bandumba ya Sika',
    'transactions.search': 'Yanda',
    'budget.title': 'Mpakatano',
    'goals.title': 'Makanisi',
    'goals.new': 'Kanisi ya Sika',
    'family.title': 'Libota',
    'admin.title': 'Mosepe Monene',
  },
  fr: {
    // French translations - complete translations loaded from fr.json at runtime
    'login.title': 'Gestion Financière',
    'login.subtitle': 'Gestion Financière Familiale',
    'login.username': 'Utilisateur',
    'login.password': 'Mot de passe',
    'login.enter': 'Connexion',
    'login.forgotPassword': 'Mot de passe oublié',
    'login.createFamily': 'Créer une Famille',
    'login.language': 'Langue',
    'sidebar.dashboard': 'Tableau de Bord',
    'sidebar.transactions': 'Transactions',
    'sidebar.budget': 'Budgets',
    'sidebar.goals': 'Objectifs',
    'sidebar.inflation': 'Inflation',
    'sidebar.family': 'Famille',
    'sidebar.translations': 'Traductions',
    'sidebar.settings': 'Paramètres',
    'sidebar.logout': 'Déconnexion',
    'dashboard.title': 'Tableau de Bord',
    'dashboard.income': 'Revenus',
    'dashboard.expenses': 'Dépenses',
    'dashboard.balance': 'Solde',
    'dashboard.analyzing': 'Analyse de vos finances avec l\'IA...',
    'dashboard.alerts': 'Alertes',
    'transactions.title': 'Transactions',
    'transactions.new': 'Nouvelle Transaction',
    'transactions.search': 'Rechercher',
    'budget.title': 'Budgets',
    'goals.title': 'Objectifs',
    'goals.new': 'Nouvel Objectif',
    'family.title': 'Famille',
    'admin.title': 'Administration',
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, initialLanguage = 'pt' }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [jsonTranslations, setJsonTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load translations from JSON files when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/locales/${language}.json`);
        if (response.ok) {
          const data = await response.json();
          setJsonTranslations(data);
        } else {
          console.warn(`Failed to load ${language}.json`);
          setJsonTranslations({});
        }
      } catch (error) {
        console.warn(`Error loading translations for ${language}:`, error);
        setJsonTranslations({});
      } finally {
        setLoading(false);
      }
    };
    
    loadTranslations();
  }, [language]);

  // Update language when initialLanguage prop changes (only on first mount)
  useEffect(() => {
    if (initialLanguage && initialLanguage !== language && !localStorage.getItem('app_language')) {
      setLanguageState(initialLanguage);
    }
  }, []);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.lang = language === 'um' ? 'pt' : language;
  }, [language]);

  // Translation function: JSON first, then fallback to hardcoded
  const t = (key: string): string => {
    // Try JSON translations first (from /public/locales)
    if (jsonTranslations[key]) {
      return jsonTranslations[key];
    }
    // Fallback to hardcoded translations
    return (fallbackTranslations[language] as Record<string, string>)[key] || key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
