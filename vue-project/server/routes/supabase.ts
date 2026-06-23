import { randomUUID } from 'node:crypto'

import { Router } from 'express'
import type { Request, Response } from 'express'

import { supabaseAdmin } from '../lib/supabase'
import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  isValidPasswordResetToken,
  normalizeEmail,
  validatePasswordStrength,
  verifyPassword,
} from '../services/authSecurity'

const router = Router()

const USER_COLUMNS =
  'id, email, name, role, current_scenario, created_at, last_active_at, is_active, image'
const INTERNAL_USER_COLUMNS = `${USER_COLUMNS}, password_hash, failed_login_count, locked_until, password_reset_expires_at, password_reset_used_at`
const USER_SCENARIOS = new Set(['business', 'school', 'daily'])

const AVATAR_BUCKET = 'user-icons'
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 }
const REGISTER_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }
const RESET_REQUEST_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }
const RESET_CONFIRM_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 }
const FAILED_LOGIN_LOCK_THRESHOLD = 5
const FAILED_LOGIN_LOCK_MS = 15 * 60 * 1000
const GENERIC_LOGIN_ERROR = 'メールアドレスまたはパスワードが間違っています。'
const GENERIC_RESET_REQUEST_MESSAGE =
  '登録済みのメールアドレスの場合、パスワード再設定用の案内を送信しました。'
const GENERIC_RESET_CONFIRM_ERROR = 'パスワード再設定リンクが無効、または期限切れです。'
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

function validateDisplayName(displayName: unknown, res: Response): displayName is string {
  if (!displayName || typeof displayName !== 'string') {
    res.status(400).json({ error: 'display_name is required' })
    return false
  }

  return true
}

function validateString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPasswordInput(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128
}

function getClientIp(req: Request) {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function consumeRateLimit(
  req: Request,
  action: string,
  subject: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now()
  const key = `${action}:${getClientIp(req)}:${subject}`
  const current = rateLimitBuckets.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, retryAfterSeconds: 0 }
  }

  current.count += 1

  if (current.count <= limit) {
    return { limited: false, retryAfterSeconds: 0 }
  }

  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

function sendRateLimitIfNeeded(
  req: Request,
  res: Response,
  action: string,
  subject: string,
  limit: number,
  windowMs: number,
) {
  const result = consumeRateLimit(req, action, subject, limit, windowMs)

  if (!result.limited) {
    return false
  }

  res.setHeader('Retry-After', String(result.retryAfterSeconds))
  res.status(429).json({ error: '試行回数が多すぎます。しばらくしてから再度お試しください。' })
  return true
}

function publicUser(user: Record<string, unknown>) {
  const {
    password_hash: _passwordHash,
    failed_login_count: _failedLoginCount,
    locked_until: _lockedUntil,
    password_reset_token_hash: _passwordResetTokenHash,
    password_reset_expires_at: _passwordResetExpiresAt,
    password_reset_requested_at: _passwordResetRequestedAt,
    password_reset_used_at: _passwordResetUsedAt,
    password_changed_at: _passwordChangedAt,
    ...safeUser
  } = user

  return safeUser
}

function isAccountLocked(lockedUntil: unknown) {
  return typeof lockedUntil === 'string' && new Date(lockedUntil).getTime() > Date.now()
}

async function waitAtLeast(startedAt: number, minimumMs = 250) {
  const remainingMs = minimumMs - (Date.now() - startedAt)

  if (remainingMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingMs))
  }
}

async function recordFailedLogin(user: Record<string, unknown>) {
  const failedLoginCount = Number(user.failed_login_count ?? 0) + 1
  const updatePayload: Record<string, unknown> = {
    failed_login_count: failedLoginCount,
  }

  if (failedLoginCount >= FAILED_LOGIN_LOCK_THRESHOLD) {
    updatePayload.locked_until = new Date(Date.now() + FAILED_LOGIN_LOCK_MS).toISOString()
  }

  const { error } = await supabaseAdmin.from('users').update(updatePayload).eq('id', user.id)

  if (error) {
    console.error('failed login update error:', error)
  }
}

