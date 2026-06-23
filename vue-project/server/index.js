import 'dotenv/config';
import express from 'express';
import apiroutes from './routes/apiRoutes';
import supabaseroutes from './routes/supabase';
import mailroutes from './routes/mail';
import generateroutes from './routes/generate';
import scoreroutes from './routes/score';
import adminStatsRoutes from './routes/adminStats';
import trainingStatsRoutes from './routes/trainingStats';
import usersListRoutes from './routes/usersList';
const app = express();
const port = Number(process.env.API_PORT) || 3000;
app.use(express.json({ limit: '25mb' }));
// CORSヘッダー設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
// '/api/*'のurlを受け取る
app.use('/api', apiroutes);
app.use('/api/supabasetest', supabaseroutes);
app.use('/api/mail', mailroutes);
app.use('/api/generate', generateroutes);
app.use('/api/score', scoreroutes);
app.use('/api/adminStats', adminStatsRoutes);
app.use('/api/trainingStats', trainingStatsRoutes);
app.use('/api/usersList', usersListRoutes);
// サーバー起動
app.listen(port, () => {
    console.log('Server started on port', port);
});
