import express from 'express';
import dotenv from 'dotenv';

import apiroutes from './routes/apiRoutes'

dotenv.config();

const app = express();
const port = 3000;

// CORSヘッダー設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// '/api/*'のurlを受け取る
app.use('/api', apiroutes);

// サーバー起動
app.listen(port, () => {
    console.log('Server started on port', port);
});