function getPasswordResetBaseUrl(req: Request) {
  const configuredBaseUrl = process.env.PASSWORD_RESET_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '')
  }

  const origin = req.get('origin')?.trim()
  return (origin || 'http://localhost:5173').replace(/\/$/, '')
}

function createPasswordResetUrl(req: Request, token: string) {
  const resetUrl = `${getPasswordResetBaseUrl(req)}/forgotaccount?token=${encodeURIComponent(token)}`
  return resetUrl
}

async function deliverPasswordResetLink(req: Request, email: string, token: string) {
  const resetUrl = createPasswordResetUrl(req, token)
  const webhookUrl = process.env.PASSWORD_RESET_WEBHOOK_URL?.trim()

  if (webhookUrl) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const webhookSecret = process.env.PASSWORD_RESET_WEBHOOK_SECRET?.trim()

    if (webhookSecret) {
      headers.Authorization = `Bearer ${webhookSecret}`
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, resetUrl }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`Password reset webhook failed: ${response.status} ${response.statusText}`)
    }

    return
  }

  if (process.env.NODE_ENV === 'production' && process.env.LOG_PASSWORD_RESET_LINKS !== 'true') {
    console.warn('PASSWORD_RESET_WEBHOOK_URL is not configured; password reset link was not sent.')
    return
  }

  console.info(`Password reset link for ${email}: ${resetUrl}`)
}

function sendUnexpectedError(res: Response, error: unknown) {
  console.error('supabase route unexpected error:', error)

  return res.status(500).json({
    error: '認証サーバーに接続できませんでした。環境設定とネットワーク接続を確認してください。',
  })
}

function sendAuthServiceError(res: Response, error: unknown) {
  console.error('auth service error:', error)

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined

  if (code === '42703') {
    return res.status(500).json({
      error: '認証用DBカラムが不足しています。Supabaseに最新マイグレーションを反映してください。',
    })
  }

  if (code === 'PGRST204') {
    return res.status(500).json({
      error: '認証用DBカラムがSupabaseのスキーマキャッシュに反映されていません。最新マイグレーション適用後、スキーマキャッシュをリロードしてください。',
    })
  }

  return res.status(500).json({
    error: '認証サーバーに接続できませんでした。環境設定とネットワーク接続を確認してください。',
  })
}

async function ensureAvatarBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

  if (listError) {
    return listError
  }

  const exists = buckets?.some((bucket) => bucket.name === AVATAR_BUCKET)

  if (exists) {
    const { error } = await supabaseAdmin.storage.updateBucket(AVATAR_BUCKET, { public: true })
    return error
  }

  const { error } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: MAX_AVATAR_BYTES,
    allowedMimeTypes: Object.keys(ALLOWED_AVATAR_TYPES),
  })

  return error
}

