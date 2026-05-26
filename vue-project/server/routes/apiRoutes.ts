import { Router } from "express";

import { supabaseAdmin } from "../lib/supabase";

const router = Router()

// '/api/jsonget'のurlを処理する
router.get('/jsonget', async (req, res) => {
    try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users', {
            method: 'GET',
            headers: { Accept: 'application/json' }, // 期待する返り値を伝える
        });
        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.log("jsonget server error: "+ error)
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