import React from 'react';
import { Camera, MapPin, Mail, Instagram, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#12080f] border-t border-[#657796]/20 text-[#a9b9d3] text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Kulüp Hakkında */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="YTÜFOK" className="h-10 w-auto object-contain" />
              <span className="text-base font-bold text-white font-club tracking-tight">
                YTÜFOK <span className="text-[#8193b2]">Ekipman Havuzu</span>
              </span>
            </div>
            <p className="text-[#a9b9d3] text-xs leading-relaxed max-w-md">
              Yıldız Teknik Üniversitesi Fotoğraf Kulübü; fotoğraf sanatını sevdirmek ve profesyonel 
              ekipman havuzunu adil, şeffaf bir whitelist sistemiyle üyelerinin kullanımına sunmaktadır.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com/ytufokonline"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#301322] hover:bg-[#421d31] text-[#dce4ef] hover:text-white transition-colors border border-[#657796]/30"
              >
                <Instagram className="w-3.5 h-3.5 text-[#8193b2]" />
                <span>@ytufokonline</span>
              </a>
              <a
                href="mailto:ytufokonline@gmail.com"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#301322] hover:bg-[#421d31] text-[#dce4ef] hover:text-white transition-colors border border-[#657796]/30"
              >
                <Mail className="w-3.5 h-3.5 text-[#8193b2]" />
                <span>ytufokonline@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Teslim & İade Noktası */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#dce4ef]">Teslim & İade Noktası</h4>
            <ul className="space-y-2.5 text-xs text-[#a9b9d3]">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#8193b2] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-club">Kulüpler Vadisi, Davutpaşa Kampüsü</strong>
                  <span>Tek yetkili teslim ve iade noktasıdır. Başka hiçbir yerleşkede teslimat veya iade yapılmamaktadır.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Temel Kurallar */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#dce4ef]">Zimmet & Teslimat Kuralları</h4>
            <ul className="space-y-2 text-xs text-[#a9b9d3]">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                <span>Tek Teslimat: Yalnızca Kulüpler Vadisi.</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                <span>Maksimum rezervasyon: 4 gündür.</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8193b2] shrink-0" />
                <span>Teslim ve iadede öğrenci kimliği zorunludur.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#657796]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#a9b9d3]">
          <div>
            &copy; {new Date().getFullYear()} Yıldız Teknik Üniversitesi Fotoğraf Kulübü (YTÜFOK).
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8193b2]">
            <span>Geliştiren:</span>
            <span className="text-[#dce4ef] font-medium tracking-wide">Yavuz Selim Bahadır</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