function parseAvatarDataUrl(dataUrl: unknown, contentType: unknown) {
  if (typeof dataUrl !== 'string' || typeof contentType !== 'string') {
    return { error: 'image data is required' }
  }

  const extension = ALLOWED_AVATAR_TYPES[contentType]

  if (!extension) {
    return { error: 'image must be jpeg, png, webp, or gif' }
  }

  const dataUrlPrefix = `data:${contentType};base64,`

  if (!dataUrl.startsWith(dataUrlPrefix)) {
    return { error: 'invalid image data' }
  }

  const base64 = dataUrl.slice(dataUrlPrefix.length)
  const fileBuffer = Buffer.from(base64, 'base64')

  if (fileBuffer.byteLength === 0) {
    return { error: 'image data is empty' }
  }

  if (fileBuffer.byteLength > MAX_AVATAR_BYTES) {
    return { error: 'image must be 2MB or smaller' }
  }

  return { fileBuffer, extension }
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {}
    const normalizedEmail = normalizeEmail(email)

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        'register',
        normalizedEmail ?? getClientIp(req),
        REGISTER_RATE_LIMIT.limit,
        REGISTER_RATE_LIMIT.windowMs,
      )
    ) {
      return
    }

    if (!validateString(name) || !normalizedEmail || typeof password !== 'string') {
      return res
        .status(400)
        .json({ error: '名前、メールアドレス、パスワードを正しく入力してください。' })
    }

    const passwordValidationError = validatePasswordStrength(password, {
      email: normalizedEmail,
      name,
    })

    if (passwordValidationError) {
      return res.status(400).json({ error: passwordValidationError })
    }

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (existingUserError) {
      return sendAuthServiceError(res, existingUserError)
    }

    if (existingUser) {
      return res
        .status(409)
        .json({ error: 'アカウントを作成できませんでした。入力内容を確認してください。' })
    }

    const passwordHash = await hashPassword(password)
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'learner',
      })
      .select(USER_COLUMNS)
      .single()

    if (error) {
      if (error.code === '23505') {
        return res
          .status(409)
          .json({ error: 'アカウントを作成できませんでした。入力内容を確認してください。' })
      }

      return sendAuthServiceError(res, error)
    }

    return res.status(201).json(data)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const startedAt = Date.now()
    const { email, password } = req.body ?? {}
    const normalizedEmail = normalizeEmail(email)

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        'login',
        normalizedEmail ?? getClientIp(req),
        LOGIN_RATE_LIMIT.limit,
        LOGIN_RATE_LIMIT.windowMs,
      )
    ) {
      return
    }

    if (!normalizedEmail || !isPasswordInput(password)) {
      await waitAtLeast(startedAt)
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(INTERNAL_USER_COLUMNS)
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      return sendAuthServiceError(res, error)
    }

    if (!data || data.is_active === false) {
      await waitAtLeast(startedAt)
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR })
    }

    if (isAccountLocked(data.locked_until)) {
      return res
        .status(429)
        .json({ error: 'ログイン試行回数が多すぎます。しばらくしてから再度お試しください。' })
    }

    const passwordResult = await verifyPassword(password, data.password_hash)

    if (!passwordResult.ok) {
      await recordFailedLogin(data)
      await waitAtLeast(startedAt)
      return res.status(401).json({ error: GENERIC_LOGIN_ERROR })
    }

    const updatePayload: Record<string, unknown> = {
      failed_login_count: 0,
      locked_until: null,
      last_active_at: new Date().toISOString(),
    }

    if (passwordResult.needsRehash) {
      updatePayload.password_hash = await hashPassword(password)
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', data.id)
      .select(USER_COLUMNS)
      .single()

    if (updateError) {
      return sendAuthServiceError(res, updateError)
    }

    return res.json(updatedUser)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.post('/password-reset/request', async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email)

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        'password-reset-request',
        normalizedEmail ?? getClientIp(req),
        RESET_REQUEST_RATE_LIMIT.limit,
        RESET_REQUEST_RATE_LIMIT.windowMs,
      )
    ) {
      return
    }

    const responseBody = { ok: true, message: GENERIC_RESET_REQUEST_MESSAGE }

    if (!normalizedEmail) {
      return res.json(responseBody)
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      console.error('password reset lookup error:', error)
      return res.json(responseBody)
    }

    if (user && user.is_active !== false) {
      const resetToken = createPasswordResetToken()
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          password_reset_token_hash: resetToken.tokenHash,
          password_reset_expires_at: resetToken.expiresAt,
          password_reset_requested_at: new Date().toISOString(),
          password_reset_used_at: null,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('password reset token update error:', updateError)
      } else {
        try {
          await deliverPasswordResetLink(req, user.email, resetToken.token)
        } catch (deliveryError) {
          console.error('password reset delivery error:', deliveryError)
        }
      }
    }

    return res.json(responseBody)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { token, password } = req.body ?? {}

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        'password-reset-confirm',
        isValidPasswordResetToken(token) ? token.slice(0, 12) : getClientIp(req),
        RESET_CONFIRM_RATE_LIMIT.limit,
        RESET_CONFIRM_RATE_LIMIT.windowMs,
      )
    ) {
      return
    }

    if (!isValidPasswordResetToken(token) || typeof password !== 'string') {
      return res.status(400).json({ error: GENERIC_RESET_CONFIRM_ERROR })
    }

    const passwordValidationError = validatePasswordStrength(password)

    if (passwordValidationError) {
      return res.status(400).json({ error: passwordValidationError })
    }

    const tokenHash = hashPasswordResetToken(token)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, is_active, password_reset_expires_at, password_reset_used_at')
      .eq('password_reset_token_hash', tokenHash)
      .maybeSingle()

    if (error) {
      return sendAuthServiceError(res, error)
    }

    const expiresAt =
      typeof user?.password_reset_expires_at === 'string'
        ? new Date(user.password_reset_expires_at).getTime()
        : 0

    if (
      !user ||
      user.is_active === false ||
      user.password_reset_used_at ||
      !expiresAt ||
      expiresAt <= Date.now()
    ) {
      return res.status(400).json({ error: GENERIC_RESET_CONFIRM_ERROR })
    }

    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_token_hash: null,
        password_reset_expires_at: null,
        password_reset_used_at: now,
        failed_login_count: 0,
        locked_until: null,
        last_active_at: now,
      })
      .eq('id', user.id)

    if (updateError) {
      return sendAuthServiceError(res, updateError)
    }

    return res.json({ ok: true })
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body ?? {}

    if (!validateString(name) || !validateString(email)) {
      return res.status(400).json({ error: 'name and email are required' })
    }

    const userId = req.params.id
    const normalizedEmail = email.trim().toLowerCase()

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .neq('id', userId)
      .limit(1)
      .maybeSingle()

    if (existingUserError) {
      return res.status(500).json({ error: existingUserError.message })
    }

    if (existingUser) {
      return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' })
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
      .maybeSingle()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' })
      }

      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' })
    }

    return res.json(data)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.put('/users/:id/scenario', async (req, res) => {
  try {
    const { current_scenario } = req.body ?? {}

    if (typeof current_scenario !== 'string' || !USER_SCENARIOS.has(current_scenario)) {
      return res.status(400).json({ error: 'current_scenario must be business, school, or daily' })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        current_scenario,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select(USER_COLUMNS)
      .maybeSingle()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!data || data.is_active === false) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(data)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.put('/users/:id/image', async (req, res) => {
  try {
    const userId = req.params.id
    const parsedImage = parseAvatarDataUrl(req.body?.dataUrl, req.body?.contentType)

    if ('error' in parsedImage) {
      return res.status(400).json({ error: parsedImage.error })
    }

    const bucketError = await ensureAvatarBucket()

    if (bucketError) {
      return res.status(500).json({ error: bucketError.message })
    }

    const filePath = `${userId}/${randomUUID()}.${parsedImage.extension}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, parsedImage.fileBuffer, {
        contentType: req.body.contentType,
        upsert: false,
      })

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message })
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        image: publicUrlData.publicUrl,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(USER_COLUMNS)
      .maybeSingle()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!data || data.is_active === false) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(data)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.get('/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(USER_COLUMNS)
      .eq('id', req.params.id)
      .maybeSingle()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!data || data.is_active === false) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json(data)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(data)
})

router.get('/:id', async (req, res) => {
  const userId = req.params.id

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return res.status(404).json({ error: error?.message ?? 'Profile not found' })
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (authError) {
    return res.status(500).json({ error: authError.message })
  }

  return res.json({
    ...data,
    last_sign_in_at: authData.user?.last_sign_in_at ?? null,
  })
})

router.post('/', async (req, res) => {
  const { display_name } = req.body

  if (!validateDisplayName(display_name, res)) {
    return
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `profile-test-${randomUUID()}@example.com`,
    password: `${randomUUID()}${randomUUID()}`,
    email_confirm: true,
    user_metadata: {
      display_name,
    },
  })

  if (authError || !authData.user) {
    return res.status(500).json({ error: authError?.message ?? 'Failed to create test user' })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: authData.user.id,
        display_name,
      },
      { onConflict: 'id' },
    )
    .select('id, display_name, created_at')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(201).json(data)
})

router.put('/:id', async (req, res) => {
  const { display_name } = req.body

  if (!validateDisplayName(display_name, res)) {
    return
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ display_name })
    .eq('id', req.params.id)
    .select('id, display_name, created_at')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { data: authData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
    req.params.id,
  )
  const email = authData.user?.email ?? ''

  if (!getUserError && email.startsWith('profile-test-')) {
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)

    if (deleteUserError) {
      return res.status(500).json({ error: deleteUserError.message })
    }

    return res.json({ ok: true })
  }

  const { error } = await supabaseAdmin.from('profiles').delete().eq('id', req.params.id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ ok: true })
})

export default router
