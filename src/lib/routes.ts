export type TabType = 'home' | 'equipment' | 'events' | 'guide' | 'tips' | 'reserve' | 'darkroom' | 'status' | 'admin';

export const TAB_PATHS: Record<TabType, string> = {
  home: '/',
  equipment: '/ekipmanlar',
  events: '/etkinlikler',
  guide: '/rehber',
  tips: '/faydali-bilgiler',
  reserve: '/rezervasyon',
  darkroom: '/karanlik-oda',
  status: '/talep-sorgula',
  admin: '/admin',
};

export const TAB_TITLES: Record<TabType, string> = {
  home: 'YTÜFOK | Fotoğraf Kulübü Rezervasyon & Ekipman Sistemi',
  equipment: 'Kamera & Lens Havuzu | YTÜFOK',
  events: 'Etkinlikler & Geziler | YTÜFOK',
  guide: 'Çekim & Ekipman Rehberi | YTÜFOK',
  tips: 'Faydalı Bilgiler & Film Rehberi | YTÜFOK',
  reserve: 'Ekipman Rezervasyonu Yap | YTÜFOK',
  darkroom: 'Karanlık Oda Rezervasyonu | YTÜFOK',
  status: 'Talep & Rezervasyon Sorgulama | YTÜFOK',
  admin: 'Yönetim Paneli | YTÜFOK',
};

export const PATH_TO_TAB: Record<string, TabType> = {
  '/': 'home',
  '/home': 'home',
  '/ana-sayfa': 'home',
  '/anasayfa': 'home',
  '/ekipmanlar': 'equipment',
  '/ekipman': 'equipment',
  '/ekipman-havuzu': 'equipment',
  '/equipment': 'equipment',
  '/etkinlikler': 'events',
  '/etkinlik': 'events',
  '/events': 'events',
  '/yaptigimiz-etkinlikler': 'events',
  '/gelecek-etkinlikler': 'events',
  '/rehber': 'guide',
  '/cekim-rehberi': 'guide',
  '/ekipman-rehberi': 'guide',
  '/guide': 'guide',
  '/faydali-bilgiler': 'tips',
  '/faydalibilgiler': 'tips',
  '/faydali-bilgi': 'tips',
  '/bilgiler': 'tips',
  '/film-rehberi': 'tips',
  '/film-nedir': 'tips',
  '/tips': 'tips',
  '/rezervasyon': 'reserve',
  '/rezervasyon-yap': 'reserve',
  '/reserve': 'reserve',
  '/karanlik-oda': 'darkroom',
  '/karanlikoda': 'darkroom',
  '/darkroom': 'darkroom',
  '/talep-sorgula': 'status',
  '/sorgula': 'status',
  '/durum': 'status',
  '/status': 'status',
  '/takip': 'status',
  '/admin': 'admin',
  '/yonetim': 'admin',
  '/yonetici': 'admin',
};

export interface RouteState {
  tab: TabType;
  equipmentId?: string;
  searchCode?: string;
}

/**
 * Detects whether the current site is accessed via an admin host/subdomain
 * (e.g. admin.ytufok.com or admin.localhost) or an explicit developer/admin query override.
 */
export function isAdminHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  if (host === 'admin.ytufok.com' || host.startsWith('admin.')) {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('portal') === 'admin' || params.get('admin_portal') === 'true' || params.get('admin') === 'portal') {
    return true;
  }
  return false;
}

/**
 * Parses current window location (pathname, query params, and hash fallback)
 */
export function parseCurrentLocation(): RouteState {
  let rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // Support hash fallback (e.g., #karanlik-oda, #/karanlik-oda)
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '/').replace(/\/+$/, '');
  if (hash && PATH_TO_TAB[hash]) {
    rawPath = hash;
  }

  const onAdminHost = isAdminHost();
  let tab: TabType;

  if (onAdminHost) {
    // When visiting admin.ytufok.com root, open admin portal directly
    if (rawPath === '/' || rawPath === '') {
      tab = 'admin';
    } else {
      tab = PATH_TO_TAB[rawPath] || 'admin';
    }
  } else {
    tab = PATH_TO_TAB[rawPath] || 'home';
    // When on public domain (ytufok.com / www.ytufok.com), hide /admin routes from visitors
    // unless an active authenticated admin session already exists
    if (tab === 'admin') {
      const hasActiveSession = typeof window !== 'undefined' && Boolean(
        window.sessionStorage.getItem('ytufok_admin_token') ||
        window.localStorage.getItem('ytufok_active_admin')
      );
      if (!hasActiveSession) {
        tab = 'home';
      }
    }
  }

  const params = new URLSearchParams(window.location.search);
  const equipmentId = params.get('ekipman') || params.get('id') || undefined;
  const searchCode = params.get('kod') || params.get('code') || undefined;

  return { tab, equipmentId, searchCode };
}

/**
 * Builds the canonical URL for a given tab and options
 */
export function getUrlForTab(tab: TabType, equipmentId?: string, searchCode?: string): string {
  let path = TAB_PATHS[tab] || '/';
  if (tab === 'admin' && isAdminHost()) {
    path = '/';
  }
  const params = new URLSearchParams();

  if (tab === 'reserve' && equipmentId) {
    params.set('ekipman', equipmentId);
  }
  if (tab === 'status' && searchCode) {
    params.set('kod', searchCode);
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
