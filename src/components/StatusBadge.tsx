import React from 'react';
import { EquipmentStatus, ReservationStatus } from '../types';
import { CheckCircle2, Clock, XCircle, Wrench, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: EquipmentStatus | ReservationStatus;
  type?: 'equipment' | 'reservation';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'equipment', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-semibold';

  if (type === 'equipment') {
    switch (status as EquipmentStatus) {
      case 'available':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#657796] text-white font-bold tracking-wide shadow-sm shadow-[#657796]/30 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Müsait
          </span>
        );
      case 'reserved':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#301322] text-[#dce4ef] border border-[#657796]/40 ${sizeClasses}`}>
            <Clock className="w-3 h-3 text-[#8193b2]" />
            Rezerve
          </span>
        );
      case 'in_use':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#4e3b52] text-white border border-[#8193b2]/30 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8193b2]"></span>
            Zimmette
          </span>
        );
      case 'maintenance':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#1c0f18] text-[#a9b9d3] border border-[#301322] line-through ${sizeClasses}`}>
            <Wrench className="w-3 h-3 text-[#a9b9d3]" />
            Bakımda
          </span>
        );
    }
  }

  // Reservation Statuses
  switch (status as ReservationStatus) {
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#301322] text-[#dce4ef] border border-[#657796]/40 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-[#8193b2] animate-spin" style={{ animationDuration: '3s' }} />
          Onay Bekliyor
        </span>
      );
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#657796] to-[#4e3b52] text-white font-bold shadow-sm ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3" />
          Onaylandı
        </span>
      );
    case 'in_use':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#4e3b52] text-white border border-[#8193b2]/40 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          Teslim Edildi
        </span>
      );
    case 'returned':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#251621] text-[#a9b9d3] border border-[#657796]/20 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-[#8193b2]" />
          İade Alındı
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#301322] text-rose-300 border border-rose-500/30 ${sizeClasses}`}>
          <XCircle className="w-3 h-3" />
          Reddedildi
        </span>
      );
    case 'overdue':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-900/60 text-white font-extrabold border border-rose-400 animate-pulse ${sizeClasses}`}>
          <ShieldAlert className="w-3 h-3 text-white" />
          Gecikmede
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#1c0f18] text-[#a9b9d3] border border-zinc-800 ${sizeClasses}`}>
          İptal
        </span>
      );
    default:
      return <span className={`rounded-full bg-[#251621] text-zinc-300 ${sizeClasses}`}>{status}</span>;
  }
};
