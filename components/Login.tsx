import React, { useState } from 'react';
import { User, UserStatus, UserRole } from '../types';
import { Lock, User as UserIcon, LogIn, HelpCircle, ArrowLeft, CheckCircle, ShieldAlert, UserPlus, X, Globe } from 'lucide-react';
import { authApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  appName: string;
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ appName, onLogin }) => {
  const { t, language, setLanguage } = useLanguage();
  const [view, setView] = useState<'login' | 'recovery' | 'register'>('login');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['pt', 'en', 'es', 'um', 'ln', 'fr']);
  
  // Load available languages from backend
  React.useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch('/api/translations/languages');
        if (response.ok) {
          const langs = await response.json();
          setAvailableLanguages(langs);
        }
      } catch (error) {
        console.error('Erro ao carregar idiomas:', error);
      }
    };
    loadLanguages();
  }, []);
  
  // Get language name in current language - extended to support all languages
  const getLangName = (lang: string): string => {
    const names: { [key: string]: { [key: string]: string } } = {
      pt: { pt: 'Português', en: 'Portuguese', es: 'Portugués', um: 'Potogo', ln: 'Lopoto', fr: 'Português' },
      en: { pt: 'Inglês', en: 'English', es: 'Inglés', um: 'Linglisi', ln: 'Lingleza', fr: 'Anglais' },
      es: { pt: 'Espanhol', en: 'Spanish', es: 'Español', um: 'Sipe', ln: 'Sepaniya', fr: 'Espagnol' },
      um: { pt: 'Umbundu', en: 'Umbundu', es: 'Umbundu', um: 'Umbundu', ln: 'Umbundu', fr: 'Umbundu' },
      ln: { pt: 'Lingala', en: 'Lingala', es: 'Lingala', um: 'Lingala', ln: 'Lingala', fr: 'Lingala' },
      fr: { pt: 'Francês', en: 'French', es: 'Francés', um: 'Francês', ln: 'Francês', fr: 'Français' },
      de: { pt: 'Alemão', en: 'German', es: 'Alemán', um: 'Alemão', ln: 'Alemão', fr: 'Allemand' },
      it: { pt: 'Italiano', en: 'Italian', es: 'Italiano', um: 'Italiano', ln: 'Italiano', fr: 'Italien' },
      ja: { pt: 'Japonês', en: 'Japanese', es: 'Japonés', um: 'Japonês', ln: 'Japonês', fr: 'Japonais' },
      zh: { pt: 'Chinês', en: 'Chinese', es: 'Chino', um: 'Chinês', ln: 'Chinês', fr: 'Chinois' },
      ar: { pt: 'Árabe', en: 'Arabic', es: 'Árabe', um: 'Árabe', ln: 'Árabe', fr: 'Arabe' },
      ru: { pt: 'Russo', en: 'Russian', es: 'Ruso', um: 'Russo', ln: 'Russo', fr: 'Russe' }
    };
    return names[lang]?.[language] || lang.toUpperCase();
  };

  // Get flag emoji for language
  const getFlagEmoji = (lang: string): string => {
    const flags: { [key: string]: string } = {
      pt: '🇵🇹',
      en: '🇬🇧',
      es: '🇪🇸',
      um: '🇦🇴',
      ln: '🇨🇩',
      fr: '🇫🇷',
      de: '🇩🇪',
      it: '🇮🇹',
      ja: '🇯🇵',
      zh: '🇨🇳',
      ar: '🇸🇦',
      ru: '🇷🇺'
    };
    return flags[lang] || '🌍';
  };

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authApi.login(username, password);
      // Save language preference for this user
      const userWithLang = { ...response.user, languagePreference: language };
      await fetch(`${window.location.origin}/api/users/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languagePreference: language })
      }).catch(() => {}); // Silent fail if endpoint not ready yet
      onLogin(userWithLang);
    } catch (err: any) {
      // Map backend error messages to translation keys
      let errorKey = "login.error_logging_in";
      if (err.message === "Invalid credentials") {
        errorKey = "login.invalid_credentials";
      }
      setError(t(errorKey));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!acceptedTerms) {
      setError(t("login.must_accept_terms"));
      return;
    }
    
    setLoading(true);
    
    try {
      await authApi.register({
        username: registerUsername,
        password: registerPassword,
        name: registerName,
        familyName: familyName,
        securityQuestion,
        securityAnswer
      });
      alert(t("login.family_registered_success"));
      setView('login');
      setRegisterName('');
      setRegisterUsername('');
      setRegisterPassword('');
      setFamilyName('');
      setSecurityQuestion('');
      setSecurityAnswer('');
      setAcceptedTerms(false);
    } catch (err: any) {
      setError(err.message || t("login.error_registering"));
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/settings/terms_of_service`);
      const data = await response.json();
      setTermsContent(data.value || 'Nenhum termo definido ainda.');
    } catch (err) {
      setTermsContent('Erro ao carregar termos.');
    }
  };

  const handleRecoverPassword = async () => {
    setError('');
    setLoading(true);
    
    try {
      await authApi.recoverPassword(recoveryUsername, recoveryAnswer, newPassword);
      alert('Senha redefinida com sucesso!');
      setView('login');
      setRecoveryStep(1);
      setRecoveryUsername('');
      setRecoveryAnswer('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro ao recuperar senha');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('login')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <h3 className="font-bold text-slate-800 dark:text-white ml-2">Criar Nova Família</h3>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-sm flex items-center">
              <ShieldAlert size={18} className="mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Seu nome"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário</label>
              <input 
                type="text" 
                value={registerUsername}
                onChange={e => setRegisterUsername(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Nome de usuário"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
              <input 
                type="password" 
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="••••••"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Família</label>
              <input 
                type="text" 
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Ex: Família Silva"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pergunta de Segurança (Opcional)</label>
              <input 
                type="text" 
                value={securityQuestion}
                onChange={e => setSecurityQuestion(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Ex: Nome do primeiro animal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resposta de Segurança</label>
              <input 
                type="text" 
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Sua resposta"
              />
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <input 
                type="checkbox" 
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-600"
              />
              <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                Aceito os{' '}
                <button
                  type="button"
                  onClick={() => {
                    loadTerms();
                    setShowTermsModal(true);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Termos e Condições
                </button>
              </label>
            </div>
            <button 
              type="submit" 
              disabled={loading || !acceptedTerms}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Criar Família'}
            </button>
          </form>
        </div>

        {showTermsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Termos e Condições</h3>
                <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {termsContent}
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold hover:bg-slate-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'recovery') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-6">
            <button onClick={() => { setView('login'); setRecoveryStep(1); }} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <h3 className="font-bold text-slate-800 dark:text-white ml-2">Recuperar Senha</h3>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-sm flex items-center">
              <ShieldAlert size={18} className="mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário</label>
              <input 
                type="text" 
                value={recoveryUsername}
                onChange={e => setRecoveryUsername(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Seu usuário"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resposta de Segurança</label>
              <input 
                type="text" 
                value={recoveryAnswer}
                onChange={e => setRecoveryAnswer(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="Sua resposta"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                placeholder="••••••"
              />
            </div>
            <button 
              onClick={handleRecoverPassword}
              disabled={loading}
              className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? 'Recuperando...' : 'Redefinir Senha'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary-200 dark:bg-primary-900/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-200 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700 animate-bounce-in relative z-10">
        
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <select 
            key={language}
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang as any);
            }}
            className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            {availableLanguages.map(lang => (
              <option key={lang} value={lang}>{getFlagEmoji(lang)} {getLangName(lang)}</option>
            ))}
          </select>
        </div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-primary-500/50 mb-4 animate-bounce-in hover:shadow-xl hover:shadow-primary-500/70 transition-all duration-300 cursor-pointer">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-emerald-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-emerald-400 mb-2">{appName}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-sm flex items-center animate-shake">
            <ShieldAlert size={18} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('login.username')}</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('login.username')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 flex justify-center items-center active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? t('login.enter') + '...' : <><LogIn className="mr-2" size={20} /> {t('login.enter')}</>}
          </button>

          <div className="flex justify-between items-center mt-4">
            <button 
              type="button" 
              onClick={() => { setView('recovery'); setError(''); }}
              className="text-sm text-slate-400 hover:text-primary-600 font-medium"
            >
              {t('login.forgotPassword')}
            </button>
            <button 
              type="button" 
              onClick={() => setView('register')}
              className="text-sm text-emerald-600 font-bold hover:text-emerald-700 flex items-center"
            >
              {t('login.createFamily')} <UserPlus size={14} className="ml-1"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
