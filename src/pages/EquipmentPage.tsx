import React, { useState, useEffect } from 'react';
import { Camera, Search, Filter, ArrowRight, Package, Check, AlertCircle, Info, X, MapPin, History, Clock, User, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';
import { Equipment, Reservation } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { TabType } from '../lib/routes';
import { AppleReveal } from '../components/AppleReveal';

interface EquipmentPageProps {
  onSelectEquipmentToReserve: (equipmentId: string) => void;
  onNavigate: (tab: TabType, extraParam?: string) => void;
  isAdmin?: boolean;
}

export const EquipmentPage: React.FC<EquipmentPageProps> = ({ onSelectEquipmentToReserve, onNavigate, isAdmin }) => {
  const initialSync = React.useMemo(() => api.getInitialSyncState(), []);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(() => Boolean(isAdmin || initialSync.activeAdmin));
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(initialSync.equipmentList);
  const [allReservations, setAllReservations] = useState<Reservation[]>(initialSync.reservations);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedItemForModal, setSelectedItemForModal] = useState<Equipment | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    setIsAdminUser(Boolean(isAdmin || initialSync.activeAdmin));
  }, [isAdmin, initialSync.activeAdmin]);

  useEffect(() => {
    const unsub = api.onAuthChange((admin) => {
      setIsAdminUser(Boolean(admin));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdminUser && modalTab === 'history') {
      setModalTab('details');
    }
  }, [isAdminUser, modalTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bundle = await api.getDashboardBundle();
        setEquipmentList(bundle.equipmentList);
        setAllReservations(bundle.reservations);
      } catch (e) {
        console.error('Ekipman yükleme hatası:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, 15000);
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'all' || 
      item.category === selectedCategory ||
      (selectedCategory === 'accessory' && (item.category === 'accessory' || item.category === 'tripod'));
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [
    { id: 'all', label: 'Tüm Ekipmanlar' },
    { id: 'camera', label: 'DSLR Gövdeler' },
    { id: 'analog', label: 'Analog Makineler' },
    { id: 'lens', label: 'Objektifler' },
    { id: 'lighting', label: 'Flaş & Işık' },
    { id: 'accessory', label: 'Aksesuarlar' },
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'camera': return 'Gövde (DSLR)';
      case 'analog': return 'Analog Makine (35mm)';
      case 'lens': return 'Objektif (Lens)';
      case 'lighting': return 'Flaş & Aydınlatma';
      case 'tripod': return 'Tripod & Destek';
      case 'accessory': return 'Filtre & Aksesuar';
      default: return category;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-14 text-[#ded0d9]">
      
      {/* Header */}
      <AppleReveal className="space-y-3">
        <div className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/40">
          Envanter & Ekipman
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-club">
          Kamera ve Ekipman Havuzu
        </h1>
        <p className="text-base sm:text-lg text-white/60 font-light leading-relaxed max-w-2xl">
          Kulüp bünyesindeki Full Frame ve Crop DSLR gövdeler, profesyonel L serisi objektifler, analog makineler ve çekim aksesuarları.
        </p>
      </AppleReveal>

      {/* Educational Guide Highlight (Apple Editorial Highlight) */}
      <AppleReveal delay={120} variant="subtle" className="rounded-2xl border border-white/10 bg-black/25 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-white/40">
            Fotoğrafçılık & Ekipman Rehberi
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Hangi Çekim Türü İçin Hangi Ekipman Alınmalı?
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
            Sokak, portre, mimarlık veya konser çekimleri için en uygun gövde + lens kombolarını rehber sayfamızda inceleyin.
          </p>
        </div>
        <button
          onClick={() => onNavigate('guide')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white !text-[#1c020d] hover:bg-white/90 text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 !text-[#1c020d]" />
          <span className="!text-[#1c020d] font-bold">Rehberi Aç</span>
          <ArrowRight className="w-3.5 h-3.5 !text-[#1c020d]" />
        </button>
      </AppleReveal>

      {/* Category Bar & Search */}
      <div className="space-y-6">
        
        {/* Category Horizontal Tab Bar */}
        <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto border-b border-white/[0.08] pb-3 text-xs scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`pb-3 font-mono text-xs tracking-wide whitespace-nowrap cursor-pointer transition-colors relative ${
                  isActive
                    ? 'text-white font-medium after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-white'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Model veya demirbaş no ile ara (örn: Canon 6D, 50mm, analog)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/35 border border-white/10 text-white placeholder:text-white/35 text-xs font-mono focus:border-white/40 transition-all"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Duruma göre filtrele"
              className="w-full px-4 py-3 rounded-xl bg-black/35 border border-white/10 text-white text-xs font-mono focus:border-white/40 transition-all cursor-pointer"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="available">Yalnızca Müsait Olanlar</option>
              <option value="reserved">Rezerve Edilenler</option>
              <option value="in_use">Zimmette Olanlar</option>
              <option value="maintenance">Bakımda Olanlar</option>
            </select>
          </div>
        </div>

        {/* Minimal Single Notice Banner */}
        <div className="p-4 rounded-xl border border-white/10 bg-black/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-white/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span>
              <strong className="text-white font-normal">Teslim & İade:</strong> Kulüpler Vadisi, Davutpaşa Kampüsü (Tek yetkili nokta).
            </span>
          </div>
          <span className="text-white/40 text-[11px]">
            5D Mark II (CF kartlı) haricindeki tüm gövdelerde üyeler kendi SD kartını getirmelidir.
          </span>
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="py-24 text-center text-white/40 font-mono text-xs">
          <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
          Ekipmanlar yükleniyor...
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-white/10 space-y-2">
          <AlertCircle className="w-8 h-8 text-white/30 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Ekipman Bulunamadı</h3>
          <p className="text-xs text-white/40 font-light">Arama kriterlerinize uygun ekipman kaydı bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item, idx) => (
            <AppleReveal
              key={item.id}
              delay={(idx % 6) * 60}
              variant="scale"
              className="rounded-2xl border border-white/10 hover:border-white/25 bg-black/25 hover:bg-black/35 transition-all overflow-hidden flex flex-col group cursor-pointer shadow-sm"
              onClick={() => setSelectedItemForModal(item)}
            >
              {/* Photo */}
              <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={item.status} type="equipment" size="sm" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/10">
                    {item.serial_number}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    {item.brand} • {getCategoryLabel(item.category)}
                  </div>
                  <h3 className="text-base font-semibold text-white font-club mt-1 tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-white/60 font-light mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                  <span className="text-white/40 text-[11px] font-mono">
                    Kondisyon: <strong className="text-white font-normal">{item.current_condition || 'Standart'}</strong>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEquipmentToReserve(item.id);
                      onNavigate('reserve');
                    }}
                    disabled={item.status === 'maintenance'}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                      item.status === 'maintenance'
                        ? 'border border-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-white/90 cursor-pointer shadow-sm active:scale-[0.98]'
                    }`}
                  >
                    Rezerve Et
                  </button>
                </div>
              </div>
            </AppleReveal>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItemForModal && (
        <div 
          onClick={() => setSelectedItemForModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#180610] border border-white/15 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                    {selectedItemForModal.brand} • {getCategoryLabel(selectedItemForModal.category)}
                  </span>
                  <StatusBadge status={selectedItemForModal.status} type="equipment" size="sm" />
                </div>
                <h2 className="text-2xl font-bold text-white font-club tracking-tight">
                  {selectedItemForModal.name}
                </h2>
                <span className="text-xs font-mono text-white/40">
                  Demirbaş No: {selectedItemForModal.serial_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/[0.08] px-6 gap-6 text-xs font-mono">
              <button
                onClick={() => setModalTab('details')}
                className={`py-3.5 transition-colors relative cursor-pointer ${
                  modalTab === 'details' || !isAdminUser
                    ? 'text-white font-medium after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-white'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                Özellikler & Kutu
              </button>
              {isAdminUser && (
                <button
                  onClick={() => setModalTab('history')}
                  className={`py-3.5 transition-colors relative cursor-pointer ${
                    modalTab === 'history'
                      ? 'text-white font-medium after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Zimmet Geçmişi ({allReservations.filter(r => r.equipment_id === selectedItemForModal.id && r.status !== 'rejected').length})
                </button>
              )}
            </div>

            {/* Modal Content */}
            {modalTab === 'details' || !isAdminUser ? (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08]">
                  <img
                    src={selectedItemForModal.image_url}
                    alt={selectedItemForModal.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {selectedItemForModal.category === 'camera' && (
                  selectedItemForModal.id === 'e-5d2' ? (
                    <div className="p-4 rounded-xl border border-white/15 bg-black/35 text-xs text-white/80 font-mono">
                      <strong className="text-white block mb-0.5">Hafıza Kartı:</strong>
                      Bu gövde CompactFlash (CF) kart ile çalışmaktadır. 32GB CF kart ve USB okuyucu çanta içerisinde hazır teslim edilir.
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-white/10 bg-black/35 text-xs text-white/60 font-mono">
                      <strong className="text-white block mb-0.5">SD Kart Uyarısı:</strong>
                      Bu gövdeye SD kart dahil değildir. Çekime gelirken kendi SD kartınızı yanınızda getirmelisiniz.
                    </div>
                  )
                )}

                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-white/40">Açıklama</h4>
                  <p className="text-xs text-white/70 font-light leading-relaxed">{selectedItemForModal.description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-white/40">Kutu İçeriği & Aksesuarlar</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 rounded-xl border border-white/10 bg-black/30 text-xs">
                    {selectedItemForModal.package_contents.map((pkgItem, index) => (
                      <li key={index} className="flex items-center gap-2 text-white/80 font-light">
                        <Check className="w-3.5 h-3.5 text-white/50 shrink-0" />
                        <span>{pkgItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto space-y-4">
                {allReservations.filter(r => r.equipment_id === selectedItemForModal.id && r.status !== 'rejected').length > 0 ? (
                  <div className="space-y-2.5">
                    {allReservations
                      .filter(r => r.equipment_id === selectedItemForModal.id && r.status !== 'rejected')
                      .sort((a, b) => new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime())
                      .map((res) => (
                        <div key={res.id} className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-white font-medium">{res.reservation_code}</span>
                            <span className="text-white/40 font-mono text-[11px]">{res.pickup_date} → {res.return_date}</span>
                          </div>
                          <div className="text-white/60">
                            Üye: <strong className="text-white">{res.member?.full_name || res.student_number}</strong>
                          </div>
                          <div className="text-[11px] text-white/50 pt-1.5 border-t border-white/[0.04]">
                            Amacı: {res.purpose}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs font-mono text-white/40">
                    Bu ekipman için henüz bir kullanım kaydı bulunmamaktadır.
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Action Bar */}
            <div className="p-5 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-white/60 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  onSelectEquipmentToReserve(selectedItemForModal.id);
                  setSelectedItemForModal(null);
                  onNavigate('reserve');
                }}
                disabled={selectedItemForModal.status === 'maintenance'}
                className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-mono font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:bg-white/10 disabled:text-white/20"
              >
                Hemen Rezerve Et
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
