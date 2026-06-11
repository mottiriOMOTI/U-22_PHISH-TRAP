import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type SituationId = 'business' | 'school' | 'daily'

export type SituationState = {
  selectedScenarioId: SituationId
}

const defaultSituation: SituationState = {
  selectedScenarioId: 'school',
}

const validScenarioIds = new Set<SituationId>(['business', 'school', 'daily'])
const currentFile = fileURLToPath(import.meta.url)
const dataDir = path.resolve(path.dirname(currentFile), '../data')
const dataFile = path.join(dataDir, 'situation.json')

function normalizeSituation(input: Partial<SituationState> | undefined): SituationState {
  return {
    selectedScenarioId: validScenarioIds.has(input?.selectedScenarioId as SituationId)
      ? (input?.selectedScenarioId as SituationId)
      : defaultSituation.selectedScenarioId,
  }
}

async function writeSituation(situation: SituationState) {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(dataFile, JSON.stringify(situation, null, 2), 'utf8')
}

async function readSituation(): Promise<SituationState> {
  try {
    const raw = await fs.readFile(dataFile, 'utf8')
    return normalizeSituation(JSON.parse(raw) as Partial<SituationState>)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }

    await writeSituation(defaultSituation)
    return { ...defaultSituation }
  }
}

export async function getSituation(): Promise<SituationState> {
  return await readSituation()
}

export async function updateSituation(
  nextSituation: Partial<SituationState>,
): Promise<SituationState> {
  const situation = normalizeSituation(nextSituation)
  await writeSituation(situation)
  return situation
}
