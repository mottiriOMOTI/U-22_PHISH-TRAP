import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type AppSettings = {
  soundEnabled: boolean
  notificationsEnabled: boolean
  fearEffectEnabled: boolean
}

type LearningHistoryItem = {
  id: string
  completedAt: string
}

type SettingsStore = {
  settings: AppSettings
  learningHistory: LearningHistoryItem[]
  lastResetAt: string | null
}

const defaultSettings: AppSettings = {
  soundEnabled: true,
  notificationsEnabled: true,
  fearEffectEnabled: true,
}

const defaultStore: SettingsStore = {
  settings: defaultSettings,
  learningHistory: [],
  lastResetAt: null,
}

const currentFile = fileURLToPath(import.meta.url)
const dataDir = path.resolve(path.dirname(currentFile), '../data')
const dataFile = path.join(dataDir, 'settings.json')

function normalizeSettings(input: Partial<AppSettings> | undefined): AppSettings {
  return {
    soundEnabled:
      typeof input?.soundEnabled === 'boolean' ? input.soundEnabled : defaultSettings.soundEnabled,
    notificationsEnabled:
      typeof input?.notificationsEnabled === 'boolean'
        ? input.notificationsEnabled
        : defaultSettings.notificationsEnabled,
    fearEffectEnabled:
      typeof input?.fearEffectEnabled === 'boolean'
        ? input.fearEffectEnabled
        : defaultSettings.fearEffectEnabled,
  }
}

function normalizeStore(input: Partial<SettingsStore> | undefined): SettingsStore {
  return {
    settings: normalizeSettings(input?.settings),
    learningHistory: Array.isArray(input?.learningHistory) ? input.learningHistory : [],
    lastResetAt: typeof input?.lastResetAt === 'string' ? input.lastResetAt : null,
  }
}

async function writeStore(store: SettingsStore) {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), 'utf8')
}

async function readStore(): Promise<SettingsStore> {
  try {
    const raw = await fs.readFile(dataFile, 'utf8')
    return normalizeStore(JSON.parse(raw) as Partial<SettingsStore>)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }

    await writeStore(defaultStore)
    return { ...defaultStore, settings: { ...defaultSettings }, learningHistory: [] }
  }
}

export async function getSettings(): Promise<AppSettings> {
  const store = await readStore()
  return store.settings
}

export async function updateSettings(nextSettings: Partial<AppSettings>): Promise<AppSettings> {
  const store = await readStore()
  const settings = normalizeSettings({
    ...store.settings,
    ...nextSettings,
  })

  await writeStore({
    ...store,
    settings,
  })

  return settings
}

export async function resetLearningHistory(): Promise<{ resetAt: string }> {
  const store = await readStore()
  const resetAt = new Date().toISOString()

  await writeStore({
    ...store,
    learningHistory: [],
    lastResetAt: resetAt,
  })

  return { resetAt }
}
