import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Unlock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { AdminProfile } from '../types';
import { api } from '../lib/api';
import { ChangePasswordModal } from './ChangePasswordModal';

interface AdminLoginProps {
  adminProfiles: AdminProfile[];
  onLogin: (profile: AdminProfile) => void;
  onProfilesUpdate?: (profiles: AdminProfile[]) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ adminProfiles, onLogin, onProfilesUpdate }) => {
  const [localProfiles, setLocalProfiles] = useState<AdminProfile[]>(adminProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(adminProfiles[0]?.id || '');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    setLocalProfiles(adminProfiles);
  }, [adminProfiles]);

  const selectedProfile = localProfiles.find(p => p.id === selectedProfileId) || localProfiles[0];

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const freshProfiles = await api.getAdminProfiles();
      setLocalProfiles(freshProfiles);
      if (onProfilesUpdate) onProfilesUpdate(freshProfiles);

      const latestProfile = freshProfiles.find(p => p.id === selectedProfile.id) || selectedProfile;
      const validPin = latestProfile.pin || '19111994';

      if (pin.trim() !== validPin) {
        setError('Hatalı şifre girdiniz! Lütfen kontrol edip tekrar deneyiniz.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      onLogin(latestProfile);
    } catch {
      const validPin = selectedProfile.pin || '19111994';
      if (pin.trim() !== validPin) {
        setError('Hatalı şifre girdiniz! Lütfen kontrol edip tekrar deneyiniz.');
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      onLogin(selectedProfile);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Brand & Security Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#301322] border border-[#657796]/40 text-[#dce4ef] text-xs font-semibold shadow-sm">
          <ShieldCheck className="w-4 h-4 text-[#8193b2]" />
          <span>Kulüp Yönetim Kurulu • Güvenli Giriş Kapısı</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <img 
            src="/logo.png" 
            alt="YTÜFOK Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight font-club">
          Yönetici Giriş Portalı
        </h1>
        <p className="text-sm text-[#a9b9d3] max-w-xl mx-auto">
          Davutpaşa Kulüpler Vadisi • Ekipman zimmet, teslimat, iade ve karanlık oda denetim işlemleri için lütfen kendi profilinizle oturum açınız.
        </p>

        {/* Security Warning Notice */}
        <div className="max-w-2xl mx-auto mt-4 p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/40 text-left flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-[#8193b2] shrink-0 mt-0.5" />
          <div className="text-xs text-[#dce4ef] leading-relaxed">
            <strong className="text-white font-semibold block mb-0.5">Denetim İzi & Zimmet Güvenliği:</strong>
            Yapacağınız tüm rezervasyon onayları, ekipman teslimatları, iade kontrolleri ve karanlık oda onayları 
            <strong> doğrudan giriş yaptığınız yöneticinin adıyla</strong> mühürlenir. Kimsenin işlemi birbirine karışmaması için 
            yalnızca kendi hesabınızla giriş yapınız ve masadan ayrılırken <em>Güvenli Çıkış</em> yapınız.
          </div>
        </div>
      </div>

      <div className="bg-[#1c0f18] border border-[#657796]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Step 1: Profile Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#657796]/20 border border-[#657796]/40 text-[#dce4ef] text-xs flex items-center justify-center font-mono">1</span>
              <span>Yönetim Kurulu Hesabınızı Seçin</span>
            </h2>
            <span className="text-xs text-[#8193b2]">8 Yönetim Kurulu Hesabının Tümü Tam Yetkilidir</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {localProfiles.map((profile) => {
              const isSelected = selectedProfileId === profile.id;
              return (
                <div
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#301322] border-[#657796] shadow-xl shadow-[#301322]/80 ring-2 ring-[#657796]/50'
                      : 'bg-[#12080f]/80 border-[#657796]/20 hover:border-[#657796]/60 hover:bg-[#180d16]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${profile.avatar_color} flex items-center justify-center text-white text-sm font-bold font-club shadow-md shrink-0 border border-white/10`}>
                      {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate block">
                          {profile.full_name}
                        </span>
                        <span className="text-[10px] font-bold text-[#dce4ef] bg-[#657796]/25 px-2 py-0.5 rounded-full border border-[#657796]/40">
                          {profile.short_title}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#a9b9d3] mt-0.5 line-clamp-1">
                        {profile.title}
                      </div>
                      <div className="text-[10px] font-mono text-[#8193b2] mt-1 truncate">
                        No: {profile.student_number}
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#8193b2]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#657796]/40" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: PIN Verification */}
        {selectedProfile && (
          <form onSubmit={handleSubmit} className="border-t border-[#657796]/20 pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#657796]/20 border border-[#657796]/40 text-[#dce4ef] text-xs flex items-center justify-center font-mono">2</span>
                <span>Güvenlik PIN Kodunu Giriniz</span>
              </h2>
              <div className="text-xs text-[#a9b9d3] font-medium">
                Aktif Seçim: <strong className="text-white">{selectedProfile.full_name} ({selectedProfile.short_title})</strong>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#dce4ef] mb-2 text-center">
                  Yönetici Şifresi
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={16}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••"
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 px-4 rounded-2xl bg-[#12080f] border border-[#657796]/40 text-white placeholder-[#8193b2]/40 focus:outline-none focus:border-[#657796] focus:ring-2 focus:ring-[#657796]/30 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#8193b2] hover:text-white transition-colors cursor-pointer"
                    title={showPin ? 'Gizle' : 'Göster'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Helper Link: Change Password */}
              <div className="flex items-center justify-end text-xs px-1 text-[#8193b2]">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(true)}
                  className="inline-flex items-center gap-1 text-[#dce4ef] hover:text-white hover:underline font-semibold cursor-pointer transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#8193b2]" />
                  <span>Şifremi Değiştir</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !pin.trim()}
                className={`w-full py-4 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  pin.trim()
                    ? 'bg-gradient-to-r from-[#657796] via-[#4e3b52] to-[#301322] hover:from-[#8193b2] hover:to-[#421d31] text-white font-extrabold shadow-xl shadow-[#301322]/80 border border-[#8193b2]/30'
                    : 'bg-[#301322] text-[#8193b2] border border-[#657796]/30 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Lock className="w-4 h-4 animate-spin" />
                    <span>Doğrulanıyor...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>{selectedProfile.full_name} Olarak Giriş Yap</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        adminProfiles={localProfiles}
        initialAdminId={selectedProfileId}
        onSuccess={(updatedProfile) => {
          const next = localProfiles.map(p => p.id === updatedProfile.id ? updatedProfile : p);
          setLocalProfiles(next);
          if (onProfilesUpdate) onProfilesUpdate(next);
        }}
      />

      {/* Footer Info */}
      <div className="text-center mt-6 text-xs text-[#8193b2]">
        YTÜFOK Zimmet & Yönetim Masası • Yıldız Teknik Üniversitesi Fotoğraf Kulübü
      </div>
    </div>
  );
};
