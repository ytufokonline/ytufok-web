import { Member, MemberType } from '../types';

/**
 * Returns YYYY-MM-DD formatted local date string
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a safe Date object at local midnight (00:00:00)
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/**
 * Calculates the difference in full days between target date and fromDate (target - fromDate).
 * E.g. target="2026-10-17", from="2026-10-12" -> 5 days
 */
export function getDaysDifference(targetDateStr: string, fromDateStr: string = getLocalDateString()): number {
  const target = parseDate(targetDateStr);
  const from = parseDate(fromDateStr);
  const diffTime = target.getTime() - from.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns the exact date string when reservation opens (tripStartDate - daysBefore).
 * E.g. tripStartDate="2026-10-17", daysBefore=5 -> "2026-10-12"
 */
export function getReservationOpenDate(tripStartDateStr: string, daysBefore: number): string {
  const d = parseDate(tripStartDateStr);
  d.setDate(d.getDate() - daysBefore);
  return getLocalDateString(d);
}

/**
 * Determines whether a member is considered 'active' or 'normal'
 */
export function resolveMemberTier(member?: Member | null): MemberType {
  if (!member) return 'normal';
  if (member.role === 'admin' || member.role === 'board' || member.member_type === 'board') return 'board';
  if (member.role === 'audit' || member.member_type === 'audit') return 'audit';
  if (member.member_type === 'honorary_active') return 'honorary_active';
  if (member.member_type === 'honorary') return 'honorary';
  if (member.member_type === 'active') return 'active';
  if (member.member_type === 'normal') return 'normal';
  return 'normal'; // Varsayılan kulüp üyeliği normal üyeliktir
}

export interface TripBookingEligibility {
  tripStartDate: string;
  memberType: MemberType;
  daysBeforeAllowed: number; // 5 for active & honorary_active, 3 for normal & honorary
  daysBeforeTrip: number;    // difference between trip date and today
  openDate: string;          // YYYY-MM-DD when booking opens
  isOpen: boolean;           // Whether reservation has opened today
  daysUntilOpen: number;     // Days left until reservation opens (0 if open)
  hasPassed: boolean;        // Whether the trip has already passed
}

/**
 * Evaluates the 5-day / 3-day reservation rule for a given trip start date and member tier:
 * - board & audit: her zaman açık (kısıtlama yok)
 * - normal & honorary: 3 gün önce (aynı öncelik)
 * - active & honorary_active: 5 gün önce (aynı öncelik)
 */
export function checkTripBookingEligibility(
  tripStartDateStr: string,
  memberType: MemberType = 'active',
  todayStr: string = getLocalDateString()
): TripBookingEligibility {
  const daysBeforeTrip = getDaysDifference(tripStartDateStr, todayStr);
  const hasPassed = daysBeforeTrip < 0;

  if (memberType === 'board' || memberType === 'audit') {
    return {
      tripStartDate: tripStartDateStr,
      memberType,
      daysBeforeAllowed: 365,
      daysBeforeTrip,
      openDate: todayStr,
      isOpen: true,
      daysUntilOpen: 0,
      hasPassed
    };
  }

  const daysBeforeAllowed = memberType === 'active' || memberType === 'honorary_active' ? 5 : 3;
  const openDate = getReservationOpenDate(tripStartDateStr, daysBeforeAllowed);
  const isOpen = todayStr >= openDate;
  const daysUntilOpen = isOpen ? 0 : Math.max(0, daysBeforeTrip - daysBeforeAllowed);

  return {
    tripStartDate: tripStartDateStr,
    memberType,
    daysBeforeAllowed,
    daysBeforeTrip,
    openDate,
    isOpen,
    daysUntilOpen,
    hasPassed
  };
}

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/**
 * Formats YYYY-MM-DD to readable Turkish date string (örn: "16 Ekim 2026")
 */
export function formatDateTr(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const monthName = MONTH_NAMES_TR[m - 1] || '';
  return `${d} ${monthName} ${y}`;
}

/**
 * Formats a date range to readable Turkish string (örn: "16 - 19 Ekim 2026")
 */
export function formatDateRangeTr(startDateStr: string, endDateStr: string): string {
  if (!startDateStr) return '';
  if (!endDateStr || startDateStr === endDateStr) return formatDateTr(startDateStr);

  const [y1, m1, d1] = startDateStr.split('-').map(Number);
  const [y2, m2, d2] = endDateStr.split('-').map(Number);

  if (y1 === y2 && m1 === m2) {
    const monthName = MONTH_NAMES_TR[m1 - 1] || '';
    return `${d1} - ${d2} ${monthName} ${y1}`;
  }

  return `${formatDateTr(startDateStr)} - ${formatDateTr(endDateStr)}`;
}

const WEEKDAY_NAMES_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * Returns Turkish day name for a given YYYY-MM-DD date string (örn: "Pazartesi")
 */
export function getWeekdayTr(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
  return WEEKDAY_NAMES_TR[date.getDay()] || '';
}

/**
 * Returns the first business day (Monday - Friday) strictly after the given date string.
 * - If date is Friday, Saturday, or Sunday -> returns the following Monday.
 * - If date is Monday - Thursday -> returns the very next day (Tuesday - Friday).
 */
export function getNextBusinessDay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);

  // Gezinin bittiği tarihten bir sonraki güne geç
  date.setDate(date.getDate() + 1);

  // Hafta sonuna denk gelirse Pazartesi'ye ilerlet (0: Pazar, 6: Cumartesi)
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return getLocalDateString(date);
}

/**
 * Returns the first business day (Monday - Friday) strictly before the given date string.
 * - If date is Saturday, Sunday, or Monday -> returns the previous Friday.
 * - If date is Tuesday - Friday -> returns the very previous day (Monday - Thursday).
 */
export function getPreviousBusinessDay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);

  // Gezinin başladığı tarihten bir önceki güne geç
  date.setDate(date.getDate() - 1);

  // Hafta sonuna denk gelirse Cuma gününe gerilet (0: Pazar, 6: Cumartesi)
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  return getLocalDateString(date);
}
