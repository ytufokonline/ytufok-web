import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  MessageSquare, 
  Camera, 
  Compass, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  ThumbsUp
} from 'lucide-react';
import { ClubEvent, EventEvaluation, EventCategory, EventStatus } from '../types';
import { api } from '../lib/api';
import { TabType } from '../lib/routes';
import { AppleReveal } from '../components/AppleReveal';
import { EventEvaluationModal } from '../components/EventEvaluationModal';
import { EventSuggestionModal } from '../components/EventSuggestionModal';

interface EventsPageProps {
  onNavigate: (tab: TabType, extraParam?: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  const initialSync = useMemo(() => api.getInitialSyncState(), []);
  const [events, setEvents] = useState<ClubEvent[]>(initialSync.events || []);
  const [evaluations, setEvaluations] = useState<EventEvaluation[]>(initialSync.eventEvaluations || []);
  
  // Filters & State
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedEventForEvaluation, setSelectedEventForEvaluation] = useState<ClubEvent | null>(null);
  const [selectedEventForSuggestion, setSelectedEventForSuggestion] = useState<ClubEvent | null>(null);
  const [showGeneralSuggestionModal, setShowGeneralSuggestionModal] = useState(false);
  
  // Expanded evaluations accordion per event
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      const [eventsList, evalsList] = await Promise.all([
        api.getEvents(),
        api.getEventEvaluations()
      ]);
      if (eventsList && eventsList.length > 0) setEvents(eventsList);
      if (evalsList && evalsList.length > 0) setEvaluations(evalsList);
    } catch (err) {
      console.error('Etkinlikler yüklenirken hata:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleReviews = (eventId: string) => {
    setExpandedReviews(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  // Event evaluations helper
  const getEventStats = (eventId: string) => {
    const eventEvals = evaluations.filter(e => e.event_id === eventId);
    if (eventEvals.length === 0) {
      return { count: 0, average: 0, evals: [] };
    }
    const sum = eventEvals.reduce((acc, curr) => acc + curr.rating, 0);
    const average = Math.round((sum / eventEvals.length) * 10) / 10;
    return { count: eventEvals.length, average, evals: eventEvals };
  };

  // Counts
  const upcomingCount = useMemo(() => events.filter(e => e.status === 'upcoming').length, [events]);
  const completedCount = useMemo(() => events.filter(e => e.status === 'completed').length, [events]);

  // Overall average rating
  const overallStats = useMemo(() => {
    if (evaluations.length === 0) return { avg: 5.0, count: 0 };
    const sum = evaluations.reduce((acc, c) => acc + c.rating, 0);
    return {
      avg: Math.round((sum / evaluations.length) * 10) / 10,
      count: evaluations.length
    };
  }, [evaluations]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Status filter
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchLoc = e.location.toLowerCase().includes(q);
        const matchDesc = e.description.toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchDesc) return false;
      }
      return true;
    });
  }, [events, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10 sm:space-y-12 text-[#ded0d9]">
      
      {/* Page Header */}
      <AppleReveal delay={0}>
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/40">
                YTÜFOK Takvim & Topluluk
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-club">
                Kulüp Etkinlikleri
              </h1>
              <p className="text-base sm:text-lg text-white/60 font-light leading-relaxed max-w-2xl">
                İstanbul sokaklarından Kapadokya vadilerine fotoğraf gezileri, karanlık oda atölyeleri ve dönem sergileri. Geçmiş etkinlikleri değerlendirin, yeni gezilere katılın veya kulübe rota önerin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-white/15 active:scale-95"
                title="Yönetim Paneline gidip yeni etkinlik ekle veya mevcutları düzenle"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Etkinlik Yönetimi (+ Ekle)</span>
              </button>

              <button
                onClick={() => setShowGeneralSuggestionModal(true)}
                className="px-5 py-3 rounded-2xl bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:bg-white/90 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Yeni Etkinlik Öner</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-white/[0.08] text-xs font-mono text-white/50">
            <div>
              <span className="text-white/30 uppercase mr-2 tracking-wider">Gelecek Etkinlik:</span>
              <span className="text-emerald-400 font-semibold">{upcomingCount} Planlandı</span>
            </div>
            <div>
              <span className="text-white/30 uppercase mr-2 tracking-wider">Yaptığımız Etkinlik:</span>
              <span className="text-white font-semibold">{completedCount} Tamamlandı</span>
            </div>
            <div>
              <span className="text-white/30 uppercase mr-2 tracking-wider">Üye Memnuniyeti:</span>
              <span className="text-amber-300 font-semibold inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {overallStats.avg} / 5.0 ({overallStats.count} Değerlendirme)
              </span>
            </div>
          </div>
        </header>
      </AppleReveal>

      {/* Status Switcher Tabs (Tümü / Gelecek / Yaptığımız) */}
      <AppleReveal delay={80}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl bg-black/35 border border-white/10 shadow-sm">
          
          {/* Main Status Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                statusFilter === 'all'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Tüm Etkinlikler</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${statusFilter === 'all' ? 'bg-black/10 text-black' : 'bg-white/10 text-white/70'}`}>
                {events.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                statusFilter === 'upcoming'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Gelecek Etkinlikler</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${statusFilter === 'upcoming' ? 'bg-black/10 text-black' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                statusFilter === 'completed'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>Yaptığımız Etkinlikler</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${statusFilter === 'completed' ? 'bg-black/10 text-black' : 'bg-white/10 text-white/70'}`}>
                {completedCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Etkinlik veya mekan ara..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
        </div>
      </AppleReveal>

      {/* Category Pills Bar */}
      <AppleReveal delay={120}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'Tüm Kategoriler' },
            { id: 'trip', label: '📸 Fotoğraf Gezileri' },
            { id: 'workshop', label: '🧪 Atölyeler' },
            { id: 'photowalk', label: '🚶 Photowalk Yürüyüşleri' },
            { id: 'exhibition', label: '🖼️ Sergiler' },
            { id: 'talk', label: '🎙️ Söyleşi & Eğitim' }
          ].map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-mono whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black border-white font-semibold shadow-sm'
                    : 'border-white/10 text-white/50 hover:text-white hover:border-white/25 bg-black/25'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </AppleReveal>

      {/* Events Grid */}
      <AppleReveal delay={160}>
        {filteredEvents.length === 0 ? (
          <div className="p-12 rounded-3xl border border-white/10 bg-black/25 text-center space-y-4">
            <Calendar className="w-10 h-10 text-white/30 mx-auto" />
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white font-club">
                Eşleşen Etkinlik Bulunamadı
              </h3>
              <p className="text-xs text-white/50 font-light">
                Arama kriterlerinize veya filtreye uygun etkinlik bulunamadı. Filtreleri temizleyebilir veya aklınızdaki etkinliği kulübe önerebilirsiniz.
              </p>
            </div>
            <button
              onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
              className="px-5 py-2 rounded-xl border border-white/15 text-xs font-mono text-white/80 hover:text-white cursor-pointer bg-white/5"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredEvents.map((event) => {
              const isUpcoming = event.status === 'upcoming';
              const stats = getEventStats(event.id);
              const isExpanded = expandedReviews[event.id];

              return (
                <div 
                  key={event.id}
                  className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden flex flex-col justify-between shadow-xl transition-all hover:border-white/20 group"
                >
                  <div>
                    {/* Event Cover Photo & Badges */}
                    <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-black/50">
                      <img 
                        src={event.image_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold backdrop-blur-md bg-black/60 border border-white/20 text-white">
                          {event.category_label}
                        </span>

                        <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold backdrop-blur-md border ${
                          isUpcoming 
                            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' 
                            : 'bg-white/15 border-white/25 text-white/90'
                        }`}>
                          {isUpcoming ? 'Gelecek Etkinlik' : 'Yaptığımız Etkinlik'}
                        </span>
                      </div>

                      {/* Bottom Title on Image */}
                      <div className="absolute bottom-4 left-4 right-4 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{event.date}</span>
                          {event.time && (
                            <>
                              <span>•</span>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{event.time}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white font-club leading-tight drop-shadow-md">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    {/* Event Body Info */}
                    <div className="p-5 sm:p-6 space-y-4">
                      
                      {/* Location & Quota meta */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-white/70 font-light border-b border-white/[0.08] pb-3">
                        <div className="flex items-center gap-1.5 text-white/80">
                          <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>{event.location}</span>
                        </div>
                        {event.quota && (
                          <div className="flex items-center gap-1.5 text-white/60">
                            <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            <span>
                              {event.registered_count ? `${event.registered_count} / ` : ''}{event.quota} Kontenjan
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed">
                        {event.description}
                      </p>

                      {event.long_description && (
                        <p className="text-xs text-white/50 font-light leading-relaxed border-l-2 border-amber-400/30 pl-3">
                          {event.long_description}
                        </p>
                      )}

                      {/* Rating Summary Strip */}
                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx <= Math.round(stats.average || 5)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-mono font-bold text-white">
                            {stats.count > 0 ? `${stats.average} / 5.0` : '5.0 / 5.0'}
                          </span>
                          <span className="text-[11px] text-white/40 font-mono">
                            ({stats.count > 0 ? `${stats.count} Değerlendirme` : 'Yeni Etkinlik'})
                          </span>
                        </div>

                        {stats.count > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleReviews(event.id)}
                            className="text-[11px] font-mono text-amber-300/80 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{isExpanded ? 'Yorumları Gizle' : 'Yorumları Gör'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Expandable Member Reviews */}
                      {isExpanded && stats.evals.length > 0 && (
                        <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                            Üye Yorumları & Deneyimleri ({stats.evals.length})
                          </span>
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {stats.evals.map((ev) => (
                              <div key={ev.id} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{ev.evaluator_name || 'Anonim'}</span>
                                    <div className="flex items-center text-amber-400">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`w-2.5 h-2.5 ${s <= ev.rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono text-white/30">
                                    {new Date(ev.created_at).toLocaleDateString('tr-TR')}
                                  </span>
                                </div>
                                {ev.comment && (
                                  <p className="text-white/70 font-light text-[11px] leading-relaxed">
                                    "{ev.comment}"
                                  </p>
                                )}
                                {ev.liked_aspects && ev.liked_aspects.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {ev.liked_aspects.map((asp, i) => (
                                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                                        {asp}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Card Action Buttons (Etkinliği Değerlendir & Öneride Bulun) */}
                  <div className="p-5 sm:p-6 pt-0 border-t border-white/[0.06] mt-4 flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Left Actions: Evaluate & Suggest specifically */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedEventForEvaluation(event)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/25 text-amber-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-300/40 text-amber-300" />
                        <span>Etkinliği Değerlendir (5 Üzerinden)</span>
                      </button>

                      <button
                        onClick={() => setSelectedEventForSuggestion(event)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-white/60" />
                        <span>Öneride Bulun</span>
                      </button>
                    </div>

                    {/* Right Action: If upcoming, reserve equipment */}
                    {isUpcoming && (
                      <button
                        onClick={() => onNavigate('reserve', event.trip_id || undefined)}
                        className="px-4 py-2 rounded-xl bg-white text-black text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-white/90 transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ekipman Rezerve Et</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </AppleReveal>

      {/* Callout Banner: Suggest a completely new event */}
      <AppleReveal delay={200}>
        <div className="p-8 sm:p-10 rounded-3xl border border-white/15 bg-gradient-to-r from-black/50 via-black/35 to-amber-950/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Kulüp Fikir Havuzu</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-club tracking-tight">
              Aklında bir gezi, atölye veya sergi fikri mi var?
            </h3>
            <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
              Kulübümüzün bir sonraki rotasını veya atölye konusunu sen belirle. Fikirlerini doğrudan yönetim kurulumuza iletebilirsin.
            </p>
          </div>

          <button
            onClick={() => setShowGeneralSuggestionModal(true)}
            className="px-6 py-3 rounded-full bg-white text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-white/90 transition-all cursor-pointer shadow-lg active:scale-95 shrink-0 flex items-center gap-2"
          >
            <span>Fikrini Paylaş</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </AppleReveal>

      {/* Event Evaluation Modal */}
      <EventEvaluationModal
        isOpen={Boolean(selectedEventForEvaluation)}
        onClose={() => setSelectedEventForEvaluation(null)}
        event={selectedEventForEvaluation}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Event-specific Suggestion Modal */}
      <EventSuggestionModal
        isOpen={Boolean(selectedEventForSuggestion)}
        onClose={() => setSelectedEventForSuggestion(null)}
        targetEvent={selectedEventForSuggestion ? { id: selectedEventForSuggestion.id, title: selectedEventForSuggestion.title } : null}
      />

      {/* General Event Suggestion Modal */}
      <EventSuggestionModal
        isOpen={showGeneralSuggestionModal}
        onClose={() => setShowGeneralSuggestionModal(false)}
        targetEvent={null}
      />

    </div>
  );
};
