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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-white font-club tracking-tight">
          Kamera ve Ekipman Havuzu
        </h1>
        <p className="text-sm text-[#a9b9d3] max-w-2xl leading-relaxed">
          Kulüp bünyesindeki Canon DSLR gövdeler, profesyonel lensler, analog makineler ve aksesuarlar.
        </p>
      </div>

      {/* Clean Airbnb-Style Category Bar & Search */}
      <div className="space-y-6">
        
        {/* Category Horizontal Tab Bar */}
        <div className="flex items-center gap-8 overflow-x-auto border-b border-white/[0.08] pb-3 text-xs scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`pb-3 font-medium tracking-tight whitespace-nowrap cursor-pointer transition-colors relative ${
                  isActive
                    ? 'text-white font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-white'
                    : 'text-white/60 hover:text-white'
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
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Model veya demirbaş no ile ara (örn: Canon 6D, 50mm, analog)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#140a12] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Duruma göre filtrele"
              className="w-full px-3 py-2.5 rounded-lg bg-[#140a12] border border-white/[0.08] text-white/90 text-xs focus:outline-none cursor-pointer"
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
        <div className="surface-subtle p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#8193b2] shrink-0" />
            <span className="text-white/90">
              <strong>Teslim & İade:</strong> Kulüpler Vadisi, Davutpaşa Kampüsü (Tek yetkili nokta).
            </span>
          </div>
          <span className="text-[#a9b9d3] text-[11px]">
            ⚠️ 5D Mark II (CF kartlı) haricindeki tüm gövdelerde üyeler kendi SD kartını getirmelidir.
          </span>
        </div>
      </div>

      {/* Equipment Grid (Airbnb Listing Style) */}
      {loading ? (
        <div className="py-24 text-center text-[#a9b9d3]">
          <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
          Ekipmanlar yükleniyor...
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="py-20 text-center surface-card space-y-2">
          <AlertCircle className="w-8 h-8 text-white/40 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Ekipman Bulunamadı</h3>
          <p className="text-xs text-[#a9b9d3]">Arama kriterlerine uygun sonuç çıkmadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="surface-card-hover overflow-hidden flex flex-col group cursor-pointer"
              onClick={() => setSelectedItemForModal(item)}
            >
              {/* Photo */}
              <div className="relative aspect-[4/3] bg-black/50 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={item.status} type="equipment" size="sm" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/80 border border-white/[0.1]">
                    {item.serial_number}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[11px] font-medium text-[#8193b2] uppercase tracking-wider">
                    {item.brand} • {getCategoryLabel(item.category)}
                  </div>
                  <h3 className="text-base font-semibold text-white font-club mt-0.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#a9b9d3] mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#a9b9d3] text-[11px]">
                    Kondisyon: <strong className="text-white">{item.current_condition || 'Standart'}</strong>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEquipmentToReserve(item.id);
                      onNavigate('reserve');
                    }}
                    disabled={item.status === 'maintenance'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      item.status === 'maintenance'
                        ? 'bg-white/[0.04] text-white/30 cursor-not-allowed'
                        : 'bg-white text-[#12080f] hover:bg-[#dce4ef] cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    Rezerve Et
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal (Airbnb Listing Inspection Style) */}
      {selectedItemForModal && (
        <div 
          onClick={() => setSelectedItemForModal(null)}
          className="fixed inset-0 z-50 bg-[#12080f]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full surface-card overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-start justify-between bg-[#160a13]">
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
                  Demirbaş: {selectedItemForModal.serial_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/[0.08] bg-[#160a13] px-5 gap-6 text-xs">
              <button
                onClick={() => setModalTab('details')}
                className={`py-3 font-medium transition-colors relative cursor-pointer ${
                  modalTab === 'details'
                    ? 'text-white font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Özellikler & Kutu
              </button>
              <button
                onClick={() => setModalTab('history')}
                className={`py-3 font-medium transition-colors relative cursor-pointer ${
                  modalTab === 'history'
                    ? 'text-white font-semibold after:absolute after:bottom-0 after:inset-x-0 after:h-[2px] after:bg-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Zimmet Geçmişi ({allReservations.filter(r => r.equipment_id === selectedItemForModal.id && r.status !== 'rejected').length})
              </button>
            </div>

            {/* Modal Content */}
            {modalTab === 'details' ? (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-black/40 border border-white/[0.06]">
                  <img
                    src={selectedItemForModal.image_url}
                    alt={selectedItemForModal.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {selectedItemForModal.category === 'camera' && (
                  selectedItemForModal.id === 'e-5d2' ? (
                    <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                      <strong>Hafıza Kartı:</strong> Bu gövde CompactFlash (CF) kart ile çalışmaktadır. 32GB CF kart ve USB okuyucu çanta içerisinde hazır teslim edilir.
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#dce4ef]">
                      <strong>SD Kart Uyarısı:</strong> Bu gövdeye SD kart dahil değildir. Çekime gelirken kendi SD kartınızı yanınızda getirmelisiniz.
                    </div>
                  )
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] mb-1.5">Açıklama</h4>
                  <p className="text-xs text-[#dce4ef] leading-relaxed">{selectedItemForModal.description}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] mb-2">Kutu İçeriği & Aksesuarlar</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-[#12080f] border border-white/[0.06] text-xs">
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
              <div className="p-6 overflow-y-auto space-y-4">
                {allReservations.filter(r => r.equipment_id === selectedItemForModal.id && r.status !== 'rejected').length > 0 ? (
                  <div className="space-y-2.5">
                    {allReservations
                      .filter(r => r.equipment_id === selectedItemForModal.id && r.status !== 'rejected')
                      .sort((a, b) => new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime())
                      .map((res) => (
                        <div key={res.id} className="p-3.5 rounded-lg bg-[#140a12] border border-white/[0.06] space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-white font-medium">{res.reservation_code}</span>
                            <span className="text-[#8193b2] font-mono text-[11px]">{res.pickup_date} → {res.return_date}</span>
                          </div>
                          <div className="text-[#a9b9d3]">
                            Üye: <strong className="text-white">{res.member?.full_name || res.student_number}</strong>
                          </div>
                          <div className="text-[11px] text-[#dce4ef] pt-1 border-t border-white/[0.04]">
                            Amacı: {res.purpose}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#a9b9d3]">
                    Bu ekipman için henüz bir kullanım kaydı bulunmamaktadır.
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Action Bar */}
            <div className="p-4 border-t border-white/[0.08] bg-[#160a13] flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="px-4 py-2 rounded-lg text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
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
                className="px-6 py-2.5 rounded-lg bg-white text-[#12080f] hover:bg-[#dce4ef] text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
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
