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
import userAnswersRoutes from './routes/userAnswers';
const app = express();
const port = Number(process.env.API_PORT) || 3000;
const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = configuredAllowedOrigins.length > 0 ? configuredAllowedOrigins : defaultAllowedOrigins;
app.disable('x-powered-by');
app.use(express.json({ limit: '25mb' }));
app.use((_req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('Referrer-Policy', 'no-referrer');
    res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});
app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.includes(origin)) {
        if (req.method === 'OPTIONS') {
            return res.sendStatus(403);
        }
        return res.status(403).json({ error: 'Origin is not allowed' });
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Origin', origin ?? allowedOrigins[0]);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use('/api', apiroutes);
app.use('/api/supabasetest/user-answers', userAnswersRoutes);
app.use('/api/supabasetest', supabaseroutes);
app.use('/api/mail', mailroutes);
app.use('/api/generate', generateroutes);
app.use('/api/score', scoreroutes);
app.use('/api/adminStats', adminStatsRoutes);
app.use('/api/trainingStats', trainingStatsRoutes);
app.use('/api/usersList', usersListRoutes);
app.listen(port, () => {
    console.log('Server started on port', port);
});
