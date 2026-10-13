import React from 'react';
import { EquipmentStatus, ReservationStatus } from '../types';
import { CheckCircle2, Clock, XCircle, Wrench, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: EquipmentStatus | ReservationStatus;
  type?: 'equipment' | 'reservation';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'equipment', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (type === 'equipment') {
    switch (status as EquipmentStatus) {
      case 'available':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#657796]/15 text-[#dce4ef] border border-[#657796]/35 font-medium tracking-wide shadow-sm backdrop-blur-md ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8193b2] shadow-[0_0_6px_rgba(129,147,178,0.8)]"></span>
            Müsait
          </span>
        );
      case 'reserved':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 text-amber-200/90 border border-amber-500/25 font-medium backdrop-blur-md ${sizeClasses}`}>
            <Clock className="w-3 h-3 text-amber-300/80" />
            Rezerve
          </span>
        );
      case 'in_use':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#4e3b52]/40 text-[#dce4ef] border border-[#8193b2]/25 font-medium backdrop-blur-md ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8193b2]"></span>
            Zimmette
          </span>
        );
      case 'maintenance':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] text-[#a9b9d3]/60 border border-white/[0.07] line-through backdrop-blur-md ${sizeClasses}`}>
            <Wrench className="w-3 h-3 text-[#a9b9d3]/60" />
            Bakımda
          </span>
        );
    }
  }

  // Reservation Statuses
  switch (status as ReservationStatus) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 text-amber-200/90 border border-amber-500/25 font-medium backdrop-blur-md ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-300/80 animate-spin" style={{ animationDuration: '4s' }} />
          Onay Bekliyor
        </span>
      );
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/25 font-medium backdrop-blur-md ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
          Onaylandı
        </span>
      );
    case 'in_use':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#4e3b52]/40 text-white border border-[#8193b2]/30 font-medium backdrop-blur-md ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#8193b2]"></span>
          Teslim Edildi
        </span>
      );
    case 'returned':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] text-[#dce4ef] border border-white/[0.08] font-medium backdrop-blur-md ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-[#8193b2]" />
          İade Alındı
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/12 text-rose-300 border border-rose-500/25 font-medium backdrop-blur-md ${sizeClasses}`}>
          <XCircle className="w-3 h-3 text-rose-400" />
          Reddedildi
        </span>
      );
    case 'overdue':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold backdrop-blur-md ${sizeClasses}`}>
          <ShieldAlert className="w-3 h-3 text-rose-300" />
          Gecikmede
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] text-[#a9b9d3]/60 border border-white/[0.06] backdrop-blur-md ${sizeClasses}`}>
          İptal
        </span>
      );
    default:
      return <span className={`rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08] ${sizeClasses}`}>{status}</span>;
  }
};
