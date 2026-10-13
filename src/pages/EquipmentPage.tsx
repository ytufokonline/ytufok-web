import React, { useState, useEffect } from 'react';
import { Camera, Search, Filter, ArrowRight, Package, Check, AlertCircle, Info, X, MapPin, History, Clock, User, AlertTriangle, Sparkles } from 'lucide-react';
import { Equipment, Reservation } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

interface EquipmentPageProps {
  onSelectEquipmentToReserve: (equipmentId: string) => void;
  onNavigate: (tab: 'home' | 'equipment' | 'reserve' | 'status' | 'admin') => void;
}

export const EquipmentPage: React.FC<EquipmentPageProps> = ({ onSelectEquipmentToReserve, onNavigate }) => {
  const initialSync = React.useMemo(() => api.getInitialSyncState(), []);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(initialSync.equipmentList);
  const [allReservations, setAllReservations] = useState<Reservation[]>(initialSync.reservations);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedItemForModal, setSelectedItemForModal] = useState<Equipment | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'history'>('details');

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
    { id: 'camera', label: 'Dijital Gövdeler' },
    { id: 'analog', label: 'Analog Makineler' },
    { id: 'lens', label: 'Objektifler (Lensler)' },
    { id: 'lighting', label: 'Flaş & Işık' },
    { id: 'accessory', label: 'Filtre & Aksesuar' },
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'camera': return 'Gövde (DSLR)';
      case 'analog': return 'Analog (35mm)';
      case 'lens': return 'Objektif (Lens)';
      case 'lighting': return 'Flaş & Aydınlatma';
      case 'tripod': return 'Tripod & Destek';
      case 'accessory': return 'Filtre & Aksesuar';
      default: return category;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Editorial Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#a9b9d3] text-[11px] font-medium uppercase tracking-[0.14em]">
          <Camera className="w-3.5 h-3.5 text-[#8193b2]" />
          <span>Demirbaş Kataloğu</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-club">
          Kamera ve Ekipman Havuzu
        </h1>
        <p className="text-[#a9b9d3] text-xs sm:text-sm max-w-2xl leading-relaxed">
          Kulüp bünyesindeki Canon DSLR gövdeler, profesyonel lensler, analog makineler ve aksesuarların 
          anlık durumlarını inceleyebilir ve rezervasyon yapabilirsiniz.
        </p>
      </div>

      {/* Refined Integrated Policy Banner */}
      <div className="studio-card rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        <div className="flex items-start gap-3 pt-2 md:pt-0">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#8193b2] shrink-0">
            <MapPin className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div>
            <strong className="text-white block font-medium">Tek Teslim & İade Noktası</strong>
            <span className="text-[#a9b9d3] text-[11px] leading-relaxed">Kulüpler Vadisi, Davutpaşa Kampüsü. Başka bir noktada teslimat yapılmaz.</span>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-3 md:pt-0 md:pl-4">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-amber-300/80 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-300/80" />
          </div>
          <div>
            <strong className="text-white block font-medium">SD Kart Durumu</strong>
            <span className="text-[#a9b9d3] text-[11px] leading-relaxed">5D Mark II (CF kartlı) harici gövdelerde üyeler kendi SD kartını getirmelidir.</span>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-3 md:pt-0 md:pl-4">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#8193b2] shrink-0">
            <Sparkles className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div>
            <strong className="text-white block font-medium">Rezervasyon Önceliği</strong>
            <span className="text-[#a9b9d3] text-[11px] leading-relaxed">Aktif kulüp üyeleri 1. derece önceliklidir (5 gün erken rezerve hakkı).</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="studio-card rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-[#8193b2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Model, marka veya demirbaş no ara (örn: Canon 6D, 50mm, analog)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-white placeholder-[#a9b9d3]/50 text-xs focus:outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Duruma göre filtrele"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#12080f]/80 border border-white/[0.08] text-[#dce4ef] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Ekipman Durumları</option>
              <option value="available">Sadece Müsait Olanlar</option>
              <option value="reserved">Rezerve Edilenler</option>
              <option value="in_use">Zimmette Olanlar</option>
              <option value="maintenance">Bakımda Olanlar</option>
            </select>
          </div>
        </div>

        {/* Apple Segmented Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/[0.06] text-xs">
          <span className="text-[#a9b9d3] mr-1 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3 text-[#8193b2]" /> Filtre:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white/[0.14] text-white border border-white/[0.14] shadow-sm'
                  : 'bg-white/[0.03] text-[#a9b9d3] hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="py-24 text-center text-[#a9b9d3]">
          <div className="w-7 h-7 border-2 border-[#8193b2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Ekipmanlar yükleniyor...
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="py-20 text-center rounded-2xl studio-card space-y-3">
          <AlertCircle className="w-8 h-8 text-[#8193b2] mx-auto opacity-70" />
          <h3 className="text-sm font-semibold text-white">Ekipman Bulunamadı</h3>
          <p className="text-xs text-[#a9b9d3]">Arama kriterlerine uygun sonuç çıkmadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl studio-card-interactive overflow-hidden flex flex-col group"
            >
              <div className="relative h-56 bg-black/50 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={item.status} type="equipment" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-md bg-[#12080f]/80 backdrop-blur-md text-[11px] font-mono font-medium text-[#dce4ef] border border-white/[0.08]">
                    {item.serial_number}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[10px] font-semibold text-[#8193b2] uppercase tracking-wider mb-1">
                    {item.brand} • {getCategoryLabel(item.category)}
                  </div>
                  <h3 className="text-base font-bold text-white font-club">
                    {item.name}
                  </h3>

                  {item.category === 'camera' && (
                    item.id === 'e-5d2' ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-200">
                        <Info className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>CF Kart & Okuyucu Çantada Dahil</span>
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#dce4ef]">
                        <AlertTriangle className="w-3 h-3 text-amber-300/80 shrink-0" />
                        <span>SD Kart Dahil Değil (Üye Getirmeli)</span>
                      </div>
                    )
                  )}

                  <p className="text-[#a9b9d3] text-xs mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="bg-[#12080f]/60 rounded-xl p-3 border border-white/[0.06] space-y-1.5 text-xs">
                  {Object.entries(item.specs).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-[#dce4ef]">
                      <span className="text-[#a9b9d3]">{key}:</span>
                      <span className="text-white font-medium truncate max-w-[170px]">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#dce4ef] pt-1.5 border-t border-white/[0.06]">
                    <span className="text-[#a9b9d3]">Kondisyon:</span>
                    <span className="text-[#8193b2] font-medium truncate max-w-[170px]">{item.current_condition || 'Standart'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedItemForModal(item)}
                    className="flex-1 py-2 px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#dce4ef] hover:text-white text-xs font-medium transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 border border-white/[0.08]"
                  >
                    <Info className="w-3.5 h-3.5 text-[#8193b2]" />
                    <span>Detay & Kutu</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectEquipmentToReserve(item.id);
                      onNavigate('reserve');
                    }}
                    disabled={item.status === 'maintenance'}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      item.status === 'maintenance'
                        ? 'bg-white/[0.04] text-[#a9b9d3]/40 cursor-not-allowed border border-transparent'
                        : 'bg-white/[0.1] hover:bg-white/[0.18] text-white border border-white/[0.12] active:scale-[0.98]'
                    }`}
                  >
                    <span>Rezerve Et</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ekipman Detay Modalı (Apple Sheet Style) */}
      {selectedItemForModal && (
        <div 
          onClick={() => setSelectedItemForModal(null)}
          className="fixed inset-0 z-50 bg-[#12080f]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full studio-card rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border border-white/[0.1]"
          >
            <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-start justify-between bg-[#140911]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase font-medium text-[#8193b2]">
                    {selectedItemForModal.brand} • {getCategoryLabel(selectedItemForModal.category)}
                  </span>
                  <StatusBadge status={selectedItemForModal.status} type="equipment" size="sm" />
                </div>
                <h2 className="text-xl font-bold text-white font-club">
                  {selectedItemForModal.name}
                </h2>
                <span className="text-xs font-mono text-[#a9b9d3]">
                  Demirbaş Kodu: {selectedItemForModal.serial_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#a9b9d3] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/[0.06] bg-[#140911] px-6">
              <button
                onClick={() => setModalTab('details')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  modalTab === 'details'
                    ? 'border-[#8193b2] text-white'
                    : 'border-transparent text-[#a9b9d3] hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Özellikler & Kutu</span>
              </button>
              <button
                onClick={() => setModalTab('history')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  modalTab === 'history'
                    ? 'border-[#8193b2] text-white'
                    : 'border-transparent text-[#a9b9d3] hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Kullanım & Zimmet Geçmişi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-[#8193b2] border border-white/[0.08]">
                  {allReservations.filter(r => r.equipment_id === selectedItemForModal.id).length}
                </span>
              </button>
            </div>

            {modalTab === 'details' ? (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="h-60 rounded-xl overflow-hidden bg-black/40 border border-white/[0.06]">
                  <img
                    src={selectedItemForModal.image_url}
                    alt={selectedItemForModal.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {selectedItemForModal.category === 'camera' && (
                  selectedItemForModal.id === 'e-5d2' ? (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-200">
                        <Info className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Hafıza Kartı: CompactFlash (CF) Kart Dahil</span>
                      </div>
                      <p className="text-[11px] text-[#dce4ef] leading-relaxed">
                        Canon EOS 5D Mark II gövdesi CompactFlash (CF) kart ile çalışmaktadır. 32GB CF kart ve USB okuyucu, çanta içerisinde kulüp tarafından hazır olarak teslim edilmektedir (SD kart girişi bulunmaz).
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#dce4ef]">
                        <AlertTriangle className="w-4 h-4 text-amber-300/80 shrink-0" />
                        <span>Önemli Hatırlatma: Bu Gövdeye SD Kart Dahil Değildir!</span>
                      </div>
                      <p className="text-[11px] text-[#a9b9d3] leading-relaxed">
                        Kulübümüz bünyesinde SD kart temini bulunmamaktadır. Çekime gelirken kendi SD kartınızı yanınızda getirmeniz gerekmektedir. Eğer SD kartınız yoksa rezervasyon formu doldururken not alanında mutlaka belirtiniz.
                      </p>
                    </div>
                  )
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] mb-2">Açıklama</h4>
                  <p className="text-xs text-[#dce4ef] leading-relaxed">{selectedItemForModal.description}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] mb-2 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-white" />
                    <span>Kutu İçeriği & Aksesuarlar</span>
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3.5 rounded-xl bg-[#12080f]/80 border border-white/[0.06] text-xs">
                    {selectedItemForModal.package_contents.map((pkgItem, index) => (
                      <li key={index} className="flex items-center gap-2 text-[#dce4ef]">
                        <Check className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                        <span>{pkgItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#12080f]/80 border border-white/[0.06] text-center text-xs">
                  <div>
                    <span className="text-[#8193b2] text-[10px] uppercase font-medium block">Toplam Zimmet</span>
                    <strong className="text-white text-base font-club">
                      {allReservations.filter(r => r.equipment_id === selectedItemForModal.id).length} Kez
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#8193b2] text-[10px] uppercase font-medium block">Tamamlanan İade</span>
                    <strong className="text-[#a9b9d3] text-base font-club">
                      {allReservations.filter(r => r.equipment_id === selectedItemForModal.id && r.status === 'returned').length} Kez
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#8193b2] text-[10px] uppercase font-medium block">Kondisyon</span>
                    <strong className="text-white text-xs font-medium block truncate">
                      {selectedItemForModal.current_condition || 'Standart'}
                    </strong>
                  </div>
                </div>

                {allReservations.filter(r => r.equipment_id === selectedItemForModal.id).length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Zimmet Kronolojisi</span>
                    </h4>

                    {allReservations
                      .filter(r => r.equipment_id === selectedItemForModal.id)
                      .sort((a, b) => new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime())
                      .map((res) => (
                        <div
                          key={res.id}
                          className="p-4 rounded-xl studio-card space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-[#dce4ef] text-xs">
                                {res.reservation_code}
                              </span>
                              <StatusBadge status={res.status} type="reservation" size="sm" />
                            </div>
                            <span className="text-[11px] text-[#8193b2] font-mono">
                              {res.pickup_date} → {res.return_date}
                            </span>
                          </div>

                          <div className="text-xs flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-[#8193b2]" />
                            <span className="text-[#a9b9d3]">Kullanan Üye: </span>
                            <strong className="text-white">
                              {res.member?.full_name || res.student_number}
                            </strong>
                          </div>

                          <div className="text-xs text-[#dce4ef] bg-[#12080f]/80 p-2.5 rounded-lg border border-white/[0.05] space-y-1">
                            <span className="text-[10px] text-[#8193b2] block font-semibold uppercase tracking-wider">
                              Çekim Projesi / Kullanım Amacı:
                            </span>
                            <span>{res.purpose}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-[#12080f]/80 border border-white/[0.06] space-y-2">
                    <History className="w-8 h-8 text-[#8193b2] mx-auto opacity-50" />
                    <h4 className="text-xs font-semibold text-white">Henüz Kullanım Kaydı Bulunmuyor</h4>
                    <p className="text-[11px] text-[#a9b9d3]">Bu ekipman için tamamlanmış bir zimmet kaydı bulunmuyor. İlk rezervasyon yapan siz olabilirsiniz!</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-[#140911] flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#dce4ef] text-xs font-medium transition-colors"
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
                className="px-5 py-2.5 rounded-full bg-[#dce4ef] hover:bg-white text-[#12080f] text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <span>Rezerve Et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
