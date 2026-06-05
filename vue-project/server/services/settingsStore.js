import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const defaultSettings = {
    soundEnabled: true,
    notificationsEnabled: true,
    fearEffectEnabled: true,
};
const defaultStore = {
    settings: defaultSettings,
    learningHistory: [],
    lastResetAt: null,
};
const currentFile = fileURLToPath(import.meta.url);
const dataDir = path.resolve(path.dirname(currentFile), '../data');
const dataFile = path.join(dataDir, 'settings.json');
function normalizeSettings(input) {
    return {
        soundEnabled: typeof input?.soundEnabled === 'boolean' ? input.soundEnabled : defaultSettings.soundEnabled,
        notificationsEnabled: typeof input?.notificationsEnabled === 'boolean'
            ? input.notificationsEnabled
            : defaultSettings.notificationsEnabled,
        fearEffectEnabled: typeof input?.fearEffectEnabled === 'boolean'
            ? input.fearEffectEnabled
            : defaultSettings.fearEffectEnabled,
    };
}
function normalizeStore(input) {
    return {
        settings: normalizeSettings(input?.settings),
        learningHistory: Array.isArray(input?.learningHistory) ? input.learningHistory : [],
        lastResetAt: typeof input?.lastResetAt === 'string' ? input.lastResetAt : null,
    };
}
async function writeStore(store) {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(store, null, 2), 'utf8');
}
async function readStore() {
    try {
        const raw = await fs.readFile(dataFile, 'utf8');
        return normalizeStore(JSON.parse(raw));
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        await writeStore(defaultStore);
        return { ...defaultStore, settings: { ...defaultSettings }, learningHistory: [] };
    }
}
export async function getSettings() {
    const store = await readStore();
    return store.settings;
}
export async function updateSettings(nextSettings) {
    const store = await readStore();
    const settings = normalizeSettings({
        ...store.settings,
        ...nextSettings,
    });
    await writeStore({
        ...store,
        settings,
    });
    return settings;
}
export async function resetLearningHistory() {
    const store = await readStore();
    const resetAt = new Date().toISOString();
    await writeStore({
        ...store,
        learningHistory: [],
        lastResetAt: resetAt,
    });
    return { resetAt };
}
