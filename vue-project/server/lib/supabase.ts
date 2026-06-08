import { createClient } from '@supabase/supabase-js'

const url = 'https://ijluptjauhyhdswzrojk.supabase.co'
const serviceRoleKey = 'sb_publishable_jUE6reEqjZTAGTbw3cuj-Q_7fH9TnNY'

if (!url || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です。.env を確認してください。',
  )
}

// サーバー専用クライアント（RLS をバイパスする service_role を使用）
// クライアントへ漏らさないこと。
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
