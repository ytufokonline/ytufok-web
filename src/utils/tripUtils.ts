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
 * Aktif Kulüp Üyeleri Beyaz Listesi (127 Üye)
 * Bu listedeki üyeler 5 gün erken rezervasyon ve bireysel çekim haklarına sahiptir.
 */
export const ACTIVE_STUDENT_NUMBERS_LIST = [
  '25093029', '25035705', '26046070', '2408a032', '2605c004', '26046027', '23028704', '24089053',
  '25033602', '23065601', '2,50e+10', '25014017', '24036029', '2508a018', '2505a007', '24089052',
  '24033616', '26084012', '26034015', '25049039', '24033079', '24024016', '24015050', '26054020',
  '24084042', '26041804', '25084016', '26084010', '2308a051', '24033033', '23011079', '25051010',
  '2608b007', '26840019', '26056033', '23065036', '26015028', '25028058', '26037022', 'teknopark',
  '26027015', '24037055', '26018021', '26084016', '25061007', '2605b015', '26084007', '26051002',
  '25056033', '25033052', '2505a020', '25023019', '26037030', '26141401011', '25084011', '26012073',
  '25046613', '25084028', '25037013', '24084017', '2608a010', '26065013', '26028019', '25094610',
  '24012059', '25049013', '12042119', '26084015', '26099006', '2608b604', '2502e045', '26096016',
  '26073021', '2605a001', '23084602', '25056017', '23052001', '26065078', '25058063', '25033057',
  '25035060', '2605a071', '25098010', '26084603', '26094025', '26084605', '23094029', '24091034',
  '25025011', '26061607', '26037611', '26036040', '25012020', 'g2410.0151017', '25035057', '2602e019',
  '2602d029', '23017019', '26084006', '2408a015', '25037036', '260b037', '26028048', '2608b026',
  '24041501', '25033009', '25049036', '25022501', '2508a035', '25022024', '22058602', '25015610',
  '26011065', 'kunt', '25065127', '26028043', '2608b019', '19065214', '26024608', '26073014',
  '250a3610', '26034612', '26058027', '26056007', '26072030', '26011026', '2609a801'
];

export const ACTIVE_STUDENT_NUMBERS_SET = new Set(
  ACTIVE_STUDENT_NUMBERS_LIST.map((n) => n.toLowerCase().trim().replace(/\s+/g, ''))
);

export function isStudentInActiveWhitelist(studentNumber?: string | null): boolean {
  if (!studentNumber) return false;
  const clean = String(studentNumber).toLowerCase().trim().replace(/\s+/g, '');
  return ACTIVE_STUDENT_NUMBERS_SET.has(clean);
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
  if (isStudentInActiveWhitelist(member.student_number)) return 'active';
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
