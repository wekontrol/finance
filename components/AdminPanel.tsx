
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BackupConfig, User, UserRole, UserStatus } from '../types';
import { HardDrive, Save, Server, ChevronDown, ChevronUp, Users, UserPlus, Edit, Trash2, X, Sliders, AlertTriangle, Bell, Shield, Upload, Check, UserCheck, Lock, Unlock, Key, RefreshCw, Bot, Sparkles, CheckCircle, Download, Github, Terminal, Cpu, Network, Loader2, FileText, Languages, ArrowRightLeft, FileUp, PieChart } from 'lucide-react';
import { setGeminiKey, hasGeminiKey } from '../services/geminiService';
import { hasPuterEnabled, setPuterAsDefault } from '../services/puterService';
import { setGroqKey, hasGroqKey } from '../services/groqService';
import { settingsApi, familiesApi } from '../services/api';
import { backupApi } from '../services/backupApi';
import { systemApi } from '../services/systemApi';
import NotificationSettings from './NotificationSettings';
import TranslationManager from './TranslationManager';
import CurrencyProviderSettings from './CurrencyProviderSettings';
import ModelManagement from './ModelManagement';
import AIProviderSettings from './AIProviderSettings';
import BudgetDefaultsManager from './BudgetDefaultsManager';

interface AdminPanelProps {
  appName: string;
  setAppName: (name: string) => void;
  backupConfig: BackupConfig;
  updateBackupConfig: (config: BackupConfig) => void;
  triggerManualBackup: () => void;
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onRestoreBackup: (file: File) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  appName,
  setAppName,
  backupConfig, 
  updateBackupConfig, 
  triggerManualBackup,
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onRestoreBackup
}) => {
  const { t } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<string | null>('users');
  const [localAppName, setLocalAppName] = useState(appName);
  const [localConfig, setLocalConfig] = useState<BackupConfig>(backupConfig);
  const [isSaved, setIsSaved] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  
  // Security / Password State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '', question: '', answer: '' });
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [forceResetPassword, setForceResetPassword] = useState('');

  // AI Integration State
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'openrouter' | 'puter' | 'groq'>(() => {
    return (localStorage.getItem('ai_provider') as 'gemini' | 'openrouter' | 'puter' | 'groq') || 'gemini';
  });

  // Currency Provider State
  const [currencyProvider, setCurrencyProvider] = useState<'BNA' | 'FOREX' | 'PARALLEL'>('BNA');
  
  // Max File Size State (in MB)
  const [maxFileSize, setMaxFileSize] = useState(12);
  const [localMaxFileSize, setLocalMaxFileSize] = useState(12);
  
  // Load currency provider on mount
  useEffect(() => {
    const loadCurrencyProvider = async () => {
      try {
        const response = await fetch('/api/settings/default-currency-provider', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCurrencyProvider(data.provider || 'BNA');
        }
      } catch (error) {
        console.error('Error loading currency provider:', error);
      }
    };
    loadCurrencyProvider();
    
    // Load max file size
    const loadMaxFileSize = async () => {
      try {
        const response = await fetch('/api/settings/max-file-size', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setMaxFileSize(data.maxFileSize || 12);
          setLocalMaxFileSize(data.maxFileSize || 12);
        }
      } catch (error) {
        console.error('Error loading max file size:', error);
      }
    };
    loadMaxFileSize();
  }, []);
  
  // Gemini State
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // OpenRouter State
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState(() => 
    localStorage.getItem('openrouter_model') || 'openai/gpt-3.5-turbo'
  );

  // Groq State
  const [groqKey, setGroqKey] = useState('');

  const [keySaved, setKeySaved] = useState(false);

  // Families State
  const [families, setFamilies] = useState<any[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);

  // Budget Defaults Manager State
  const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState(false);

  // Terms State
  const [termsContent, setTermsContent] = useState('');
  const [termsInput, setTermsInput] = useState('');

  // Terms State
  const [termsLoading, setTermsLoading] = useState(false);

  // System Update State
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'uptodate' | 'error'>('idle');
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem('repo_url') || 'https://github.com/SEU_USUARIO/gestor-financeiro');
  const [remoteVersion, setRemoteVersion] = useState('');

  // Backup State
  const [backupProgress, setBackupProgress] = useState({ current: 0, total: 100, status: 'idle' });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState({ current: 0, total: 100, status: 'idle' });

  // System Update State
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 100, status: 'idle' });

  const [userFormData, setUserFormData] = useState({ 
    name: '', 
    email: '',
    username: '',
    password: '',
    role: UserRole.MEMBER, 
    avatar: '', 
    birthDate: '', 
    allowParentView: false 
  });

  const toggleSection = (section: string) => setExpandedSection(expandedSection === section ? null : section);

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isAdmin = currentUser?.role === UserRole.ADMIN || isSuperAdmin;
  const isManager = currentUser?.role === UserRole.MANAGER;
  const isMember = currentUser?.role === UserRole.MEMBER;

  // Load families on mount
  useEffect(() => {
    if (isSuperAdmin) {
      loadFamilies();
    }
  }, [isSuperAdmin]);

  const loadFamilies = async () => {
    setFamiliesLoading(true);
    try {
      const data = await familiesApi.getAll();
      setFamilies(data);
    } catch (error) {
      console.error('Error loading families:', error);
    } finally {
      setFamiliesLoading(false);
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    if (!confirm('Tem certeza que deseja APAGAR esta família e TODOS os seus dados?\n\nEsta ação é irreversível!')) {
      return;
    }
    try {
      await familiesApi.delete(familyId);
      alert('Família apagada com sucesso!');
      loadFamilies();
    } catch (error: any) {
      alert('Erro ao apagar família: ' + error.message);
    }
  };

  const loadTerms = async () => {
    setTermsLoading(true);
    try {
      const data = await settingsApi.getSetting('terms_of_service');
      setTermsContent(data.value || '');
      setTermsInput(data.value || '');
    } catch (error) {
      console.error('Error loading terms:', error);
    } finally {
      setTermsLoading(false);
    }
  };

  const saveTerms = async () => {
    if (!termsInput.trim()) {
      alert('Termos não podem estar vazios');
      return;
    }
    try {
      await settingsApi.setSetting('terms_of_service', termsInput);
      setTermsContent(termsInput);
      alert('Termos e Condições salvos com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar termos: ' + error.message);
    }
  };

  const visibleUsers = users.filter(u => {
    if (isSuperAdmin || isAdmin) return true;
    if (isManager) return u.familyId === currentUser.familyId;
    if (isMember) return u.id === currentUser.id;
    return false;
  });

  const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);

  const canResetPassword = (targetUser: User) => {
    if (targetUser.id === currentUser.id) return false;
    if (isAdmin) {
       if (targetUser.role === UserRole.MEMBER) return false;
       return true;
    }
    if (isManager) {
      if (targetUser.role === UserRole.MEMBER && targetUser.familyId === currentUser.familyId) return true;
      return false;
    }
    return false;
  };

  const handleGeneralSave = async () => {
    setAppName(localAppName);
    
    // Save max file size if it changed
    if (localMaxFileSize !== maxFileSize && localMaxFileSize > 0 && localMaxFileSize <= 100) {
      try {
        const response = await fetch('/api/settings/max-file-size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ maxFileSize: localMaxFileSize })
        });
        if (response.ok) {
          setMaxFileSize(localMaxFileSize);
        }
      } catch (error) {
        alert('Erro ao salvar limite de arquivo: ' + error);
        return;
      }
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleApiKeySave = async () => {
    if (activeProvider === 'gemini') {
      if (apiKeyInput.trim().length > 10) {
        try {
          await setGeminiKey(apiKeyInput.trim());
          localStorage.setItem('ai_provider', 'gemini');
          showSaveSuccess();
          setApiKeyInput('');
          alert('Chave Gemini salva e será usada por todos os usuários!');
        } catch (error) {
          alert('Erro ao salvar chave: ' + error);
        }
      } else {
        alert("Chave Gemini inválida ou muito curta.");
      }
    } else {
      if (openRouterKey.trim().length > 10) {
        try {
          await settingsApi.saveApiConfig('openrouter', openRouterKey.trim(), openRouterModel.trim() || 'openai/gpt-3.5-turbo');
          localStorage.setItem('ai_provider', 'openrouter');
          showSaveSuccess();
          setOpenRouterKey('');
          alert('Chave OpenRouter salva e será usada por todos os usuários!');
        } catch (error) {
          alert('Erro ao salvar chave: ' + error);
        }
      } else {
        alert("Chave OpenRouter inválida.");
      }
    }
  };

  const showSaveSuccess = () => {
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
  };

  const hasOpenRouterKey = () => {
    return !!localStorage.getItem('openrouter_api_key');
  };

  const requestNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) {
        alert("Seu navegador não suporta notificações.");
        return;
      }
      
      if (Notification.permission === "granted") {
        // Permissão já concedida - mostrar notificação de teste
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            title: appName,
            options: {
              body: "✅ Notificações funcionando perfeitamente!",
              icon: "/icon.png",
              badge: "/icon.png"
            }
          });
        } else {
          new Notification(appName, { 
            body: "✅ Notificações funcionando perfeitamente!" 
          });
        }
        alert("✅ Notificação de teste enviada!");
        return;
      }
      
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(appName, { 
            body: "✅ Notificações ativadas com sucesso!" 
          });
          alert("✅ Notificações ativadas!");
        } else {
          alert("❌ Permissão de notificação negada.");
        }
      } else {
        alert("⚠️ Notificações foram bloqueadas. Altere as permissões do seu navegador.");
      }
    } catch (error: any) {
      console.error("Erro ao requisitar permissão de notificação:", error);
      alert("❌ Erro ao testar notificações: " + error.message);
    }
  };

  const handleResetData = () => {
    if (confirm("PERIGO: Isso apagará TODOS os dados, incluindo todos os usuários e transações. Esta ação é irreversível. Confirmar?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      onUpdateUser({ 
        ...editingUser, 
        name: userFormData.name,
        email: userFormData.email,
        username: userFormData.username,
        avatar: userFormData.avatar,
        birthDate: userFormData.birthDate,
        allowParentView: userFormData.allowParentView,
        role: isAdmin ? userFormData.role : editingUser.role 
      });
    } else {
      if (!userFormData.password) return alert("Senha é obrigatória para novos usuários.");
      onAddUser({
        ...userFormData,
        role: isManager ? UserRole.MEMBER : userFormData.role,
        status: UserStatus.APPROVED, 
        createdBy: currentUser.id,
        familyId: isManager ? currentUser.familyId : undefined,
        allowParentView: userFormData.allowParentView
      });
    }
    setIsUserFormOpen(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.current !== currentUser.password) return alert("Senha atual incorreta.");
    if (passwordForm.new !== passwordForm.confirm) return alert("Novas senhas não coincidem.");
    
    onUpdateUser({
      ...currentUser,
      password: passwordForm.new,
      securityQuestion: passwordForm.question ? { question: passwordForm.question, answer: passwordForm.answer } : currentUser.securityQuestion
    });
    alert("Senha e segurança atualizadas!");
    setPasswordForm({ current: '', new: '', confirm: '', question: '', answer: '' });
  };

  const handleForceReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !forceResetPassword) return;
    
    onUpdateUser({
      ...resetTargetUser,
      password: forceResetPassword
    });
    alert(`Senha de ${resetTargetUser.name} redefinida com sucesso.`);
    setResetTargetUser(null);
    setForceResetPassword('');
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      onDeleteUser(userId);
    }
  };

  const handleApproveUser = (user: User) => {
    onUpdateUser({ ...user, status: UserStatus.APPROVED });
  };

  const handleRejectUser = (user: User) => {
    if(confirm('Rejeitar e remover este usuário?')) onDeleteUser(user.id);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        if(confirm("ATENÇÃO: Restaurar um backup substituirá TODOS os dados atuais. Deseja continuar?")) {
           onRestoreBackup(e.target.files[0]);
        }
     }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 0;
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  // CHECK FOR UPDATES LOGIC
  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      let rawUrl = repoUrl;
      if (repoUrl.includes('github.com')) {
         rawUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com') + '/main/package.json';
      } else if (!repoUrl.endsWith('package.json')) {
         rawUrl = repoUrl + '/package.json';
      }

      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error(t("admin.repo_access_error"));
      
      const remotePkg = await response.json();
      setRemoteVersion(remotePkg.version);

      const currentVersion = '1.0.0'; 
      
      if (remotePkg.version !== currentVersion) {
         setUpdateStatus('available');
      } else {
         setUpdateStatus('uptodate');
      }

    } catch (error) {
      console.error(error);
      setUpdateStatus('error');
    }
  };

  const saveRepoUrl = async () => {
    if (!repoUrl.includes('github.com')) {
      alert('URL do GitHub inválida. Deve incluir "github.com"');
      return;
    }
    try {
      await settingsApi.setSetting('github_repo_url', repoUrl);
      alert('URL do repositório GitHub salva com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar URL: ' + error.message);
    }
  };

  const inputClass = "w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all";

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20 w-full overflow-hidden">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-4 bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-500/20 shrink-0">
           {isSuperAdmin ? <Shield size={32} /> : <Sliders size={32} />}
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            {isManager ? 'Gestão Familiar' : 'Admin'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">
            {isSuperAdmin ? 'Controle Total (Super Admin)' : isAdmin ? 'Gestão de Membros' : 'Gerencie sua família'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Aprovações (Apenas Admins) */}
        {isAdmin && pendingUsers.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center">
              <UserCheck className="mr-2" /> {t("admin.pending_approvals")} ({pendingUsers.length})
            </h3>
            <div className="space-y-2">
              {pendingUsers.map(u => (
                <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-amber-100 dark:border-amber-800 gap-3">
                   <div className="flex items-center gap-3">
                     <img src={u.avatar} className="w-8 h-8 rounded-full" />
                     <span className="text-slate-800 dark:text-white font-medium">{u.name} <span className="text-xs text-slate-400">({u.role})</span></span>
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                     <button onClick={() => handleApproveUser(u)} className="flex-1 sm:flex-none p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 font-bold text-xs flex items-center justify-center"><Check size={14} className="mr-1"/> Aprovar</button>
                     <button onClick={() => handleRejectUser(u)} className="flex-1 sm:flex-none p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 font-bold text-xs flex items-center justify-center"><X size={14} className="mr-1"/> Rejeitar</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. General Settings (Only Admin/Super Admin) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('general')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg mr-4 shrink-0"><Sliders size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("admin.general")}</h3>
              </div>
              {expandedSection === 'general' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'general' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <div className="grid md:grid-cols-2 gap-8">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do App</label>
                     <div className="flex gap-3">
                       <input type="text" value={localAppName} onChange={(e) => setLocalAppName(e.target.value)} className={inputClass} />
                       <button onClick={handleGeneralSave} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-500/20">{isSaved ? 'OK' : 'Salvar'}</button>
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Limite Máx. Anexo (MB)</label>
                     <div className="flex gap-3">
                       <input type="number" min="1" max="100" value={localMaxFileSize} onChange={(e) => setLocalMaxFileSize(parseInt(e.target.value) || 12)} className={inputClass} />
                       <button onClick={handleGeneralSave} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-500/20">{isSaved ? 'OK' : 'Salvar'}</button>
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Alertas</label>
                     <button onClick={requestNotificationPermission} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2"><Bell size={18} /> Testar Notificações</button>
                   </div>
                   {isSuperAdmin && (
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Orçamentos</label>
                       <button onClick={() => setIsBudgetManagerOpen(true)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2"><PieChart size={18} /> Gerenciar Categorias</button>
                     </div>
                   )}
                </div>
                {isSuperAdmin && (
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-rose-500 uppercase mb-2">{t("admin.danger_zone")}</p>
                    <button onClick={handleResetData} className="flex items-center text-rose-600 hover:text-rose-700 font-bold text-sm bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-lg border border-rose-200 dark:border-rose-800"><AlertTriangle size={16} className="mr-2" /> Resetar Dados de Fábrica</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 1.5. Families Management (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('families')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4 shrink-0"><Users size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("admin.manage_families")}</h3>
              </div>
              {expandedSection === 'families' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'families' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                {familiesLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin"><Loader2 size={24} className="text-slate-400" /></div>
                    <p className="text-slate-400 mt-2">{t("admin.loading_families")}</p>
                  </div>
                ) : families.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">{t("admin.no_families")}</p>
                ) : (
                  <div className="grid gap-3">
                    {families.map(family => (
                      <div key={family.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{family.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{family.member_count} membro{family.member_count !== 1 ? 's' : ''} • Criada em {new Date(family.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteFamily(family.id)}
                          disabled={family.id === 'fam_admin'}
                          className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title={family.id === 'fam_admin' ? 'Não pode deletar família padrão' : 'Deletar família'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 1.7. Terms & Conditions (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => { toggleSection('terms'); if (expandedSection !== 'terms') loadTerms(); }} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4 shrink-0"><FileText size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Termos e Condições / Contratos</h3>
              </div>
              {expandedSection === 'terms' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'terms' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                {termsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin"><Loader2 size={24} className="text-slate-400" /></div>
                    <p className="text-slate-400 mt-2">{t("admin.loading_families")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Edite os Termos e Condições que aparecerão durante o registro de novas famílias:</p>
                    <textarea
                      value={termsInput}
                      onChange={(e) => setTermsInput(e.target.value)}
                      placeholder="Digite os Termos e Condições aqui..."
                      className="w-full h-64 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono text-sm resize-none"
                    />
                    <button
                      onClick={saveTerms}
                      className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Salvar Termos e Condições
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. Integrations & AI (Admin Only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('integrations')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-4 shrink-0"><Bot size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Integrações & IA</h3>
              </div>
              {expandedSection === 'integrations' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'integrations' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <div className="max-w-2xl">
                  
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Selecione a IA Padrão</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setActiveProvider('gemini')}
                        className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-bold transition active:scale-95 ${activeProvider === 'gemini' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      >
                        <Sparkles size={18} className="mr-2" /> Google Gemini
                      </button>
                      <button
                        onClick={() => setActiveProvider('openrouter')}
                        className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-bold transition active:scale-95 ${activeProvider === 'openrouter' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      >
                        <Cpu size={18} className="mr-2" /> OpenRouter
                      </button>
                      <button
                        onClick={() => setActiveProvider('puter')}
                        className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-bold transition active:scale-95 ${activeProvider === 'puter' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      >
                        <Network size={18} className="mr-2" /> Puter (Gratuito)
                      </button>
                      <button
                        onClick={() => setActiveProvider('groq')}
                        className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 font-bold transition active:scale-95 ${activeProvider === 'groq' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                      >
                        <Cpu size={18} className="mr-2" /> Groq ⚡
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/settings/default-ai-provider', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ provider: activeProvider })
                          });
                          setKeySaved(true);
                          setTimeout(() => setKeySaved(false), 2000);
                          alert(`✅ ${activeProvider === 'gemini' ? 'Gemini' : activeProvider === 'openrouter' ? 'OpenRouter' : activeProvider === 'groq' ? 'Groq' : 'Puter'} definido como IA padrão!`);
                        } catch (error) {
                          alert('Erro ao confirmar seleção');
                        }
                      }}
                      className="w-full mt-3 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg"
                    >
                      ✓ Confirmar Seleção
                    </button>
                  </div>

                  {activeProvider === 'gemini' && (
                    <div className="animate-fade-in">
                      <h4 className="font-bold mb-2 text-slate-700 dark:text-white flex items-center">
                        <Sparkles className="mr-2 text-yellow-500" size={18} /> {t("admin.gemini_config")}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Utilize a API oficial do Google para análise inteligente e categorização.
                      </p>
                      
                      <div className="flex gap-3 flex-col sm:flex-row">
                        <input 
                          type="password" 
                          placeholder="Cole sua API Key do Gemini aqui" 
                          value={apiKeyInput} 
                          onChange={(e) => setApiKeyInput(e.target.value)} 
                          className={inputClass} 
                        />
                        <button 
                          onClick={handleApiKeySave} 
                          className={`bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center ${keySaved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        >
                          {keySaved ? <Check size={20} /> : 'Salvar'}
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await settingsApi.deleteApiConfig('google_gemini');
                              setApiKeyInput('');
                              alert('Chave Gemini deletada com sucesso!');
                            } catch (error) {
                              alert('Erro ao deletar chave: ' + error);
                            }
                          }}
                          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg flex items-center justify-center"
                          title="Deletar chave salva"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      
                      {hasGeminiKey() && (
                        <p className="mt-2 text-xs font-bold text-emerald-600 flex items-center">
                          <CheckCircle className="mr-1" size={12}/> Chave Gemini configurada e ativa.
                        </p>
                      )}
                      <p className="mt-4 text-xs text-slate-400">
                        Não tem uma chave? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Obter gratuitamente no Google AI Studio</a>.
                      </p>
                    </div>
                  )}

                  {activeProvider === 'openrouter' && (
                    <div className="animate-fade-in">
                      <h4 className="font-bold mb-2 text-slate-700 dark:text-white flex items-center">
                        <Network className="mr-2 text-purple-500" size={18} /> {t("admin.openrouter_config")}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Acesse diversos modelos como GPT-4, Claude 3 e Llama através do OpenRouter.
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
                          <input 
                            type="password" 
                            placeholder="sk-or-v1-..." 
                            value={openRouterKey} 
                            onChange={(e) => setOpenRouterKey(e.target.value)} 
                            className={inputClass} 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo de IA</label>
                          <input 
                            type="text" 
                            placeholder="openai/gpt-3.5-turbo" 
                            value={openRouterModel} 
                            onChange={(e) => setOpenRouterModel(e.target.value)} 
                            className={inputClass} 
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Padrão: openai/gpt-3.5-turbo</p>
                        </div>
                        
                        <button 
                          onClick={handleApiKeySave} 
                          className={`w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center ${keySaved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        >
                          {keySaved ? <Check size={20} className="mr-2" /> : null}
                          {keySaved ? 'Configuração Salva' : 'Salvar Configuração OpenRouter'}
                        </button>
                      </div>

                      {hasOpenRouterKey() && (
                        <p className="mt-2 text-xs font-bold text-emerald-600 flex items-center">
                          <CheckCircle className="mr-1" size={12}/> Chave OpenRouter configurada e ativa.
                        </p>
                      )}
                    </div>
                  )}

                  {activeProvider === 'puter' && (
                    <div className="animate-fade-in">
                      <h4 className="font-bold mb-2 text-slate-700 dark:text-white flex items-center">
                        <Network className="mr-2 text-emerald-500" size={18} /> {t("admin.puter_config")}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Acesso grátis e ilimitado a 400+ modelos de IA (GPT, Claude, Gemini, etc). Sem configuração necessária!
                      </p>
                      
                      <div className="space-y-4 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div>
                          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-2">✨ Recursos Disponíveis:</p>
                          <ul className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                            <li>🤖 Chat com GPT-5, Claude, Gemini e 400+ modelos</li>
                            <li>🎙️ Conversão de áudio em texto (Speech-to-Text)</li>
                            <li>🖼️ Geração e análise de imagens</li>
                            <li>🔊 Síntese de voz (Text-to-Speech)</li>
                            <li>💾 Cloud storage seguro</li>
                            <li>🗄️ Banco de dados NoSQL</li>
                            <li>🆓 Totalmente gratuito para desenvolvedores</li>
                          </ul>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          localStorage.setItem('ai_provider', 'puter');
                          setKeySaved(true);
                          setTimeout(() => setKeySaved(false), 1500);
                        }}
                        className={`w-full mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg flex items-center justify-center ${keySaved ? 'bg-emerald-700' : ''}`}
                      >
                        {keySaved ? <Check size={20} className="mr-2" /> : null}
                        {keySaved ? 'Puter Ativado!' : 'Ativar Puter'}
                      </button>

                      {hasPuterEnabled() && (
                        <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <CheckCircle className="mr-1" size={12}/> Puter configurado e pronto para uso.
                        </p>
                      )}

                      <p className="mt-4 text-xs text-slate-400">
                        📚 Saiba mais em <a href="https://puter.com/" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">puter.com</a> ou <a href="https://docs.puter.com/" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">documentação</a>.
                      </p>
                    </div>
                  )}

                  {activeProvider === 'groq' && (
                    <div className="animate-fade-in">
                      <h4 className="font-bold mb-2 text-slate-700 dark:text-white flex items-center">
                        <Cpu className="mr-2 text-blue-500" size={18} /> {t("admin.groq_config")}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        IA ultra-rápida e gratuita. Llama 3.3 (70B), Mixtral 8x7B e mais. Requisitos: API key do Groq (grátis em groq.com).
                      </p>
                      
                      <div className="flex gap-3 flex-col">
                        <input 
                          type="password" 
                          placeholder="Cole sua API Key do Groq aqui" 
                          value={groqKey} 
                          onChange={(e) => setGroqKey(e.target.value)} 
                          className={inputClass} 
                        />
                        <button 
                          onClick={async () => {
                            if (groqKey.trim().length > 10) {
                              try {
                                await setGroqKey(groqKey.trim());
                                setKeySaved(true);
                                setTimeout(() => setKeySaved(false), 2000);
                                alert('Chave Groq salva e será usada por todos os usuários!');
                              } catch (error) {
                                alert('Erro ao salvar chave: ' + error);
                              }
                            } else {
                              alert("Chave Groq inválida ou muito curta.");
                            }
                          }} 
                          className={`w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center ${keySaved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        >
                          {keySaved ? <Check size={20} className="mr-2" /> : null}
                          {keySaved ? 'Chave Salva!' : 'Salvar Chave Groq'}
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await settingsApi.deleteApiConfig('groq');
                              setGroqKey('');
                              alert('Chave Groq deletada com sucesso!');
                            } catch (error) {
                              alert('Erro ao deletar chave: ' + error);
                            }
                          }} 
                          className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                        >
                          Deletar Chave
                        </button>
                      </div>

                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">⚡ Vantagens Groq:</p>
                        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                          <li>🚀 10x mais rápido que Gemini</li>
                          <li>🆓 Gratuito com limite generoso</li>
                          <li>🧠 Llama 3.3 (70B) - melhor custo-benefício</li>
                          <li>⚙️ Sem limite de requisições</li>
                          <li>❌ NÃO suporta: Áudio, Imagens (use Gemini para isso)</li>
                        </ul>
                      </div>

                      <p className="mt-4 text-xs text-slate-400">
                        📚 Obter chave em <a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">console.groq.com</a> (criar conta grátis).
                      </p>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Security Management */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div onClick={() => toggleSection('security')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-center">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg mr-4 shrink-0"><Lock size={20} /></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("admin.security_passwords")}</h3>
            </div>
            {expandedSection === 'security' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {expandedSection === 'security' && (
            <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
              {/* Alterar Própria Senha */}
              <div className="mb-8">
                <h4 className="font-bold mb-4 text-slate-700 dark:text-white">Alterar Minha Senha</h4>
                <form onSubmit={handleChangePassword} className="grid md:grid-cols-2 gap-4">
                   <input type="password" placeholder="Senha Atual" required value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} className={inputClass} />
                   <div className="hidden md:block"></div>
                   <input type="password" placeholder="Nova Senha" required value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} className={inputClass} />
                   <input type="password" placeholder="Confirmar Nova Senha" required value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className={inputClass} />
                   
                   <div className="md:col-span-2 mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                     <p className="text-xs text-slate-500 mb-3 font-bold uppercase">{t("admin.setup_recovery_optional")}</p>
                     <div className="grid md:grid-cols-2 gap-4">
                       <input type="text" placeholder="Pergunta de Segurança" value={passwordForm.question} onChange={e => setPasswordForm({...passwordForm, question: e.target.value})} className={inputClass} />
                       <input type="text" placeholder="Resposta" value={passwordForm.answer} onChange={e => setPasswordForm({...passwordForm, answer: e.target.value})} className={inputClass} />
                     </div>
                   </div>
                   
                   <button type="submit" className="md:col-span-2 bg-slate-800 text-white py-3 rounded-xl font-bold mt-2 shadow-lg hover:bg-slate-700 transition">Atualizar Segurança</button>
                </form>
              </div>

              {/* Resetar Senha de Subordinados */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-700">
                <h4 className="font-bold mb-4 text-slate-700 dark:text-white flex items-center">
                  <Key className="mr-2" size={18} /> Redefinição de Senha (Gestão)
                </h4>
                {resetTargetUser ? (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-800">
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2">Redefinindo senha para: {resetTargetUser.name}</p>
                    <form onSubmit={handleForceReset} className="flex flex-col sm:flex-row gap-2">
                       <input type="text" placeholder="Nova Senha" required value={forceResetPassword} onChange={e => setForceResetPassword(e.target.value)} className={inputClass} />
                       <div className="flex gap-2">
                          <button type="submit" className="flex-1 sm:flex-none bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition">Salvar</button>
                          <button type="button" onClick={() => setResetTargetUser(null)} className="flex-1 sm:flex-none text-slate-500 px-4 hover:text-slate-700 font-medium">Cancelar</button>
                       </div>
                    </form>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleUsers.filter(u => canResetPassword(u)).length > 0 ? (
                      visibleUsers.filter(u => canResetPassword(u)).map(u => (
                        <button key={u.id} onClick={() => setResetTargetUser(u)} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm flex justify-between items-center group bg-slate-50 dark:bg-slate-900/50">
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">{u.name} <span className="text-xs text-slate-400">({u.role})</span></span>
                          <Key size={14} className="text-slate-400 group-hover:text-primary-500 shrink-0" />
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic col-span-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-center">Nenhum usuário disponível para redefinição.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Users Management */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div onClick={() => toggleSection('users')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4 shrink-0"><Users size={20} /></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{isManager ? t("admin.family_members") : t("admin.user_management")}</h3>
            </div>
            {expandedSection === 'users' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {expandedSection === 'users' && (
            <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
              {isUserFormOpen ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl mb-6 border border-slate-200 dark:border-slate-700 animate-scale-in p-6 shadow-lg shadow-slate-200/50 dark:shadow-none">
                  <div className="flex justify-between mb-6"><h4 className="font-bold text-lg text-slate-800 dark:text-white">{editingUser ? 'Editar Perfil' : 'Novo Perfil'}</h4><button type="button" onClick={() => setIsUserFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button></div>
                  <form onSubmit={handleUserSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                      <input type="text" required value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Opcional)</label>
                      <input type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className={inputClass} placeholder="usuario@exemplo.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário (Login)</label>
                      <input type="text" required value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} className={inputClass} />
                    </div>
                    {!editingUser && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha Inicial</label>
                        <input type="password" required value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} className={inputClass} />
                      </div>
                    )}
                    {isAdmin && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Permissão</label>
                        <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} className={inputClass}>
                          <option value={UserRole.MEMBER}>{t("admin.role_member")}</option>
                          <option value={UserRole.MANAGER}>{t("admin.role_family_manager")}</option>
                          <option value={UserRole.ADMIN}>{t("admin.role_admin")}</option>
                          <option value={UserRole.TRANSLATOR}>{t("admin.role_translator")}</option>
                          {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>{t("admin.role_super_admin")}</option>}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Nascimento</label>
                      <input type="date" value={userFormData.birthDate} onChange={e => setUserFormData({...userFormData, birthDate: e.target.value})} className={inputClass} />
                    </div>
                    
                    <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <span className="block text-sm font-bold text-slate-700 dark:text-white flex items-center">
                           <Lock size={14} className="mr-1"/> Privacidade
                        </span>
                        <span className="text-xs text-slate-400">Permitir que o gestor visualize finanças (se &gt; 18)</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={userFormData.allowParentView} 
                        onChange={e => setUserFormData({...userFormData, allowParentView: e.target.checked})} 
                        className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Avatar / Foto</label>
                       <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div className="relative group w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-slate-200 shrink-0">
                            <img src={userFormData.avatar || '/default-avatar.svg'} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1">
                           <div className="relative">
                             <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" id="avatar-upload" />
                             <label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300 font-bold text-sm whitespace-nowrap">
                               <Upload size={16} className="mr-2" />
                               Escolher arquivo
                             </label>
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                  <button type="submit" className="mt-6 bg-primary-600 text-white w-full py-3 rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition">Salvar Alterações</button>
                  </form>
                </div>
              ) : (
                <button onClick={() => { 
                  setEditingUser(null); 
                  setUserFormData({ name: '', username: '', password: '', role: UserRole.MEMBER, avatar: '/default-avatar.svg', birthDate: '', allowParentView: true }); 
                  setIsUserFormOpen(true); 
                }} className="mb-6 flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded-xl font-bold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition w-full sm:w-auto justify-center">
                  <UserPlus size={18}/> {isManager ? 'Adicionar Membro' : 'Adicionar Usuário'}
                </button>
              )}
              <div className="space-y-3">
                {visibleUsers.map(user => {
                  const age = calculateAge(user.birthDate);
                  const isChild = age < 18;
                  const isVisibleToParent = isChild || user.allowParentView;

                  return (
                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900/30 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-slate-600 object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white flex items-center text-lg truncate">
                            {user.name} 
                            {user.id === currentUser.id && <span className="ml-2 text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Eu</span>}
                          </p>
                          <div className="flex gap-2 text-xs mt-1">
                             <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{user.role}</span>
                             {user.birthDate && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{age} anos</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
                        {user.createdBy === currentUser.id && (
                           <span title={isVisibleToParent ? "Visível para você" : "Privado"} className={`p-2 rounded-lg ${isVisibleToParent ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                              {isVisibleToParent ? <Unlock size={18} /> : <Lock size={18} />}
                           </span>
                        )}
                        <button onClick={() => { 
                          setEditingUser(user); 
                          setUserFormData({ 
                            name: user.name, 
                            username: user.username, 
                            password: '', 
                            role: user.role, 
                            avatar: user.avatar, 
                            birthDate: user.birthDate || '', 
                            allowParentView: user.allowParentView || false 
                          }); 
                          setIsUserFormOpen(true); 
                        }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"><Edit size={18}/></button>
                        
                        {(isSuperAdmin || (isAdmin && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) || (isManager && user.role === UserRole.MEMBER && user.familyId === currentUser.familyId)) && user.id !== currentUser.id && (
                          <button onClick={() => handleDeleteClick(user.id, user.name)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition"><Trash2 size={18}/></button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4.5. GitHub Repository (Only Super Admin) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('github')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-lg mr-4 shrink-0"><Github size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Repositório GitHub</h3>
              </div>
              {expandedSection === 'github' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'github' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Configure o repositório GitHub que será usado para atualizar o sistema. Use o formato completo: <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-xs">https://github.com/usuario/repo</code>
                </p>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/seu-usuario/seu-repositorio"
                    className={inputClass}
                  />
                  <button 
                    onClick={saveRepoUrl}
                    className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-500/20 shrink-0 flex items-center gap-2"
                  >
                    <Save size={18} /> Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Update System (Only Super Admin) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('update')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mr-4 shrink-0"><RefreshCw size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Atualização do Sistema</h3>
              </div>
              {expandedSection === 'update' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'update' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <div className="grid gap-6">
                  {/* Atualização Automática */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-lg mb-4">🚀 Atualização Automática</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">Atualize seu sistema diretamente pela interface. O processo inclui: git pull, npm install, build e restart.</p>
                    
                    {isUpdating ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{updateProgress.status}</span>
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{updateProgress.current}%</span>
                        </div>
                        <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full h-4 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-300"
                            style={{ width: `${updateProgress.current}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={async () => {
                          if (!confirm('⚠️ Seu sistema será reiniciado!\n\nDeseja atualizar agora?')) return;
                          setIsUpdating(true);
                          try {
                            const pollProgress = setInterval(async () => {
                              try {
                                const progress = await systemApi.checkUpdateProgress();
                                setUpdateProgress(progress);
                              } catch (e) {}
                            }, 500);

                            await systemApi.executeUpdate();
                            
                            clearInterval(pollProgress);
                            setUpdateProgress({ current: 100, total: 100, status: 'Atualização concluída! Recarregando...' });
                            
                            setTimeout(() => {
                              window.location.reload();
                            }, 2000);
                          } catch (error: any) {
                            alert('Erro na atualização: ' + error.message);
                            setIsUpdating(false);
                            setUpdateProgress({ current: 0, total: 100, status: 'Erro' });
                          }
                        }}
                        className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg"
                      >
                        <RefreshCw size={18} /> Atualizar Agora
                      </button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      ⚠️ <strong>Atenção:</strong> A atualização pode levar alguns minutos. O sistema será reiniciado automaticamente. Todos os usuários serão desconectados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. Backup (Only Admin) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('backup')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4 shrink-0"><HardDrive size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("admin.backup_restore")}</h3>
              </div>
              {expandedSection === 'backup' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'backup' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <div className="grid gap-8">
                  {/* Backup Manual */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-blue-800 dark:text-blue-400 text-lg mb-4">📥 {t("admin.manual_database_backup")}</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">Cria um arquivo JSON com todos os seus dados. Pode ser restaurado depois.</p>
                    
                    {isBackingUp ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{backupProgress.status}</span>
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{backupProgress.current}%</span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                            style={{ width: `${backupProgress.current}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={async () => {
                          setIsBackingUp(true);
                          try {
                            const backup = await backupApi.createBackup();
                            setBackupProgress({ current: 100, total: 100, status: 'Completo!' });
                            
                            const dataStr = JSON.stringify(backup.data, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                            
                            setTimeout(() => {
                              setIsBackingUp(false);
                              setBackupProgress({ current: 0, total: 100, status: 'idle' });
                            }, 1500);
                          } catch (error: any) {
                            alert('Erro no backup: ' + error.message);
                            setIsBackingUp(false);
                            setBackupProgress({ current: 0, total: 100, status: 'Erro' });
                          }
                        }}
                        className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Download size={18} /> Fazer Backup Agora
                      </button>
                    )}
                  </div>

                  {/* Restauro */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800">
                    <h4 className="font-bold text-orange-800 dark:text-orange-400 text-lg mb-4">📤 Restaurar Base de Dados</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">⚠️ Substituirá TODOS os dados atuais. Esta ação é irreversível!</p>
                    
                    {isRestoring ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{restoreProgress.status}</span>
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{restoreProgress.current}%</span>
                        </div>
                        <div className="w-full bg-orange-200 dark:bg-orange-900/50 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-300"
                            style={{ width: `${restoreProgress.current}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <label className="w-full py-3 px-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                        <Upload size={18} /> Escolher Arquivo JSON
                        <input 
                          type="file" 
                          accept=".json" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            if (!confirm('⚠️ CUIDADO!\n\nTodos os seus dados atuais serão perdidos!\nTem certeza que deseja restaurar?')) {
                              return;
                            }

                            setIsRestoring(true);
                            try {
                              const text = await file.text();
                              const backup = JSON.parse(text);
                              
                              setRestoreProgress({ current: 30, total: 100, status: 'Validando backup...' });
                              
                              const result = await backupApi.restoreBackup(backup);
                              
                              setRestoreProgress({ current: 100, total: 100, status: 'Restauro completo!' });
                              
                              setTimeout(() => {
                                alert('Dados restaurados com sucesso!\nA página será recarregada.');
                                window.location.reload();
                              }, 1500);
                            } catch (error: any) {
                              alert('Erro na restauração: ' + error.message);
                              setIsRestoring(false);
                              setRestoreProgress({ current: 0, total: 100, status: 'Erro' });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Info */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      💡 <strong>Dica:</strong> Faça backups regularmente! Em produção, recomendamos backups automáticos diários.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. Notifications (Only Super Admin) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('notifications')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4 shrink-0"><Bell size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">🌐 {t("admin.notification_settings")}</h3>
              </div>
              {expandedSection === 'notifications' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'notifications' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <NotificationSettings isSuperAdmin={true} />
              </div>
            )}
          </div>
        )}

        {/* 8. Translations Manager (Only Translator + Super Admin) */}
        {(isSuperAdmin || currentUser.role === UserRole.TRANSLATOR) && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('translations')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4 shrink-0"><Languages size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("translations.manager_title")}</h3>
              </div>
              {expandedSection === 'translations' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'translations' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <TranslationManager currentUser={currentUser} />
              </div>
            )}
          </div>
        )}

        {/* 9. AI Function Providers (Only Super Admin) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('ai-functions')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg mr-4 shrink-0"><Bot size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">🤖 Provedores por Funcionalidade</h3>
              </div>
              {expandedSection === 'ai-functions' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'ai-functions' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <AIProviderSettings onClose={() => toggleSection('ai-functions')} />
              </div>
            )}
          </div>
        )}

        {/* 10. Currency Providers Section */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('currency')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mr-4 shrink-0"><ArrowRightLeft size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('common.conversion_providers') || 'Provedores de Conversão'}</h3>
              </div>
              {expandedSection === 'currency' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'currency' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <CurrencyProviderSettings 
                  currentProvider={currencyProvider as any}
                  onProviderChange={(provider) => setCurrencyProvider(provider as any)}
                />
              </div>
            )}
          </div>
        )}

        {/* 11. Excel Models Management (Only Super Admin) */}
        {isSuperAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div onClick={() => toggleSection('models')} className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4 shrink-0"><FileUp size={20} /></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">📊 Gerenciar Modelos Excel</h3>
              </div>
              {expandedSection === 'models' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedSection === 'models' && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-700 animate-slide-down">
                <ModelManagement onClose={() => toggleSection('models')} />
              </div>
            )}
          </div>
        )}

      </div>

      {/* Budget Defaults Manager Modal */}
      <BudgetDefaultsManager
        isOpen={isBudgetManagerOpen}
        onClose={() => setIsBudgetManagerOpen(false)}
        currencyFormatter={formatCurrency}
      />
    </div>
  );
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export default AdminPanel;
