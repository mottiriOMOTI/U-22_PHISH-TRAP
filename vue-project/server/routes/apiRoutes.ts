import { Router } from "express";

import { jsonget } from "../services/jsonget";

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

export default router