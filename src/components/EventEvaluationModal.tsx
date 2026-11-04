import React, { useState } from 'react';
import { Star, X, CheckCircle2, Send, ThumbsUp, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { ClubEvent } from '../types';
import { api } from '../lib/api';

interface EventEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ClubEvent | null;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, { text: string; color: string; desc: string }> = {
  1: { text: '1 / 5 — Geliştirilmeli', color: 'text-rose-400', desc: 'Organizasyon veya içerik beklentimin altındaydı.' },
  2: { text: '2 / 5 — Fena Değil', color: 'text-amber-400', desc: 'Faydalı kısımları vardı ancak eksikler mevcuttu.' },
  3: { text: '3 / 5 — İyi / Yeterli', color: 'text-amber-300', desc: 'Beklentileri karşıladı, standart kulüp etkinliğiydi.' },
  4: { text: '4 / 5 — Çok Başarılı', color: 'text-emerald-300', desc: 'Çok keyif aldım ve yeni fotoğraf teknikleri öğrendim.' },
  5: { text: '5 / 5 — Mükemmel!', color: 'text-emerald-400', desc: 'Tek kelimeyle kusursuzdu, kesinlikle tekrar edilmeli!' }
};

const SUGGESTED_ASPECTS = [
  '📸 Fotoğraf Rotası & Işık',
  '🎓 Yönetim Rehberliği & Eğitim',
  '📷 Kulüp Ekipman Desteği',
  '🤝 Samimi Ortam & Sosyalleşme',
  '⏱️ Zamanlama & Ulaşım Kolaylığı',
  '☕ Molalar & Çay-Kahve Sohbeti'
];

export const EventEvaluationModal: React.FC<EventEvaluationModalProps> = ({
  isOpen,
  onClose,
  event,
  onSuccess
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [studentNumber, setStudentNumber] = useState('');
  const [comment, setComment] = useState('');
  const [likedAspects, setLikedAspects] = useState<string[]>([]);
  const [improvement, setImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal her açıldığında veya etkinlik değiştiğinde formu temizle (hiçbir şey seçili gelmesin)
  React.useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setEvaluatorName('');
      setIsAnonymous(true);
      setStudentNumber('');
      setComment('');
      setLikedAspects([]);
      setImprovement('');
      setSubmitted(false);
      setError(null);
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const currentScore = hoverRating || rating;

  const toggleAspect = (aspect: string) => {
    if (likedAspects.includes(aspect)) {
      setLikedAspects(likedAspects.filter(a => a !== aspect));
    } else {
      setLikedAspects([...likedAspects, aspect]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setError('Lütfen 1 ile 5 arasında bir puan seçiniz.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createEventEvaluation({
        event_id: event.id,
        event_title: event.title,
        rating,
        evaluator_name: isAnonymous || !evaluatorName.trim() ? 'Anonim Katılımcı' : evaluatorName.trim(),
        student_number: !isAnonymous && studentNumber.trim() ? studentNumber.trim() : null,
        comment: comment.trim() || null,
        liked_aspects: likedAspects.length > 0 ? likedAspects : undefined,
        improvement_suggestions: improvement.trim() || null
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Değerlendirme gönderme hatası:', err);
      setError(err?.message || 'Değerlendirme kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setRating(0);
    setHoverRating(0);
    setEvaluatorName('');
    setIsAnonymous(true);
    setStudentNumber('');
    setComment('');
    setLikedAspects([]);
    setImprovement('');
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
                Değerlendirmen Kaydedildi!
              </h3>
              <p className="text-sm text-white/60 font-light max-w-md mx-auto leading-relaxed">
                <strong>{event.title}</strong> etkinliğimize verdiğin <strong>{rating}/5</strong> puan ve değerli geri bildirimlerin için teşekkür ederiz. Kulüp organizasyonlarımızı sizlerin görüşleriyle geliştirmeye devam ediyoruz.
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-3 rounded-full bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-white/90 transition-all cursor-pointer shadow-md active:scale-95"
              >
                Kapat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 text-[11px] font-mono mb-1">
                <span>{event.category_label}</span>
                <span>•</span>
                <span>{event.date}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">
                Etkinliği Değerlendir
              </h2>
              <p className="text-xs sm:text-sm text-white/70 font-medium">
                {event.title}
              </p>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Etkinliğin nasıl geçtiğini 5 üzerinden puanlayabilir, beğendiğin noktaları ve geliştirilmesini istediklerini anonim olarak paylaşabilirsin.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              
              {/* Star Rating Section (5 Üzerinden) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 text-center space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Genel Deneyim Puanın (5 Üzerinden):
                </label>
                
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= currentScore;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                        aria-label={`${starValue} Yıldız`}
                      >
                        <Star
                          className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : 'text-white/20 hover:text-white/40'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-0.5 min-h-[44px] flex flex-col justify-center">
                  {currentScore > 0 ? (
                    <>
                      <div className={`text-sm font-bold font-mono ${RATING_LABELS[currentScore]?.color || 'text-white'}`}>
                        {RATING_LABELS[currentScore]?.text}
                      </div>
                      <div className="text-[11px] text-white/50 font-light">
                        {RATING_LABELS[currentScore]?.desc}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-mono text-white/40">
                      Puan vermek için yıldızlardan birini seçin
                    </div>
                  )}
                </div>
              </div>

              {/* Beğenilen Yönler (Multi-select) */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  En Çok Hangi Yönleri Beğendin?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_ASPECTS.map((aspect) => {
                    const isSelected = likedAspects.includes(aspect);
                    return (
                      <button
                        key={aspect}
                        type="button"
                        onClick={() => toggleAspect(aspect)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black font-semibold border-white shadow-sm'
                            : 'border-white/10 text-white/60 hover:text-white hover:border-white/25 bg-black/30'
                        }`}
                      >
                        {aspect}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Yorum & Deneyim */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Görüşlerin & Yorumun (Opsiyonel):
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Etkinlik nasıl geçti? Çektiğin fotoğraflar, rota, rehberlik veya kulüp ortamı hakkında neler söylemek istersin?"
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all resize-none"
                />
              </div>

              {/* Geliştirilebilir Yönler */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Bir Sonraki Sefer İçin Önerin / Geliştirilebilir Noktalar (Opsiyonel):
                </label>
                <input
                  type="text"
                  value={improvement}
                  onChange={(e) => setImprovement(e.target.value)}
                  placeholder="örn: Serbest zaman biraz daha uzun tutulabilir, şu rotaya da gidilebilir..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all"
                />
              </div>

              {/* Kimlik Tercihi (Anonim / İsimli) */}
              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Anonim Değerlendirme</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {!isAnonymous ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Adın Soyadın</label>
                      <input
                        type="text"
                        value={evaluatorName}
                        onChange={(e) => setEvaluatorName(e.target.value)}
                        placeholder="Ad Soyad"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Öğrenci No (İsteğe Bağlı)</label>
                      <input
                        type="text"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        placeholder="22011..."
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/40 font-light">
                    Değerlendirmeniz ve yorumunuz "Anonim Katılımcı" olarak kaydedilecektir.
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 rounded-full text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-white/90 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Kaydediliyor...' : 'Değerlendirmeyi Gönder'}</span>
                </button>
              </div>

            </form>
          </>
        )}
      </div>
    </div>
  );
};
