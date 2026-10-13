import React, { useState } from 'react';
import { Search, AlertCircle, Droplets, Camera, Clock, MapPin } from 'lucide-react';
import { Reservation, DarkroomReservation } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

interface ReservationStatusPageProps {
  onNavigate: (tab: 'home' | 'equipment' | 'reserve' | 'darkroom' | 'status' | 'admin') => void;
}

export const ReservationStatusPage: React.FC<ReservationStatusPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [equipmentResults, setEquipmentResults] = useState<Reservation[]>([]);
  const [darkroomResults, setDarkroomResults] = useState<DarkroomReservation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = React.useCallback(async (cleanQuery: string) => {
    if (!cleanQuery) return;
    setSearching(true);
    setHasSearched(true);

    try {
      const [allReservations, allDarkroom] = await Promise.all([
        api.getReservations(),
        api.getDarkroomReservations()
      ]);

      const matchedEquip = allReservations.filter((r) => 
        r.reservation_code.toUpperCase().includes(cleanQuery) ||
        r.student_number.includes(cleanQuery)
      );

      const matchedDark = allDarkroom.filter((r) => 
        r.reservation_code.toUpperCase().includes(cleanQuery) ||
        r.student_number.includes(cleanQuery)
      );

      setEquipmentResults(matchedEquip);
      setDarkroomResults(matchedDark);
    } catch (err) {
      console.error(err);
      setEquipmentResults([]);
      setDarkroomResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Auto-search if kod or code query param is present on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('kod') || params.get('code');
    if (code) {
      const cleanCode = code.trim().toUpperCase();
      setQuery(cleanCode);
      executeSearch(cleanCode);
    }
  }, [executeSearch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) return;

    window.history.replaceState(null, '', `/talep-sorgula?kod=${encodeURIComponent(cleanQuery)}`);
    executeSearch(cleanQuery);
  };

  const totalFound = equipmentResults.length + darkroomResults.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Editorial Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#a9b9d3] text-[11px] font-medium uppercase tracking-[0.14em]">
          <Search className="w-3.5 h-3.5 text-[#8193b2]" />
          <span>Talep Sorgulama</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-club">
          Rezervasyon Durumu Takibi
        </h1>
        <p className="text-[#a9b9d3] text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Takip kodunuz (örn: YTU-2026-B101) veya öğrenci numaranızla onay durumunu anlık olarak sorgulayabilirsiniz.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="max-w-xl mx-auto space-y-3">
        <div className="flex gap-2 p-1.5 rounded-2xl studio-card">
          <input
            type="text"
            placeholder="Takip Kodu (YTU-... / KO-...) veya Öğrenci No..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white placeholder-[#a9b9d3]/50 text-xs font-mono focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 rounded-xl bg-[#dce4ef] hover:bg-white text-[#12080f] font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {searching ? 'Aranıyor...' : <><Search className="w-3.5 h-3.5 text-[#12080f]" /><span>Sorgula</span></>}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-[#a9b9d3] flex-wrap">
          <span>Örnek Kodlar:</span>
          <button type="button" onClick={() => setQuery('YTU-2026-B101')} className="text-[#8193b2] hover:text-white underline font-mono cursor-pointer transition-colors">YTU-2026-B101</button>
          <span>•</span>
          <button type="button" onClick={() => setQuery('KO-2026-101')} className="text-rose-300 hover:text-rose-200 underline font-mono cursor-pointer transition-colors">KO-2026-101 (Karanlık Oda)</button>
          <span>•</span>
          <button type="button" onClick={() => setQuery('22052018')} className="text-[#8193b2] hover:text-white underline font-mono cursor-pointer transition-colors">22052018 (Öğrenci No)</button>
        </div>
      </form>

      {hasSearched && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {totalFound > 0 ? (
            <>
              {/* Equipment Results */}
              {equipmentResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#8193b2] uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-[#8193b2]" />
                    <span>Ekipman Rezervasyonları ({equipmentResults.length})</span>
                  </h3>

                  {equipmentResults.map((res) => (
                    <div
                      key={res.id}
                      className="rounded-2xl studio-card p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.06] gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold font-mono text-white tracking-wider">
                            {res.reservation_code}
                          </span>
                          <StatusBadge status={res.status} type="reservation" />
                        </div>
                        <span className="text-xs text-[#a9b9d3]">
                          Öğrenci: <strong className="text-white font-mono">{res.student_number}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-[#12080f]/80 border border-white/[0.06] space-y-1">
                          <span className="text-[10px] text-[#8193b2] uppercase font-medium block">Ekipman</span>
                          <strong className="text-white block font-club text-sm">{res.equipment?.name}</strong>
                          <span className="text-[#a9b9d3] font-mono text-[11px] block">Seri: {res.equipment?.serial_number}</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#12080f]/80 border border-white/[0.06] space-y-1">
                          <span className="text-[10px] text-[#8193b2] uppercase font-medium block">Tarih Bilgisi</span>
                          <div className="text-[#dce4ef]">Teslim: <strong className="text-white font-mono">{res.pickup_date}</strong></div>
                          <div className="text-[#dce4ef]">İade: <strong className="text-white font-mono">{res.return_date}</strong></div>
                          {res.approved_by && (
                            <div className="text-emerald-400 pt-0.5 text-[11px]">Onay: {res.approved_by}</div>
                          )}
                        </div>
                      </div>

                      {res.purpose && (
                        <div className="p-3 rounded-xl bg-[#12080f]/60 border border-white/[0.05] text-xs text-[#dce4ef]">
                          <span className="text-[10px] text-[#8193b2] uppercase font-medium block mb-0.5">Kullanım Amacı:</span>
                          <span>{res.purpose}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#a9b9d3]">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#8193b2]" />
                          <span>Tek Teslim & İade Noktası: Kulüpler Vadisi, Davutpaşa</span>
                        </span>
                        <span className="text-[#8193b2]">Öğrenci Kimliği Zorunludur</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Darkroom Results */}
              {darkroomResults.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-rose-400" />
                    <span>Karanlık Oda Rezervasyonları ({darkroomResults.length})</span>
                  </h3>

                  {darkroomResults.map((ko) => (
                    <div
                      key={ko.id}
                      className="rounded-2xl studio-card p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.06] gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold font-mono text-white tracking-wider">
                            {ko.reservation_code}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-[#dce4ef] border border-white/[0.1]">
                            {ko.status === 'pending' ? 'Onay Bekliyor' : ko.status === 'approved' ? 'Onaylandı' : ko.status === 'completed' ? 'Tamamlandı' : 'Reddedildi'}
                          </span>
                        </div>

                        <span className="text-xs text-[#a9b9d3]">
                          Öğrenci No: <strong className="text-white font-mono">{ko.student_number}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-[#12080f]/80 border border-white/[0.06] space-y-1">
                          <span className="text-[10px] text-[#8193b2] uppercase font-medium block">İşlem & Rulo</span>
                          <strong className="text-white block">
                            {ko.process_type === 'bw_film' && 'Siyah-Beyaz Film Yıkama'}
                            {ko.process_type === 'photo_print' && 'Kağıda Fotoğraf Baskısı'}
                            {ko.process_type === 'film_scan' && 'Film Tarama'}
                          </strong>
                          <span className="text-[11px] text-[#a9b9d3] block">
                            {ko.process_type === 'photo_print' ? `${ko.film_count} Baskı Adedi` : `${ko.film_count} Rulo Film`}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#12080f]/80 border border-white/[0.06] space-y-1">
                          <span className="text-[10px] text-[#8193b2] uppercase font-medium block">Seans & Zaman</span>
                          <strong className="text-rose-300 font-mono block">
                            {ko.date} • {ko.slot_time}
                          </strong>
                          <span className="text-[11px] text-[#a9b9d3] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#8193b2]" />
                            Net 1,5 Saat (90 dk)
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#a9b9d3]">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>Karanlık Oda, Kulüpler Vadisi</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center rounded-2xl studio-card space-y-2">
              <AlertCircle className="w-8 h-8 text-[#8193b2] mx-auto opacity-60" />
              <h3 className="text-sm font-semibold text-white">Kayıt Bulunamadı</h3>
              <p className="text-xs text-[#a9b9d3]">"{query}" kriterine uygun rezervasyon bulunamadı.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
