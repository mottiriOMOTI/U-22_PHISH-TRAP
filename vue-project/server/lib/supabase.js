import { createClient } from '@supabase/supabase-js';
const url = 'https://ijluptjauhyhdswzrojk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbHVwdGphdWh5aGRzd3pyb2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQwNDMwMCwiZXhwIjoyMDk0OTgwMzAwfQ.zdMb093bsFbY1rifYV2ePqagoHbFkb5UycmatAnE3lE';
if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。.env を確認してください。');
}
// サーバー専用クライアント（RLS をバイパスする service_role を使用）
// クライアントへ漏らさないこと。
export const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});
