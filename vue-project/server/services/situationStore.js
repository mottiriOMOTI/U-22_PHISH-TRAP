import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const defaultSituation = {
    selectedScenarioId: 'school',
};
const validScenarioIds = new Set(['business', 'school', 'daily']);
const currentFile = fileURLToPath(import.meta.url);
const dataDir = path.resolve(path.dirname(currentFile), '../data');
const dataFile = path.join(dataDir, 'situation.json');
function normalizeSituation(input) {
    return {
        selectedScenarioId: validScenarioIds.has(input?.selectedScenarioId)
            ? input?.selectedScenarioId
            : defaultSituation.selectedScenarioId,
    };
}
async function writeSituation(situation) {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(situation, null, 2), 'utf8');
}
async function readSituation() {
    try {
        const raw = await fs.readFile(dataFile, 'utf8');
        return normalizeSituation(JSON.parse(raw));
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        await writeSituation(defaultSituation);
        return { ...defaultSituation };
    }
}
export async function getSituation() {
    return await readSituation();
}
export async function updateSituation(nextSituation) {
    const situation = normalizeSituation(nextSituation);
    await writeSituation(situation);
    return situation;
}
