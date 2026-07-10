import { randomUUID } from 'node:crypto'

import { Router } from 'express'
import type { Request, Response } from 'express'

import { supabaseAdmin } from '../lib/supabase'
import {
  hashPassword,
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

type LoginRole = 'admin' | 'learner'

const LOGIN_ROLE_ERRORS: Record<LoginRole, string> = {
  admin: '管理者アカウントではありません。',
  learner: '利用者アカウントではありません。管理者の方は管理者ログインを利用してください。',
}

function parseLoginRole(value: unknown): LoginRole | null {
  return value === 'admin' || value === 'learner' ? value : null
}

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

function getPasswordResetRedirectUrl(req: Request) {
  return `${getPasswordResetBaseUrl(req)}/forgotaccount`
}

function createTemporaryAuthPassword() {
  return `${randomUUID()}Aa1!`
}

function isAuthUserAlreadyExistsError(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const message =
    'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message.toLowerCase()
      : ''

  return /already|registered|exists/.test(message)
}

function createAuthUserPayload(
  user: {
    id: string
    email: string
    name?: string | null
    role?: string | null
  },
  options: { includeAppUserId: boolean },
) {
  return {
    ...(options.includeAppUserId ? { id: user.id } : {}),
    email: user.email,
    password: createTemporaryAuthPassword(),
    email_confirm: true,
    user_metadata: {
      app_user_id: user.id,
      display_name: user.name ?? '',
      name: user.name ?? '',
      role: user.role ?? 'learner',
    },
    app_metadata: {
      app_user_id: user.id,
    },
  }
}

async function ensureSupabaseAuthUser(user: {
  id: string
  email: string
  name?: string | null
  role?: string | null
}) {
  const { error } = await supabaseAdmin.auth.admin.createUser(
    createAuthUserPayload(user, { includeAppUserId: true }),
  )

  if (!error || isAuthUserAlreadyExistsError(error)) {
    return { ok: true }
  }

  console.error('supabase auth user create with app id error:', error)

  const fallback = await supabaseAdmin.auth.admin.createUser(
    createAuthUserPayload(user, { includeAppUserId: false }),
  )

  if (!fallback.error || isAuthUserAlreadyExistsError(fallback.error)) {
    return { ok: true }
  }

  return { ok: false, error: fallback.error }
}

async function sendSupabasePasswordResetEmail(req: Request, email: string) {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl(req),
  })

  if (error) {
    throw error
  }
}

function getBearerToken(req: Request) {
  const authorization = req.get('authorization')?.trim()
  const match = authorization?.match(/^Bearer\s+(.+)$/i)

  return match?.[1] ?? null
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  return 'unknown error'
}

function shouldExposePasswordResetDeliveryErrors() {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.PASSWORD_RESET_EXPOSE_DELIVERY_ERRORS === 'true'
  )
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

router.post('/admin/users', async (req, res) => {
  try {
    const { name, email, password, creatorUserId } = req.body ?? {}
    const normalizedEmail = normalizeEmail(email)

    if (!validateString(creatorUserId)) {
      return res.status(403).json({ error: '管理者としてログインしてください。' })
    }

    const { data: creator, error: creatorError } = await supabaseAdmin
      .from('users')
      .select('id, role, is_active')
      .eq('id', creatorUserId.trim())
      .maybeSingle()

    if (creatorError) {
      return sendAuthServiceError(res, creatorError)
    }

    if (!creator || creator.role !== 'admin' || creator.is_active === false) {
      return res.status(403).json({ error: '管理者権限がありません。' })
    }

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        'admin-create-user',
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
      return res.status(409).json({ error: 'このメールアドレスはすでに登録されています。' })
    }

    const passwordHash = await hashPassword(password)
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'admin',
        current_scenario: 'school',
      })
      .select(USER_COLUMNS)
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'このメールアドレスはすでに登録されています。' })
      }

      return sendAuthServiceError(res, error)
    }

    return res.status(201).json(data)
  } catch (error) {
    return sendUnexpectedError(res, error)
  }
})

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

