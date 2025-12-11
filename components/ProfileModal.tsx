import React, { useState, useRef } from 'react';
import { User, X, Save, Mail, Lock, Image } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onSave: (updatedUser: any) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    username: user.username,
    avatar: user.avatar || '/default-avatar.svg'
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [saved, setSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updates: any = {
      name: formData.name,
      email: formData.email,
      avatar: formData.avatar
    };

    // Se houver mudança de senha
    if (passwordForm.current || passwordForm.new || passwordForm.confirm) {
      if (!passwordForm.current) {
        setPasswordError(t("profile.password_error_required_current"));
        return;
      }
      if (!passwordForm.new || !passwordForm.confirm) {
        setPasswordError(t("profile.password_error_required_new"));
        return;
      }
      if (passwordForm.new !== passwordForm.confirm) {
        setPasswordError(t("profile.password_error_mismatch"));
        return;
      }
      if (passwordForm.new.length < 4) {
        setPasswordError(t("profile.password_error_min_length"));
        return;
      }
      updates.password = passwordForm.new;
    }

    onSave(updates);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <User size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            {t("profile.title")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Avatar Section */}
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Image size={16} />
              {t("profile.avatar_label")}
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={formData.avatar} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-600 object-cover"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition text-white text-xs font-bold"
                >
                  {t("profile.avatar_change")}
                </button>
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("profile.avatar_hint")}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">{t("profile.name_label")}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Mail size={16} />
              {t("profile.email_label")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t("profile.email_placeholder")}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">{t("profile.username_label")}</label>
            <input
              type="text"
              value={formData.username}
              disabled
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed opacity-60"
            />
            <p className="text-xs text-slate-400 mt-1">{t("profile.username_disabled")}</p>
          </div>

          {/* Password Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Lock size={16} />
              {t("profile.password_section")}
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t("profile.current_password")}</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, current: e.target.value });
                  setPasswordError('');
                }}
                placeholder={t("profile.current_password_hint")}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t("profile.new_password")}</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, new: e.target.value });
                    setPasswordError('');
                  }}
                  placeholder={t("profile.new_password")}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t("profile.confirm_password")}</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, confirm: e.target.value });
                    setPasswordError('');
                  }}
                  placeholder={t("profile.confirm_password_hint")}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-bold">⚠️ {passwordError}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSave}
              className="flex-1 p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {t("profile.save_button")}
            </button>
            <button
              onClick={onClose}
              className="flex-1 p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 font-bold transition"
            >
              {t("common.close")}
            </button>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{t("profile.success_message")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
