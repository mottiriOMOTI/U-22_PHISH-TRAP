import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
const router = Router();
const USER_COLUMNS = 'id, email, password_hash, name, role, current_scenario, created_at, last_active_at, is_active';
function validateDisplayName(displayName, res) {
    if (!displayName || typeof displayName !== 'string') {
        res.status(400).json({ error: 'display_name is required' });
        return false;
    }
    return true;
}
function validateString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function sendUnexpectedError(res, error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return res.status(500).json({ error: message });
}
router.post('/register', async (req, res) => {
    try {
        const { name, email, password_hash } = req.body ?? {};
        if (!validateString(name) || !validateString(email) || !validateString(password_hash)) {
            return res.status(400).json({ error: 'name, email, and password_hash are required' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const { data: existingUser, error: existingUserError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .limit(1)
            .maybeSingle();
        if (existingUserError) {
            return res.status(500).json({ error: existingUserError.message });
        }
        if (existingUser) {
            return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
        }
        const { data, error } = await supabaseAdmin
            .from('users')
            .insert({
            name: name.trim(),
            email: normalizedEmail,
            password_hash: password_hash.trim(),
            role: 'learner',
        })
            .select(USER_COLUMNS)
            .single();
        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
            }
            return res.status(500).json({ error: error.message });
        }
        return res.status(201).json(data);
    }
    catch (error) {
        return sendUnexpectedError(res, error);
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password_hash } = req.body ?? {};
        if (!validateString(email) || !validateString(password_hash)) {
            return res.status(400).json({ error: 'email and password_hash are required' });
        }
        const { data, error } = await supabaseAdmin
            .from('users')
            .select(USER_COLUMNS)
            .eq('email', email.trim().toLowerCase())
            .eq('password_hash', password_hash.trim())
            .maybeSingle();
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        if (!data || data.is_active === false) {
            return res.status(401).json({ error: 'メールアドレスまたはパスワードが間違っています' });
        }
        return res.json(data);
    }
    catch (error) {
        return sendUnexpectedError(res, error);
    }
});
router.put('/users/:id', async (req, res) => {
    try {
        const { name, email } = req.body ?? {};
        if (!validateString(name) || !validateString(email)) {
            return res.status(400).json({ error: 'name and email are required' });
        }
        const userId = req.params.id;
        const normalizedEmail = email.trim().toLowerCase();
        const { data: existingUser, error: existingUserError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .neq('id', userId)
            .limit(1)
            .maybeSingle();
        if (existingUserError) {
            return res.status(500).json({ error: existingUserError.message });
        }
        if (existingUser) {
            return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
        }
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
            name: name.trim(),
            email: normalizedEmail,
            last_active_at: new Date().toISOString(),
        })
            .eq('id', userId)
            .select(USER_COLUMNS)
            .maybeSingle();
        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
            }
            return res.status(500).json({ error: error.message });
        }
        if (!data) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }
        return res.json(data);
    }
    catch (error) {
        return sendUnexpectedError(res, error);
    }
});
router.get('/', async (_req, res) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, created_at')
        .order('created_at', { ascending: false });
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.json(data);
});
router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, created_at')
        .eq('id', userId)
        .maybeSingle();
    if (error || !data) {
        return res.status(404).json({ error: error?.message ?? 'Profile not found' });
    }
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError) {
        return res.status(500).json({ error: authError.message });
    }
    return res.json({
        ...data,
        last_sign_in_at: authData.user?.last_sign_in_at ?? null,
    });
});
router.post('/', async (req, res) => {
    const { display_name } = req.body;
    if (!validateDisplayName(display_name, res)) {
        return;
    }
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `profile-test-${randomUUID()}@example.com`,
        password: `${randomUUID()}${randomUUID()}`,
        email_confirm: true,
        user_metadata: {
            display_name,
        },
    });
    if (authError || !authData.user) {
        return res.status(500).json({ error: authError?.message ?? 'Failed to create test user' });
    }
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert({
        id: authData.user.id,
        display_name,
    }, { onConflict: 'id' })
        .select('id, display_name, created_at')
        .single();
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
});
router.put('/:id', async (req, res) => {
    const { display_name } = req.body;
    if (!validateDisplayName(display_name, res)) {
        return;
    }
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ display_name })
        .eq('id', req.params.id)
        .select('id, display_name, created_at')
        .single();
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.json(data);
});
router.delete('/:id', async (req, res) => {
    const { data: authData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(req.params.id);
    const email = authData.user?.email ?? '';
    if (!getUserError && email.startsWith('profile-test-')) {
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
        if (deleteUserError) {
            return res.status(500).json({ error: deleteUserError.message });
        }
        return res.json({ ok: true });
    }
    const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', req.params.id);
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.json({ ok: true });
});
export default router;