async function handleLogin(req: Request, res: Response, requiredRole?: LoginRole) {
  try {
    const startedAt = Date.now()
    const { email, password, role } = req.body ?? {}
    const normalizedEmail = normalizeEmail(email)
    const expectedRole = requiredRole ?? parseLoginRole(role)
    const rateLimitAction = expectedRole ? `login-${expectedRole}` : 'login'

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        rateLimitAction,
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

    if (expectedRole && data.role !== expectedRole) {
      await waitAtLeast(startedAt)
      return res.status(403).json({ error: LOGIN_ROLE_ERRORS[expectedRole] })
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
}

router.post('/login', async (req, res) => {
  return handleLogin(req, res)
})

router.post('/login/learner', async (req, res) => {
  return handleLogin(req, res, 'learner')
})

router.post('/login/admin', async (req, res) => {
  return handleLogin(req, res, 'admin')
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
      .select('id, email, name, role, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      console.error('password reset lookup error:', error)
      return res.json(responseBody)
    }

    if (user && user.is_active !== false) {
      let authUserEnsureError: unknown = null

      try {
        const authUserResult = await ensureSupabaseAuthUser(user)
        if (!authUserResult.ok) {
          authUserEnsureError = authUserResult.error
          console.error('supabase auth user ensure error:', authUserResult.error)
        }

        await sendSupabasePasswordResetEmail(req, user.email)

        if (authUserEnsureError && shouldExposePasswordResetDeliveryErrors()) {
          return res.status(502).json({
            error:
              `Supabase Auth ユーザーの準備に失敗しました。` +
              `メール送信リクエストは実行しましたが、Auth 側にユーザーが存在しない場合は届きません: ` +
              getErrorMessage(authUserEnsureError),
          })
        }

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            password_reset_requested_at: new Date().toISOString(),
            password_reset_used_at: null,
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('password reset audit update error:', updateError)
        }
      } catch (deliveryError) {
        console.error('supabase password reset delivery error:', deliveryError)

        if (shouldExposePasswordResetDeliveryErrors()) {
          return res.status(502).json({
            error: `Supabase Auth のメール送信に失敗しました: ${getErrorMessage(deliveryError)}`,
          })
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
    const { password } = req.body ?? {}
    const accessToken = getBearerToken(req)

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        'password-reset-confirm',
        accessToken ? accessToken.slice(0, 16) : getClientIp(req),
        RESET_CONFIRM_RATE_LIMIT.limit,
        RESET_CONFIRM_RATE_LIMIT.windowMs,
      )
    ) {
      return
    }

    if (!accessToken || typeof password !== 'string') {
      return res.status(400).json({ error: GENERIC_RESET_CONFIRM_ERROR })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    const normalizedEmail = normalizeEmail(authData.user?.email)

    if (authError || !authData.user || !normalizedEmail) {
      return res.status(400).json({ error: GENERIC_RESET_CONFIRM_ERROR })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      return sendAuthServiceError(res, error)
    }

    if (!user || user.is_active === false) {
      return res.status(400).json({ error: GENERIC_RESET_CONFIRM_ERROR })
    }

    const passwordValidationError = validatePasswordStrength(password, {
      email: user.email,
      name: user.name,
    })

    if (passwordValidationError) {
      return res.status(400).json({ error: passwordValidationError })
    }

    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        password_changed_at: now,
        password_reset_token_hash: null,
        password_reset_expires_at: null,
        password_reset_requested_at: null,
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

router.put('/users/:id/password', async (req, res) => {
  try {
    const userId = req.params.id
    const { currentPassword, newPassword } = req.body ?? {}

    if (!validateString(userId) || !isPasswordInput(currentPassword) || typeof newPassword !== 'string') {
      return res.status(400).json({ error: '現在のパスワードと新しいパスワードを入力してください。' })
    }

    if (
      sendRateLimitIfNeeded(
        req,
        res,
        'password-change',
        userId,
        RESET_CONFIRM_RATE_LIMIT.limit,
        RESET_CONFIRM_RATE_LIMIT.windowMs,
      )
    ) {
      return
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`${INTERNAL_USER_COLUMNS}, password_reset_token_hash`)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return sendAuthServiceError(res, error)
    }

    if (!user || user.is_active === false) {
      return res.status(404).json({ error: 'ユーザーが見つかりません。' })
    }

    const passwordResult = await verifyPassword(currentPassword, user.password_hash)

    if (!passwordResult.ok) {
      return res.status(401).json({ error: '現在のパスワードが間違っています。' })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: '現在と異なる新しいパスワードを入力してください。' })
    }

    const passwordValidationError = validatePasswordStrength(newPassword, {
      email: typeof user.email === 'string' ? user.email : null,
      name: typeof user.name === 'string' ? user.name : null,
    })

    if (passwordValidationError) {
      return res.status(400).json({ error: passwordValidationError })
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: await hashPassword(newPassword),
        password_changed_at: now,
        password_reset_token_hash: null,
        password_reset_expires_at: null,
        password_reset_used_at: null,
        failed_login_count: 0,
        locked_until: null,
        last_active_at: now,
      })
      .eq('id', userId)

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
