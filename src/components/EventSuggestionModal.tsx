import React, { useState } from 'react';
import { Sparkles, X, Send, CheckCircle2, MapPin, Compass, User, Phone, Lightbulb, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

interface EventSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventSuggestionModal: React.FC<EventSuggestionModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('gezi');
  const [location, setLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Lütfen etkinlik başlığı ve açıklamasını doldurunuz.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createEventSuggestion({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim() || null,
        suggested_by: isAnonymous || !authorName.trim() ? 'Anonim Üye' : authorName.trim(),
        contact_info: contactInfo.trim() || null
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Öneri gönderme hatası:', err);
      setError(err?.message || 'Öneriniz gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setDescription('');
    setCategory('gezi');
    setLocation('');
    setIsAnonymous(true);
    setAuthorName('');
    setContactInfo('');
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[#121115] border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors cursor-pointer"
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white font-club">
                Harika Bir Fikir! Teşekkürler.
              </h3>
              <p className="text-sm text-white/60 font-light max-w-md mx-auto leading-relaxed">
                Etkinlik önerin doğrudan kulüp yönetim kurulumuza ulaştı. Haftalık yönetim toplantımızda değerlendirip kulüp takvimine almaya çalışacağız.
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-3 rounded-full bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-white/90 transition-all cursor-pointer shadow-md active:scale-95"
              >
                Tamam, Harika
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">
                Etkinlik / Gezi Öner
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
                Kulübün sonraki çekim gezisi, atölyesi veya sergisi senin fikrin olabilir. İster tamamen <strong>anonim</strong> olarak, ister adınla birlikte paylaşabilirsin.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Etkinlik Türü / Kategori */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Etkinlik Türü:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'gezi', label: '📸 Fotoğraf Gezisi' },
                    { id: 'atolye', label: '🧪 Atölye / Karanlık Oda' },
                    { id: 'soylesi', label: '🎙️ Söyleşi / Sunum' },
                    { id: 'diger', label: '✨ Diğer Fikirler' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                        category === cat.id
                          ? 'bg-white text-black font-semibold border-white shadow-sm'
                          : 'bg-black/30 border-white/10 text-white/70 hover:bg-black/50 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Etkinlik Başlığı */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Etkinlik / Rota Başlığı: *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Balat Sokak Fotoğrafçılığı Gezisi veya Analog Portre Atölyesi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/40"
                  required
                />
              </div>

              {/* Konum / Mekan (İsteğe bağlı) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Önerilen Konum / Rota (İsteğe bağlı):
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Örn: Balat - Fener Rum Patrikhanesi çevresi veya Yıldız Kampüsü"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Açıklama & Fikir Detayı */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Fikrini Anlat: *
                </label>
                <textarea
                  rows={3}
                  placeholder="Neler yapabiliriz, neden bu etkinlik kulüp için keyifli olur, nasıl bir program düşündün? Aklındaki her detayı yazabilirsin."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/40 leading-relaxed"
                  required
                />
              </div>

              {/* Anonimlik Tercihi & İsteğe Bağlı İsim */}
              <div className="p-4 rounded-2xl bg-black/35 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-white/20 bg-black text-white focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <span>Tamamen Anonim Olarak Gönder</span>
                  </label>
                  <span className="text-[10px] font-mono text-white/40">
                    {isAnonymous ? '🔒 Kimliğin gizli kalır' : '👤 Adın görünür'}
                  </span>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.08] animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1">
                        Adın Soyadın:
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1">
                        İletişim (İsteğe bağlı):
                      </label>
                      <input
                        type="text"
                        placeholder="Tel veya @instagram"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/40"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-white/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md inline-flex items-center gap-2 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Gönderiliyor...' : 'Öneriyi Gönder'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
