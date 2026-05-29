import { defineStore } from 'pinia'

export const scenarioItems = ['school', 'business', 'daily'] as const

export type Scenario = (typeof scenarioItems)[number]

export const scenarioSelectItems = [
  { title: '学生', value: 'school' },
  { title: '企業', value: 'business' },
  { title: '一般', value: 'daily' },
] as const satisfies readonly { title: string; value: Scenario }[]

type QuestionScenarioState = {
  scenario: Scenario
}

export const question_scenario = defineStore('question_scenario', {
  state: (): QuestionScenarioState => ({
    scenario: 'school',
  }),

  actions: {
    setScenario(scenario: Scenario) {
      this.scenario = scenario
    },
  },
})
