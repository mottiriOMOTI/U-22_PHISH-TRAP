import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// ルーターのインポート
import apiroutes from './routes/apiRoutes';
import supabaseroutes from './routes/supabase';
import questionRouter from './routes/questions';

const app = express();
const port = Number(process.env.API_PORT) || 3000;

// JSONボディパーサーの有効化
app.use(express.json());

// CORS（クロスオリジンリソース共有）ヘッダーの安全な設定
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// 📡 受信リクエストのデバッグログ（通信エラーの原因特定を劇的にスムーズにします）
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ==========================================
// ⭕ 各種APIルートの登録 (競合回避のための優先順位最適化)
// ==========================================

// 1. 最優先: 質問API（QuestionApi）への完全一致ルーティング
// どのようなプロキシの歪みがあってもルーティングが奪われないよう、'/api' ルート群より上に配置します
app.use('/api/questions', questionRouter);

// 2. テスト用Supabaseルート
app.use('/api/supabasetest', supabaseroutes);

// 3. 既存の汎用APIルート（その他のAPIはこの中にルーティングされます）
// ※ 汎用的な '/api' は一番最後に定義することで、上記のエンドポイントと競合・干渉するのを完全に防ぎます
app.use('/api', apiroutes);

// ==========================================
// 🚨 エラーハンドリングミドルウェア（最終防衛策）
// ==========================================
// サーバー内部で予期せぬ例外が発生してもクラッシュするのを防ぎます
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('🔥 サーバー内部で未キャッチのエラーが発生しました:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || '予期せぬエラーが発生しました。'
    });
});

// 🚀 サーバー起動
app.listen(port, () => {
    console.log(`=========================================`);
    console.log(`🚀 バックエンドサーバーが正常に起動しました！`);
    console.log(`   稼働ポート: http://localhost:${port}`);
    console.log(`=========================================`);
});