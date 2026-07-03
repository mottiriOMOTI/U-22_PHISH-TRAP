import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'

function scryptAsync(
  password: string,
  salt: string,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey)
    })
  })
}

const SCRYPT_PREFIX = 'scrypt'
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_KEY_LENGTH = 64
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024
const PASSWORD_RESET_TOKEN_BYTES = 32
const PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/i

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  'qwerty123',
  'admin123',
  'letmein123',
  'welcome123',
  '123456789',
  '1234567890',
])

export type PasswordVerificationResult = {
  ok: boolean
  needsRehash: boolean
}

export type PasswordResetToken = {
  token: string
  tokenHash: string
  expiresAt: string
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    return null
  }

  return normalized
}

export function validatePasswordStrength(
  value: unknown,
  context: { email?: string | null; name?: string | null } = {},
): string | null {
  if (typeof value !== 'string') {
    return 'パスワードを入力してください。'
  }

  if (value.length < 12) {
    return 'パスワードは12文字以上にしてください。'
  }

  if (value.length > 128) {
    return 'パスワードは128文字以内にしてください。'
  }

  if (/\s/.test(value)) {
    return 'パスワードに空白文字は使用できません。'
  }

  if (
    !/[a-z]/.test(value) ||
    !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^A-Za-z0-9]/.test(value)
  ) {
    return 'パスワードには英大文字・英小文字・数字・記号をすべて含めてください。'
  }

  const lowerPassword = value.toLowerCase()
  const emailLocalPart = context.email?.split('@')[0]?.toLowerCase()
  const normalizedName = context.name?.trim().toLowerCase()

  if (COMMON_PASSWORDS.has(lowerPassword)) {
    return '推測されやすいパスワードは使用できません。'
  }

  if (emailLocalPart && emailLocalPart.length >= 4 && lowerPassword.includes(emailLocalPart)) {
    return 'メールアドレスに含まれる文字列をパスワードに含めないでください。'
  }

  if (normalizedName && normalizedName.length >= 4 && lowerPassword.includes(normalizedName)) {
    return '名前に含まれる文字列をパスワードに含めないでください。'
  }

  return null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = (await scryptAsync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  })) as Buffer

  return [SCRYPT_PREFIX, SCRYPT_N, SCRYPT_R, SCRYPT_P, salt, key.toString('hex')].join('$')
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<PasswordVerificationResult> {
  if (storedHash.startsWith(`${SCRYPT_PREFIX}$`)) {
    const [, nRaw, rRaw, pRaw, salt, expectedHash] = storedHash.split('$')
    const n = Number(nRaw)
    const r = Number(rRaw)
    const p = Number(pRaw)

    if (!n || !r || !p || !salt || !expectedHash) {
      return { ok: false, needsRehash: true }
    }

    const expected = Buffer.from(expectedHash, 'hex')
    const actual = (await scryptAsync(password, salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: SCRYPT_MAX_MEMORY,
    })) as Buffer

    if (actual.length !== expected.length) {
      return { ok: false, needsRehash: true }
    }

    return {
      ok: timingSafeEqual(actual, expected),
      needsRehash: n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P,
    }
  }

  if (SHA256_HEX_PATTERN.test(storedHash)) {
    const expected = Buffer.from(storedHash.toLowerCase(), 'hex')
    const actual = Buffer.from(createHash('sha256').update(password).digest('hex'), 'hex')

    return {
      ok: actual.length === expected.length && timingSafeEqual(actual, expected),
      needsRehash: true,
    }
  }

  return { ok: false, needsRehash: true }
}

export function createPasswordResetToken(): PasswordResetToken {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url')

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS).toISOString(),
  }
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function isValidPasswordResetToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(value)
}
