import React from 'react';
import { EquipmentStatus, ReservationStatus } from '../types';
import { Check, Clock, X, Wrench, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: EquipmentStatus | ReservationStatus;
  type?: 'equipment' | 'reservation';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'equipment', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  if (type === 'equipment') {
    switch (status as EquipmentStatus) {
      case 'available':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#568aa5]/15 text-[#f1f5f9] border border-[#568aa5]/30 font-medium tracking-tight ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6ea5c4]"></span>
            Müsait
          </span>
        );
      case 'reserved':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 text-amber-200/90 border border-amber-500/20 font-medium ${sizeClasses}`}>
            <Clock className="w-3 h-3 text-amber-300/80" />
            Rezerve
          </span>
        );
      case 'in_use':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] text-[#f1f5f9] border border-white/[0.1] font-medium ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8193b2]"></span>
            Zimmette
          </span>
        );
      case 'maintenance':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-white/[0.03] text-[#a9b9d3]/50 border border-white/[0.06] line-through ${sizeClasses}`}>
            <Wrench className="w-3 h-3 text-[#a9b9d3]/50" />
            Bakımda
          </span>
        );
    }
  }

  // Reservation Statuses
  switch (status as ReservationStatus) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 text-amber-200 border border-amber-500/20 font-medium ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-300" />
          Onay Bekliyor
        </span>
      );
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 font-medium ${sizeClasses}`}>
          <Check className="w-3 h-3 text-emerald-300" />
          Onaylandı
        </span>
      );
    case 'in_use':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-[#568aa5]/15 text-[#f1f5f9] border border-[#568aa5]/30 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#6ea5c4]"></span>
          Teslim Edildi
        </span>
      );
    case 'returned':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] text-[#f1f5f9] border border-white/[0.08] font-medium ${sizeClasses}`}>
          <Check className="w-3 h-3 text-[#6ea5c4]" />
          İade Alındı
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium ${sizeClasses}`}>
          <X className="w-3 h-3 text-rose-400" />
          Reddedildi
        </span>
      );
    case 'overdue':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-500/20 text-rose-200 border border-rose-500/30 font-semibold ${sizeClasses}`}>
          <ShieldAlert className="w-3 h-3 text-rose-300" />
          Gecikmede
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-white/[0.03] text-[#a9b9d3]/50 border border-white/[0.06] ${sizeClasses}`}>
          İptal
        </span>
      );
    default:
      return <span className={`rounded-md bg-white/[0.04] text-zinc-300 border border-white/[0.06] ${sizeClasses}`}>{status}</span>;
  }
};
