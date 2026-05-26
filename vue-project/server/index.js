import 'dotenv/config';
import express from 'express';
import apiroutes from './routes/apiRoutes';
import supabaseroutes from './routes/supabase';
const app = express();
const port = Number(process.env.API_PORT) || 3000;
app.use(express.json());
// CORSヘッダー設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
// '/api/*'のurlを受け取る
app.use('/api', apiroutes);
app.use('/api/supabasetest', supabaseroutes);
// サーバー起動
app.listen(port, () => {
    console.log('Server started on port', port);
});
