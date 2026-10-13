import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve stored or environment Supabase URL
export const getStoredSupabaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('ytufok_supabase_url');
    if (stored && stored.trim()) return stored.trim();
  }
  return import.meta.env.VITE_SUPABASE_URL || '';
};

// Retrieve stored or environment Supabase Anon Key
export const getStoredSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('ytufok_supabase_anon_key');
    if (stored && stored.trim()) return stored.trim();
  }
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

export const isSupabaseConfigured = (): boolean => {
  const url = getStoredSupabaseUrl();
  const key = getStoredSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('your-project-id') &&
    !key.includes('placeholder')
  );
};

let currentClient: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export const getSupabaseClient = (): SupabaseClient => {
  const configured = isSupabaseConfigured();
  const effectiveUrl = configured ? getStoredSupabaseUrl() : 'https://placeholder.supabase.co';
  const effectiveKey = configured ? getStoredSupabaseAnonKey() : 'placeholder-anon-key';

  if (!currentClient || currentClientUrl !== effectiveUrl || currentClientKey !== effectiveKey) {
    currentClientUrl = effectiveUrl;
    currentClientKey = effectiveKey;
    currentClient = createClient(effectiveUrl, effectiveKey);
  }
  return currentClient;
};

// Dynamic Supabase proxy ensures any client reconfiguration immediately takes effect
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export const setSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url && url.trim()) {
      window.localStorage.setItem('ytufok_supabase_url', url.trim());
    } else {
      window.localStorage.removeItem('ytufok_supabase_url');
    }
    if (key && key.trim()) {
      window.localStorage.setItem('ytufok_supabase_anon_key', key.trim());
    } else {
      window.localStorage.removeItem('ytufok_supabase_anon_key');
    }
  }
  currentClient = null;
};

export const getSupabaseConfigStatus = () => {
  const url = getStoredSupabaseUrl();
  const key = getStoredSupabaseAnonKey();
  return {
    isConfigured: isSupabaseConfigured(),
    url: url || 'Henüz ayarlanmadı',
    hasKey: Boolean(key && !key.includes('placeholder'))
  };
};

export const testSupabaseConnection = async (): Promise<{
  ok: boolean;
  message: string;
  equipmentCount?: number;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: 'Supabase URL veya Anon Key henüz yapılandırılmamış.'
    };
  }

  try {
    const client = getSupabaseClient();
    const { count, error } = await client
      .from('equipment')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        ok: false,
        message: `Supabase bağlantı hatası: ${error.message} (${error.code || 'Bilinmeyen Kod'})`
      };
    }

    return {
      ok: true,
      message: `Bağlantı başarılı! Veritabanındaki 'equipment' tablosunda ${count ?? 0} adet demirbaş kayıtlı.`,
      equipmentCount: count ?? 0
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Bağlantı testi sırasında hata: ${err?.message || String(err)}`
    };
  }
};
