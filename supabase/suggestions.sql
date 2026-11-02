-- ==============================================================================
-- YTÜFOK ETKİNLİK ÖNERİLERİ TABLOSU VE RLS GÜVENLİK POLİTİKALARI
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.event_suggestions (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'gezi',
    location VARCHAR(255),
    suggested_by VARCHAR(150) DEFAULT 'Anonim Üye',
    contact_info VARCHAR(150),
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Etkinleştir
ALTER TABLE public.event_suggestions ENABLE ROW LEVEL SECURITY;

-- 1. Ziyaretçiler ve üyeler anonim olarak etkinlik önerebilir (INSERT)
DROP POLICY IF EXISTS "Public insert event suggestions" ON public.event_suggestions;
CREATE POLICY "Public insert event suggestions" ON public.event_suggestions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 2. Önerileri listeleme (SELECT)
DROP POLICY IF EXISTS "Public read event suggestions" ON public.event_suggestions;
CREATE POLICY "Public read event suggestions" ON public.event_suggestions
    FOR SELECT TO anon, authenticated
    USING (true);

-- 3. Yönetici güncelleme ve silme (UPDATE & DELETE)
DROP POLICY IF EXISTS "Public update event suggestions" ON public.event_suggestions;
CREATE POLICY "Public update event suggestions" ON public.event_suggestions
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete event suggestions" ON public.event_suggestions;
CREATE POLICY "Public delete event suggestions" ON public.event_suggestions
    FOR DELETE TO anon, authenticated
    USING (true);
