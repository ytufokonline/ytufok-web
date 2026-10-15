export type TabType = 'home' | 'equipment' | 'guide' | 'tips' | 'reserve' | 'darkroom' | 'status' | 'admin';

export const TAB_PATHS: Record<TabType, string> = {
  home: '/',
  equipment: '/ekipmanlar',
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
 * Parses current window location (pathname, query params, and hash fallback)
 */
export function parseCurrentLocation(): RouteState {
  let rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // Support hash fallback (e.g., #karanlik-oda, #/karanlik-oda)
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '/').replace(/\/+$/, '');
  if (hash && PATH_TO_TAB[hash]) {
    rawPath = hash;
  }

  const tab = PATH_TO_TAB[rawPath] || 'home';

  const params = new URLSearchParams(window.location.search);
  const equipmentId = params.get('ekipman') || params.get('id') || undefined;
  const searchCode = params.get('kod') || params.get('code') || undefined;

  return { tab, equipmentId, searchCode };
}

/**
 * Builds the canonical URL for a given tab and options
 */
export function getUrlForTab(tab: TabType, equipmentId?: string, searchCode?: string): string {
  const path = TAB_PATHS[tab] || '/';
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
