import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_SCRIPT = path.resolve(__dirname, '../ai/python/generate_question_explanation.py');
const PYTHON_COMMAND = process.env.PYTHON_COMMAND ?? 'python';
const categories = ['student', 'company', 'general'];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
function parseJsonArray(value) {
    return Array.isArray(value) ? value : [];
}
function parseSavePayload(body) {
    if (typeof body.category !== 'string' ||
        !categories.includes(body.category) ||
        typeof body.title !== 'string' ||
        typeof body.sender_name !== 'string' ||
        typeof body.sender_email !== 'string' ||
        typeof body.body !== 'string' ||
        typeof body.is_phishing !== 'boolean' ||
        typeof body.has_link !== 'boolean' ||
        typeof body.has_attachment !== 'boolean' ||
        !isRecord(body.explanation) ||
        typeof body.explanation.why_dangerous !== 'string' ||
        !isStringArray(body.explanation.warning_signals) ||
        typeof body.explanation.correct_action !== 'string') {
        return null;
    }
    const phishingType = typeof body.phishing_type === 'string' || body.phishing_type === null
        ? body.phishing_type
        : null;
    return {
        question: {
            category: body.category,
            title: body.title,
            sender_name: body.sender_name,
            sender_email: body.sender_email,
            body: body.body,
            is_phishing: body.is_phishing,
            phishing_type: body.is_phishing ? phishingType : null,
            has_link: body.has_link,
            dangerous_links: parseJsonArray(body.dangerous_links),
            has_attachment: body.has_attachment,
            dangerous_attachments: parseJsonArray(body.dangerous_attachments),
            is_decoy: typeof body.is_decoy === 'boolean' ? body.is_decoy : false,
            is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
            safe_attachments: parseJsonArray(body.safe_attachments),
        },
        explanation: {
            why_dangerous: body.explanation.why_dangerous,
            warning_signals: body.explanation.warning_signals,
            correct_action: body.explanation.correct_action,
        },
    };
}
router.post('/', async (req, res) => {
    const { category, count, isPhishing } = req.body;
    if (!category || !categories.includes(category)) {
        return res.status(400).json({ error: 'category must be student, company, or general' });
    }
    if (count !== 1) {
        return res.status(400).json({ error: 'count must be 1' });
    }
    if (typeof isPhishing !== 'boolean') {
        return res.status(400).json({ error: 'isPhishing must be boolean' });
    }
    const generationCount = count;
    const child = spawn(PYTHON_COMMAND, [PYTHON_SCRIPT], {
        env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    let responded = false;
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
        if (responded)
            return;
        responded = true;
        child.kill();
        res.status(504).json({ error: 'AI generation timed out' });
    }, 120000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
        stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
        stderr += chunk;
    });
    child.stdin.write(JSON.stringify({ category, count: generationCount, isPhishing }));
    child.stdin.end();
    child.on('error', (error) => {
        if (responded)
            return;
        responded = true;
        clearTimeout(timeout);
        return res.status(500).json({ error: error.message });
    });
    child.on('close', (code) => {
        if (responded)
            return;
        responded = true;
        clearTimeout(timeout);
        if (code !== 0) {
            const message = stderr.trim() || `Python process exited with code ${code}`;
            return res.status(500).json({ error: message });
        }
        try {
            return res.json(JSON.parse(stdout));
        }
        catch {
            return res.status(500).json({ error: 'Failed to parse generator output' });
        }
    });
});
router.post('/save', async (req, res) => {
    const payload = parseSavePayload(req.body);
    if (!payload) {
        return res.status(400).json({ error: 'Invalid generated question payload' });
    }
    const { data: question, error: questionError } = await supabaseAdmin
        .from('questions')
        .insert(payload.question)
        .select('*')
        .single();
    if (questionError || !question) {
        return res.status(500).json({ error: questionError?.message ?? 'Failed to save question' });
    }
    const { data: explanation, error: explanationError } = await supabaseAdmin
        .from('question_explanations')
        .insert({
        ...payload.explanation,
        question_id: question.id,
    })
        .select('*')
        .single();
    if (explanationError || !explanation) {
        await supabaseAdmin
            .from('questions')
            .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
            .eq('id', question.id);
        return res
            .status(500)
            .json({ error: explanationError?.message ?? 'Failed to save explanation' });
    }
    return res.status(201).json({ question, explanation });
});
export default router;
