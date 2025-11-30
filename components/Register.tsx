
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { Users, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';

interface RegisterProps {
  onRegister: (user: Omit<User, 'id'>) => void;
  onCancel: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    familyName: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (formData.password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    // Cria um ID de família único
    const newFamilyId = `fam_${Date.now()}`;

    onRegister({
      name: formData.name,
      email: formData.email || undefined,
      username: formData.username,
      password: formData.password,
      role: UserRole.MANAGER, // O criador da família é o Gestor
      status: UserStatus.APPROVED, // Auto-aprovação para UX fluida (ou PENDING se quiser moderação)
      avatar: '/default-avatar.svg',
      familyId: newFamilyId,
      securityQuestion: { question: 'Nome da família', answer: formData.familyName } // Pergunta padrão
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700">
        
        <button onClick={onCancel} className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm font-bold">
          <ArrowLeft size={16} /> Voltar ao Login
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Criar Família</h1>
          <p className="text-slate-500 text-sm">Cadastre-se como Gestor Familiar</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo (Gestor)</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Maria Silva"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Família</label>
            <input 
              type="text" 
              required
              value={formData.familyName}
              onChange={e => setFormData({...formData, familyName: e.target.value})}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Família Silva"
            />
            <p className="text-[10px] text-slate-400 mt-1">Usado como resposta de segurança inicial.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário de Login</label>
            <input 
              type="text" 
              required
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="usuario.login"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Opcional)</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="seu.email@exemplo.com"
            />
            <p className="text-[10px] text-slate-400 mt-1">Para receber notificações por email.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar</label>
              <input 
                type="password" 
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••"
              />
            </div>
          </div>
          
          <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 flex justify-center items-center mt-6">
            <CheckCircle className="mr-2" size={20} /> Registrar Família
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
