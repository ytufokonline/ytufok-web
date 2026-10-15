import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck, User } from 'lucide-react';
import { AdminProfile } from '../types';
import { api } from '../lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminProfiles: AdminProfile[];
  initialAdminId?: string;
  onSuccess?: (updatedProfile: AdminProfile) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  adminProfiles,
  initialAdminId,
  onSuccess
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>(initialAdminId || adminProfiles[0]?.id || '');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  
  const [showCurrentPin, setShowCurrentPin] = useState<boolean>(false);
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [showConfirmPin, setShowConfirmPin] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialAdminId) {
      setSelectedAdminId(initialAdminId);
    } else if (adminProfiles.length > 0 && !selectedAdminId) {
      setSelectedAdminId(adminProfiles[0].id);
    }
  }, [initialAdminId, adminProfiles, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setSuccessMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedAdmin = adminProfiles.find(p => p.id === selectedAdminId) || adminProfiles[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!selectedAdmin) {
      setError('Lütfen bir yönetici seçiniz.');
      return;
    }

    if (!currentPin.trim()) {
      setError('Lütfen mevcut şifrenizi giriniz.');
      return;
    }

    if (!newPin.trim()) {
      setError('Lütfen yeni şifrenizi belirleyiniz.');
      return;
    }

    if (newPin.trim().length < 4) {
      setError('Yeni şifre en az 4 karakter olmalıdır.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('Yeni şifreler birbiriyle eşleşmiyor! Lütfen tekrar kontrol ediniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await api.updateAdminPin(selectedAdmin.id, currentPin, newPin);
      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(result.message);
      setIsSubmitting(false);

      if (result.updatedProfile && onSuccess) {
        onSuccess(result.updatedProfile);
      }

      // Automatically close modal after brief visual confirmation
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Password update error:', err);
      setError('Şifre güncellenirken beklenmeyen bir hata oluştu.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#1c0f18] border border-[#657796]/40 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#657796]/20 bg-[#1c0d17] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#301322] border border-[#657796]/40 flex items-center justify-center text-[#dce4ef] shadow-inner">
              <KeyRound className="w-5 h-5 text-[#8193b2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-club">
                Yönetici Şifresini Değiştir
              </h2>
              <p className="text-xs text-[#a9b9d3]">
                Yönetim kurulu hesabı güvenlik şifresi güncelleme
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8193b2] hover:text-white hover:bg-[#301322] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Manager Selector / Display */}
          <div>
            <label className="block text-xs font-semibold text-[#dce4ef] mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#8193b2]" />
              <span>İşlem Yapılacak Yönetici</span>
            </label>

            {adminProfiles.length > 1 ? (
              <select
                value={selectedAdminId}
                onChange={(e) => {
                  setSelectedAdminId(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-3 rounded-2xl bg-[#1c0d17] border border-[#657796]/30 text-white text-xs focus:outline-none focus:border-[#657796]"
              >
                {adminProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.short_title} - {p.title})
                  </option>
                ))}
              </select>
            ) : selectedAdmin ? (
              <div className="p-3.5 rounded-2xl bg-[#1c0d17] border border-[#657796]/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#241120] flex items-center justify-center text-white text-xs font-mono font-medium shadow-inner border border-white/15 shrink-0">
                  {selectedAdmin.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{selectedAdmin.full_name}</div>
                  <div className="text-[11px] text-[#a9b9d3]">{selectedAdmin.title}</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current PIN Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#dce4ef]">
                Mevcut Şifre
              </label>
            </div>
            <div className="relative">
              <input
                type={showCurrentPin ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => {
                  setCurrentPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Mevcut şifrenizi giriniz..."
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-[#1c0d17] border border-[#657796]/40 text-white text-sm placeholder-[#8193b2]/40 focus:outline-none focus:border-[#657796] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#8193b2] hover:text-white transition-colors cursor-pointer"
                title={showCurrentPin ? 'Gizle' : 'Göster'}
              >
                {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New PIN Field */}
          <div>
            <label className="block text-xs font-semibold text-[#dce4ef] mb-1.5">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showNewPin ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Yeni şifrenizi belirleyiniz..."
                className="w-full px-4 py-3 rounded-2xl bg-[#1c0d17] border border-[#657796]/40 text-white text-sm placeholder-[#8193b2]/40 focus:outline-none focus:border-[#657796] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#8193b2] hover:text-white transition-colors cursor-pointer"
                title={showNewPin ? 'Gizle' : 'Göster'}
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New PIN Field */}
          <div>
            <label className="block text-xs font-semibold text-[#dce4ef] mb-1.5">
              Yeni Şifre (Tekrar)
            </label>
            <div className="relative">
              <input
                type={showConfirmPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Yeni şifrenizi tekrar giriniz..."
                className="w-full px-4 py-3 rounded-2xl bg-[#1c0d17] border border-[#657796]/40 text-white text-sm placeholder-[#8193b2]/40 focus:outline-none focus:border-[#657796] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#8193b2] hover:text-white transition-colors cursor-pointer"
                title={showConfirmPin ? 'Gizle' : 'Göster'}
              >
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-2xl bg-[#1c0d17] border border-[#657796]/20 flex items-start gap-2.5 text-[11px] text-[#a9b9d3] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#8193b2] shrink-0 mt-0.5" />
            <span>
              Şifreniz yalnızca bu yönetici hesabı için geçerli olur. Kulüp odasında diğer yöneticilerin yetkilerini etkilemez.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#657796]/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#dce4ef] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentPin || !newPin || !confirmPin}
              className={`px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                !isSubmitting && currentPin && newPin && confirmPin
                  ? 'bg-[#1e0e1b] hover:bg-[#281324] text-white border border-white/20 hover:border-white/40 shadow-lg'
                  : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Lock className="w-3.5 h-3.5 animate-spin" />
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Şifremi Güncelle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
