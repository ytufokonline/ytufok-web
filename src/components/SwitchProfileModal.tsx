import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, X, KeyRound, Eye, EyeOff, LogOut, ArrowRight, AlertCircle } from 'lucide-react';
import { AdminProfile } from '../types';
import { api } from '../lib/api';

interface SwitchProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminProfiles: AdminProfile[];
  activeAdmin: AdminProfile | null;
  onSuccess?: (newProfile: AdminProfile) => void;
  onSignOut?: () => void;
}

export const SwitchProfileModal: React.FC<SwitchProfileModalProps> = ({
  isOpen,
  onClose,
  adminProfiles,
  activeAdmin,
  onSuccess,
  onSignOut
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectTarget = (profileId: string) => {
    if (activeAdmin?.id === profileId) {
      setSelectedTargetId(null);
      setError(null);
      setPinInput('');
      return;
    }
    setSelectedTargetId(profileId);
    setPinInput('');
    setError(null);
  };

  const handleConfirmSwitch = async (targetProfile: AdminProfile) => {
    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setError('Lütfen şifrenizi (PIN) giriniz.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Güvenlik: Şifre sunucu tarafında (RPC / Serverless API) doğrulanır
      const result = await api.verifyAdminPin(targetProfile.id, cleanPin);

      if (!result.success) {
        setError(result.message || 'Girdiğiniz şifre hatalı!');
        setIsSubmitting(false);
        return;
      }

      // Başarılı ise aktif yöneticiyi güncelle
      await api.setActiveAdmin(targetProfile.id);
      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess(targetProfile);
    } catch (err: any) {
      setError(err?.message || 'Geçiş yapılırken bir hata oluştu.');
      setIsSubmitting(false);
    }
  };

  const handleDirectSignOut = async () => {
    if (window.confirm('Mevcut oturumu tamamen kapatmak ve çıkış yapmak istediğinize emin misiniz?')) {
      await api.signOut();
      onClose();
      if (onSignOut) onSignOut();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c0f18] border border-[#657796]/30 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="p-5 border-b border-[#657796]/20 bg-[#500b27]/90 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#301322] border border-[#657796]/40 text-[#eed1d1] text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3 h-3 text-[#8193b2]" />
              <span>Yönetim Kurulu</span>
            </div>
            <h3 className="text-base font-bold text-white font-club">Aktif Yönetici Profilini Değiştir</h3>
            <p className="text-[11px] text-[#a9b9d3] mt-0.5">
              Geçmek istediğiniz yönetim kurulu profilini seçip PIN şifrenizi giriniz.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#301322] text-[#8193b2] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile List */}
        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {adminProfiles.map((profile) => {
            const isCurrent = activeAdmin?.id === profile.id;
            const isSelected = selectedTargetId === profile.id;

            return (
              <div
                key={profile.id}
                className={`rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#301322]/80 border-[#657796]/50'
                    : isSelected
                    ? 'bg-[#301322] border-[#657796] shadow-lg ring-1 ring-[#657796]/50'
                    : 'bg-[#500b27] border-[#657796]/20 hover:border-[#657796]/50 hover:bg-[#1a0e17]'
                }`}
              >
                <div
                  onClick={() => handleSelectTarget(profile.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#241120] flex items-center justify-center text-white text-xs font-mono font-medium shadow-md shrink-0 border border-white/15">
                      {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <strong className="text-white text-xs font-semibold block truncate">
                        {profile.full_name}
                      </strong>
                      <div className="text-[10px] text-[#a9b9d3]">
                        {profile.title}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mevcut Hesap</span>
                      </span>
                    ) : (
                      <span className={`text-[11px] font-medium transition-colors ${
                        isSelected ? 'text-[#eed1d1] font-bold' : 'text-[#8193b2]'
                      }`}>
                        {isSelected ? 'Şifre Girin ↓' : 'Seç →'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline PIN Entry when this non-current profile is selected */}
                {!isCurrent && isSelected && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleConfirmSwitch(profile);
                    }}
                    className="px-3.5 pb-3.5 pt-1 border-t border-[#657796]/20 space-y-2 animate-in fade-in duration-150"
                  >
                    <div className="text-[11px] text-[#eed1d1]">
                      <strong>{profile.full_name}</strong> hesabına geçmek için şifrenizi giriniz:
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8193b2]">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          setError(null);
                        }}
                        placeholder="Yönetici PIN Şifresi"
                        autoFocus
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#500b27] border border-[#657796]/40 text-white text-xs focus:outline-none focus:border-[#657796] focus:ring-1 focus:ring-[#657796]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8193b2] hover:text-white cursor-pointer"
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {error && (
                      <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-200 text-[10px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTargetId(null);
                          setError(null);
                          setPinInput('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1c0f18] text-[#8193b2] hover:text-white text-xs font-medium cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !pinInput.trim()}
                        className="px-4 py-1.5 rounded-lg bg-[#1e0e1b] hover:bg-[#281324] disabled:opacity-50 text-white border border-white/20 hover:border-white/40 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Hesaba Geç</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with Global Sign Out Option */}
        <div className="p-4 border-t border-[#657796]/20 bg-[#500b27] flex items-center justify-between gap-3 text-xs">
          <div className="text-[11px] text-[#8193b2]">
            {activeAdmin ? (
              <span>Aktif: <strong className="text-white">{activeAdmin.full_name}</strong></span>
            ) : (
              <span>Oturum açık değil</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDirectSignOut}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Tüm oturumu kapatır ve tarayıcıyı temizler"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Oturumu Tamamen Kapat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#eed1d1] text-[11px] font-medium cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
