import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { AdminProfile } from '../types';
import { api } from '../lib/api';

interface AdminLoginProps {
  adminProfiles?: AdminProfile[];
  onLogin: (profile: AdminProfile) => void;
  onProfilesUpdate?: (profiles: AdminProfile[]) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [studentNumber, setStudentNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNo = studentNumber.trim();
    const cleanPass = password.trim();

    if (!cleanNo) {
      setError('Lütfen öğrenci numaranızı giriniz.');
      return;
    }

    if (!cleanPass) {
      setError('Lütfen şifrenizi giriniz.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Güvenlik: Giriş ve şifre kontrolü tamamen sunucu tarafında (RPC / API) yürütülür
      const result = await api.loginAdmin(cleanNo, cleanPass);

      if (!result.success || !result.admin) {
        setError(result.message || 'Öğrenci numarası veya şifre hatalı.');
        setIsSubmitting(false);
        return;
      }

      await api.setActiveAdmin(result.admin.id);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      onLogin(result.admin);
    } catch {
      setError('Sunucu bağlantısı sağlanamadı. Lütfen daha sonra tekrar deneyiniz.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in duration-300">
        {/* Apple Style Minimalist Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[#a9b9d3] text-xs font-medium tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
            <span>YTÜFOK Yönetim Portalı</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white font-club">
            Yönetici Girişi
          </h1>
          <p className="text-sm text-white/60 font-normal leading-relaxed">
            Kulüp yönetim ve zimmet işlemlerine erişmek için kimliğinizi doğrulayın.
          </p>
        </div>

        {/* Focused Card Form */}
        <div className="bg-black/25 border border-white/[0.08] rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Input 1: Student Number */}
            <div className="space-y-1.5">
              <label 
                htmlFor="studentNumber" 
                className="block text-xs font-medium text-[#ded0d9] pl-1 tracking-wide"
              >
                Öğrenci Numarası
              </label>
              <input
                id="studentNumber"
                name="student_number_field"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder=""
                value={studentNumber}
                onChange={(e) => {
                  setStudentNumber(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-2xl bg-black/35 border border-white/10 text-white placeholder-transparent text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-mono shadow-inner disabled:opacity-50"
              />
            </div>

            {/* Input 2: Password */}
            <div className="space-y-1.5">
              <label 
                htmlFor="adminPassword" 
                className="block text-xs font-medium text-[#ded0d9] pl-1 tracking-wide"
              >
                Şifre
              </label>
              <div className="relative">
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 pr-11 rounded-2xl bg-black/35 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-mono shadow-inner disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/90 transition-colors cursor-pointer"
                  title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !studentNumber.trim() || !password.trim()}
                className={`w-full py-3.5 px-6 rounded-2xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  studentNumber.trim() && password.trim() && !isSubmitting
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/10 active:scale-[0.99]'
                    : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <span>Giriş Yap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Minimal Footer Notice */}
        <p className="text-center text-[11px] text-[#568aa5] leading-relaxed max-w-xs mx-auto">
          Yalnızca yetkili YTÜFOK Yönetim Kurulu erişimine açıktır. Güvenlik amacıyla tüm giriş denemeleri kayıt altındadır.
        </p>
      </div>
    </div>
  );
};
