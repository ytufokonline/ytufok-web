import React, { useState, useEffect } from 'react';
import { Camera, Search, Filter, ArrowRight, Package, Check, AlertCircle, Info, X, MapPin, History, Clock, User, AlertTriangle } from 'lucide-react';
import { Equipment, Reservation } from '../types';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

interface EquipmentPageProps {
  onSelectEquipmentToReserve: (equipmentId: string) => void;
  onNavigate: (tab: 'home' | 'equipment' | 'reserve' | 'status' | 'admin') => void;
}

export const EquipmentPage: React.FC<EquipmentPageProps> = ({ onSelectEquipmentToReserve, onNavigate }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedItemForModal, setSelectedItemForModal] = useState<Equipment | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [equipList, resList] = await Promise.all([
          api.getEquipment(),
          api.getReservations()
        ]);
        setEquipmentList(equipList);
        setAllReservations(resList);
      } catch (e) {
        console.error('Ekipman yükleme hatası:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      case 'analog': return 'Analog Makine (35mm)';
      case 'lens': return 'Objektif (Lens)';
      case 'lighting': return 'Flaş & Aydınlatma';
      case 'tripod': return 'Tripod & Destek';
      case 'accessory': return 'Filtre & Aksesuar';
      default: return category;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#301322] border border-[#657796]/40 text-[#dce4ef] text-xs font-semibold uppercase tracking-wider">
          <Camera className="w-3.5 h-3.5 text-[#8193b2]" />
          <span>Demirbaş Havuzu</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-club">
          Kamera ve Ekipman Kataloğu
        </h1>
        <p className="text-[#a9b9d3] text-xs sm:text-sm max-w-2xl leading-relaxed">
          Kulüp bünyesindeki Canon gövdeler, profesyonel lensler, analog makineler ve aksesuarların 
          anlık durumlarını inceleyebilir ve rezervasyon yapabilirsiniz.
        </p>
      </div>

      {/* Priority & Single Delivery Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#301322] border border-[#657796]/30 text-[#8193b2]">
            <MapPin className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div>
            <span className="font-bold text-white block">Tek Teslim & İade Noktası: Kulüpler Vadisi, Davutpaşa Kampüsü</span>
            <span className="text-[#a9b9d3] text-[11px]">Başka hiçbir noktada teslimat veya iade yapılmamaktadır. İadeler de burayadır.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#301322]/80 px-3 py-1.5 rounded-xl border border-[#657796]/30 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#657796] animate-pulse"></span>
          <span className="text-[#dce4ef] font-bold text-[11px]">Aktif Kulüp Üyeleri 1. Derece Önceliklidir</span>
        </div>
      </div>

      {/* SD Kart Bilgilendirme Bannerı */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4b253b]/40 via-[#301322] to-[#1c0f18] border border-[#657796]/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#301322] border border-[#657796]/40 text-[#8193b2]">
            <AlertTriangle className="w-4 h-4 text-[#8193b2]" />
          </div>
          <div>
            <span className="font-bold text-white block">Kamera Gövdelerine SD Kart Dahil Değildir</span>
            <span className="text-[#dce4ef] text-[11px] leading-relaxed">
              <strong>Canon 5D Mark II</strong> (dahili CF kartlı) haricindeki tüm dijital gövdelerde üyelerimizin <strong>kendi SD kartlarını getirmesi gerekmektedir</strong>. Kartı olmayan üyeler rezervasyon formundaki not alanında mutlaka belirtmelidir.
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#1c0f18] border border-[#657796]/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-[#8193b2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Model, marka veya demirbaş no ara (örn: Sony A7, Fujifilm, 35mm)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-white placeholder-[#a9b9d3]/60 text-xs focus:outline-none focus:border-[#657796] transition-colors"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Duruma göre filtrele"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12080f] border border-[#657796]/30 text-[#dce4ef] text-xs focus:outline-none focus:border-[#657796] cursor-pointer"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="available">Sadece Müsait Olanlar</option>
              <option value="reserved">Rezerve Olanlar</option>
              <option value="in_use">Zimmette Olanlar</option>
              <option value="maintenance">Bakımda Olanlar</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#657796]/20 text-xs">
          <span className="text-[#a9b9d3] mr-1 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3 text-[#8193b2]" /> Kategori:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-[#657796] to-[#4e3b52] text-white font-bold shadow-sm'
                  : 'bg-[#301322] text-[#dce4ef] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#a9b9d3]">
          <div className="w-8 h-8 border-2 border-[#657796] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Ekipmanlar yükleniyor...
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#1c0f18] border border-[#657796]/20 space-y-3">
          <AlertCircle className="w-8 h-8 text-[#8193b2] mx-auto" />
          <h3 className="text-sm font-bold text-white">Ekipman Bulunamadı</h3>
          <p className="text-xs text-[#a9b9d3]">Arama kriterlerine uygun sonuç çıkmadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#1c0f18] border border-[#657796]/20 overflow-hidden hover:border-[#657796]/60 transition-all flex flex-col group shadow-lg"
            >
              <div className="relative h-56 bg-black overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={item.status} type="equipment" />
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded bg-[#12080f]/90 backdrop-blur-md text-[11px] font-mono font-semibold text-[#dce4ef] border border-[#657796]/30">
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
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 text-[10px] text-blue-200">
                        <Info className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>CF Kart & Okuyucu Çantada Dahil</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#301322] border border-[#657796]/40 text-[10px] text-[#dce4ef]">
                        <AlertTriangle className="w-3 h-3 text-[#8193b2] shrink-0" />
                        <span>SD Kart Dahil Değil (Üye Getirmeli)</span>
                      </div>
                    )
                  )}

                  <p className="text-[#a9b9d3] text-xs mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="bg-[#12080f] rounded-xl p-3 border border-[#657796]/20 space-y-1 text-xs">
                  {Object.entries(item.specs).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-[#dce4ef]">
                      <span className="text-[#a9b9d3]">{key}:</span>
                      <span className="text-white font-medium truncate max-w-[170px]">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[#dce4ef] pt-1 border-t border-[#657796]/20">
                    <span className="text-[#a9b9d3]">Kondisyon:</span>
                    <span className="text-[#8193b2] font-medium truncate max-w-[170px]">{item.current_condition || 'değerlendirilecek'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedItemForModal(item)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#dce4ef] hover:text-white text-xs font-semibold transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 border border-[#657796]/20"
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
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      item.status === 'maintenance'
                        ? 'bg-[#301322] text-[#a9b9d3] cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white shadow-md'
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

      {/* Ekipman Detay Modalı */}
      {selectedItemForModal && (
        <div 
          onClick={() => setSelectedItemForModal(null)}
          className="fixed inset-0 z-50 bg-[#12080f]/92 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#1c0f18] border border-[#657796]/40 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-[#657796]/20 flex items-start justify-between bg-[#12080f]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase font-bold text-[#8193b2]">
                    {selectedItemForModal.brand} • {getCategoryLabel(selectedItemForModal.category)}
                  </span>
                  <StatusBadge status={selectedItemForModal.status} type="equipment" size="sm" />
                </div>
                <h2 className="text-lg font-bold text-white font-club">
                  {selectedItemForModal.name}
                </h2>
                <span className="text-xs font-mono text-[#a9b9d3]">
                  Demirbaş Kodu: {selectedItemForModal.serial_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="p-2 rounded-xl bg-[#301322] text-[#a9b9d3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Özellikler vs Kullanım Geçmişi */}
            <div className="flex border-b border-[#657796]/20 bg-[#12080f] px-6">
              <button
                onClick={() => setModalTab('details')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
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
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  modalTab === 'history'
                    ? 'border-[#8193b2] text-white'
                    : 'border-transparent text-[#a9b9d3] hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Kullanım & Zimmet Geçmişi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#301322] text-[#8193b2] border border-[#657796]/30">
                  {allReservations.filter(r => r.equipment_id === selectedItemForModal.id).length}
                </span>
              </button>
            </div>

            {modalTab === 'details' ? (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="h-56 rounded-2xl overflow-hidden bg-black border border-[#657796]/20">
                  <img
                    src={selectedItemForModal.image_url}
                    alt={selectedItemForModal.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {selectedItemForModal.category === 'camera' && (
                  selectedItemForModal.id === 'e-5d2' ? (
                    <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                        <Info className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Hafıza Kartı: CompactFlash (CF) Kart Dahil</span>
                      </div>
                      <p className="text-[11px] text-[#dce4ef] leading-relaxed">
                        Canon EOS 5D Mark II gövdesi CompactFlash (CF) kart ile çalışmaktadır. 32GB CF kart ve USB okuyucu, çanta içerisinde kulüp tarafından hazır olarak teslim edilmektedir (SD kart girişi bulunmaz).
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4b253b]/40 via-[#301322] to-[#1c0f18] border border-[#657796]/40 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#dce4ef]">
                        <AlertTriangle className="w-4 h-4 text-[#8193b2] shrink-0" />
                        <span>⚠️ Önemli Hatırlatma: Bu Gövdeye SD Kart Dahil Değildir!</span>
                      </div>
                      <p className="text-[11px] text-[#dce4ef] leading-relaxed">
                        Kulübümüz bünyesinde SD kart temini bulunmamaktadır. Çekime gelirken <strong className="text-white">kendi SD kartınızı yanınızda getirmeniz gerekmektedir</strong>. Eğer SD kartınız yoksa rezervasyon formu doldururken <em className="text-white">not alanında mutlaka belirtiniz</em>.
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
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-[#12080f] border border-[#657796]/20 text-xs">
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
                {/* Usage Stats Summary */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#12080f] border border-[#657796]/30 text-center text-xs">
                  <div>
                    <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Toplam Zimmet</span>
                    <strong className="text-white text-base font-club">
                      {allReservations.filter(r => r.equipment_id === selectedItemForModal.id).length} Kez
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Tamamlanan İade</span>
                    <strong className="text-[#a9b9d3] text-base font-club">
                      {allReservations.filter(r => r.equipment_id === selectedItemForModal.id && r.status === 'returned').length} Kez
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#8193b2] text-[10px] uppercase font-bold block">Kondisyon</span>
                    <strong className="text-white text-xs font-semibold block truncate">
                      {selectedItemForModal.current_condition || 'değerlendirilecek'}
                    </strong>
                  </div>
                </div>

                {/* Timeline */}
                {allReservations.filter(r => r.equipment_id === selectedItemForModal.id).length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8193b2] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Zimmet Kronolojisi & Çekim Projeleri</span>
                    </h4>

                    {allReservations
                      .filter(r => r.equipment_id === selectedItemForModal.id)
                      .sort((a, b) => new Date(b.pickup_date).getTime() - new Date(a.pickup_date).getTime())
                      .map((res) => (
                        <div
                          key={res.id}
                          className="p-4 rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-2 hover:border-[#657796]/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#dce4ef] text-xs">
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
                              {res.member?.full_name || res.student_number} ({res.student_number})
                            </strong>
                          </div>

                          <div className="text-xs text-[#dce4ef] bg-[#1c0f18] p-2.5 rounded-xl border border-[#657796]/20 space-y-1">
                            <span className="text-[10px] text-[#8193b2] block font-bold uppercase tracking-wider">
                              Çekim Projesi / Kullanım Amacı:
                            </span>
                            <span>{res.purpose}</span>
                          </div>

                          {res.return_condition_notes && (
                            <div className="text-[11px] text-[#8193b2] flex items-start gap-1.5 pt-1">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>İade & Teslim Notu: <strong className="text-[#dce4ef]">{res.return_condition_notes}</strong></span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-[#12080f] border border-[#657796]/20 space-y-2">
                    <History className="w-8 h-8 text-[#8193b2] mx-auto opacity-60" />
                    <h4 className="text-xs font-bold text-white">Henüz Kullanım Kaydı Bulunmuyor</h4>
                    <p className="text-[11px] text-[#a9b9d3]">Bu ekipman için tamamlanmış bir zimmet kaydı bulunmuyor. İlk rezervasyon yapan siz olabilirsiniz!</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-5 border-t border-[#657796]/20 bg-[#12080f] flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="px-4 py-2 rounded-xl bg-[#301322] hover:bg-[#421d31] text-[#dce4ef] text-xs font-semibold"
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#657796] to-[#4e3b52] hover:from-[#7589aa] hover:to-[#5e4766] text-white text-xs font-bold flex items-center gap-2 shadow-md"
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
