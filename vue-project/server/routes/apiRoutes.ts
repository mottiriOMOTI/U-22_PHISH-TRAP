import { Router } from "express";

import { jsonget } from "../services/jsonget";
import { supabaseAdmin } from "../lib/supabase";

const router = Router()

// '/api/jsonget'のurlを処理する
router.get('/jsonget', async (req, res) => {
    try {
        const data = await jsonget();
        res.json(data);
    } catch (e) {
        console.log("jsonget Routes error:" + e)
    }
})

// Supabase 接続確認用: profiles を全件取得
router.get('/supabase/ping', async (_req, res) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, created_at')
        .limit(10)

    if (error) {
        return res.status(500).json({ ok: false, error: error.message })
    }
    res.json({ ok: true, count: data.length, rows: data })
})

export default router