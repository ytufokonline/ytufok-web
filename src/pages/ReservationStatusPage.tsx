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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-14 text-[#eed1d1]">
      
      {/* Header */}
      <header className="space-y-3">
        <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/40">
          Sorgulama & Takip
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-club">
          Rezervasyon Takibi
        </h1>
        <p className="text-base sm:text-lg text-white/60 font-light leading-relaxed max-w-2xl">
          Rezervasyon kodunuz (örn: YTU-2026-B101) veya öğrenci numaranız ile anlık onay durumunuzu sorgulayabilirsiniz.
        </p>
      </header>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Takip Kodu (YTU-... / KO-...) veya Öğrenci Numarası..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/25 text-xs font-mono focus:border-white/40 transition-all"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-8 py-3.5 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-xs font-mono uppercase tracking-wider cursor-pointer transition-all disabled:opacity-40 shadow-sm"
          >
            {searching ? 'Sorgulanıyor...' : 'Sorgula'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-white/40 flex-wrap">
          <span>Örnek Kodlar:</span>
          <button 
            type="button" 
            onClick={() => setQuery('YTU-2026-B101')} 
            className="px-2 py-0.5 rounded border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            YTU-2026-B101
          </button>
          <span>•</span>
          <button 
            type="button" 
            onClick={() => setQuery('KO-2026-101')} 
            className="px-2 py-0.5 rounded border border-white/10 text-white/70 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
          >
            KO-2026-101 (Karanlık Oda)
          </button>
        </div>
      </form>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-8 pt-4 border-t border-white/[0.08]">
          {totalFound > 0 ? (
            <>
              {/* Equipment Results */}
              {equipmentResults.length > 0 && (
                <div className="space-y-4">
                  <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40">
                    Ekipman Rezervasyonları ({equipmentResults.length})
                  </div>

                  {equipmentResults.map((res) => (
                    <div
                      key={res.id}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
                        <div className="flex items-center gap-3.5">
                          <span className="text-xl font-mono font-bold text-white tracking-widest">
                            {res.reservation_code}
                          </span>
                          <StatusBadge status={res.status} type="reservation" size="sm" />
                        </div>
                        <span className="text-xs font-mono text-white/50">
                          Öğrenci No: <strong className="text-white font-mono">{res.student_number}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Ekipman</span>
                          <strong className="text-white block font-club text-sm">{res.equipment?.name}</strong>
                          <span className="text-white/40 font-mono text-[11px] block">Demirbaş: {res.equipment?.serial_number}</span>
                        </div>

                        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Tarih Bilgisi</span>
                          <div className="text-white/70">Teslim Alma: <strong className="text-white font-mono">{res.pickup_date}</strong></div>
                          <div className="text-white/70">İade Tarihi: <strong className="text-white font-mono">{res.return_date}</strong></div>
                          {res.status === 'rejected' ? (
                            <div className="pt-2 space-y-0.5 border-t border-rose-500/20 mt-1.5">
                              <div className="text-rose-400 text-xs font-mono">
                                Ret: <span className="text-rose-300">{res.approved_by?.replace(/\s*\([Rr]ed\)/gi, '') || 'Yönetim Kurulu'}</span>
                              </div>
                              {res.rejection_reason && (
                                <div className="text-rose-300/80 text-xs font-light">
                                  Gerekçe: {res.rejection_reason}
                                </div>
                              )}
                            </div>
                          ) : res.approved_by ? (
                            <div className="text-emerald-400 pt-1 text-xs font-mono">
                              Onaylayan: <span className="text-emerald-300">{res.approved_by.replace(/\s*\([Rr]ed\)/gi, '')}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {res.purpose && (
                        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] text-xs text-white/80 space-y-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Kullanım Amacı</span>
                          <p className="font-light leading-relaxed">{res.purpose}</p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-white/40">
                        <span>Teslimat: Kulüpler Vadisi, Davutpaşa</span>
                        <span>Öğrenci Kimliği Zorunludur</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Darkroom Results */}
              {darkroomResults.length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40">
                    Karanlık Oda Rezervasyonları ({darkroomResults.length})
                  </div>

                  {darkroomResults.map((ko) => (
                    <div
                      key={ko.id}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
                        <div className="flex items-center gap-3.5">
                          <span className="text-xl font-mono font-bold text-white tracking-widest">
                            {ko.reservation_code}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-white/10 text-white/80">
                            {ko.status === 'pending' ? 'Onay Bekliyor' : ko.status === 'approved' ? 'Onaylandı' : ko.status === 'completed' ? 'Tamamlandı' : 'Reddedildi'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-white/50">
                          Öğrenci No: <strong className="text-white font-mono">{ko.student_number}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">İşlem</span>
                          <strong className="text-white block text-sm">
                            {ko.process_type === 'bw_film' && 'Siyah-Beyaz Film Yıkama'}
                            {ko.process_type === 'photo_print' && 'Kağıda Fotoğraf Baskısı'}
                            {ko.process_type === 'film_scan' && 'Film Tarama'}
                          </strong>
                          <span className="text-white/50 font-mono">
                            {ko.process_type === 'photo_print' ? `${ko.film_count} Baskı` : `${ko.film_count} Rulo Film`}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">Seans</span>
                          <strong className="text-white font-mono block text-sm">
                            {ko.date} • {ko.slot_time}
                          </strong>
                          <span className="text-white/40 font-mono">Net 90 Dakika</span>
                          {ko.status === 'rejected' ? (
                            <div className="pt-2 space-y-0.5 border-t border-rose-500/20 mt-1.5">
                              <div className="text-rose-400 text-xs font-mono">
                                Ret: <span className="text-rose-300">{ko.approved_by?.replace(/\s*\([Rr]ed\)/gi, '') || 'Yönetim Kurulu'}</span>
                              </div>
                              {ko.rejection_reason && (
                                <div className="text-rose-300/80 text-xs font-light">
                                  Gerekçe: {ko.rejection_reason}
                                </div>
                              )}
                            </div>
                          ) : ko.approved_by ? (
                            <div className="text-emerald-400 pt-1 text-xs font-mono">
                              Onaylayan: <span className="text-emerald-300">{ko.approved_by.replace(/\s*\([Rr]ed\)/gi, '')}</span>
                              {ko.supervisor && <span className="text-white/40 ml-1">({ko.supervisor})</span>}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 space-y-2">
              <AlertCircle className="w-8 h-8 text-white/30 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Kayıt Bulunamadı</h3>
              <p className="text-xs text-white/40 font-light font-mono">"{query}" sorgusuna ait eşleşen rezervasyon kaydı bulunamadı.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
