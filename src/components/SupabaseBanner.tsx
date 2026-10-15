import React from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database, CheckCircle, Info } from 'lucide-react';

interface SupabaseBannerProps {
  onOpenGuide?: () => void;
}

export const SupabaseBanner: React.FC<SupabaseBannerProps> = ({ onOpenGuide }) => {
  const isConfigured = isSupabaseConfigured();

  return (
    <div className="w-full bg-[#170610] border-b border-[#568aa5]/20 px-4 py-1.5 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#6ea5c4]" />
          <span className="text-[#a9b9d3]">Veritabanı:</span>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 text-[#eed1d1] font-medium">
              <CheckCircle className="w-3 h-3 text-[#6ea5c4]" /> Supabase Bulut Veritabanı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#eed1d1] font-medium">
              <Info className="w-3 h-3 text-[#6ea5c4]" /> Supabase Uyumlu (Yerel Mod)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[#a9b9d3] text-[11px]">
            Öğrenci Whitelist Koruması Aktif
          </span>
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="text-[#8193b2] hover:text-white underline font-medium cursor-pointer transition-colors text-xs"
            >
              SQL Şeması & Kurulum
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
