import { defineStore } from 'pinia'
import { fetchMails, type MailListItem } from '@/api/mailApi'

export const scenarioItems = ['school', 'business', 'daily'] as const

export type Scenario = (typeof scenarioItems)[number]

export const scenarioSelectItems = [
  { title: '\u5b66\u751f', value: 'school' },
  { title: '\u4f01\u696d', value: 'business' },
  { title: '\u4e00\u822c', value: 'daily' },
] as const satisfies readonly { title: string; value: Scenario }[]

type QuestionScenarioState = {
  scenario: Scenario
  questions: MailListItem[]
  loading: boolean
  error: string | null
}

export const question_scenario = defineStore('question_scenario', {
  state: (): QuestionScenarioState => ({
    scenario: 'school',
    questions: [],
    loading: false,
    error: null,
  }),

  getters: {
    questionCount: (state) => state.questions.length,
    questionListSubtitle: (state) =>
      `${state.questions.length}\u4ef6\u306e\u554f\u984c\u304c\u767b\u9332\u3055\u308c\u3066\u3044\u307e\u3059`,
  },

  actions: {
    setScenario(scenario: Scenario) {
      this.scenario = scenario
    },

    async fetchQuestions() {
      this.loading = true
      this.error = null

      try {
        this.questions = await fetchMails(this.scenario)
      } catch (e) {
        this.error =
          e instanceof Error
            ? e.message
            : '\u554f\u984c\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f'
      } finally {
        this.loading = false
      }
    },
  },
})
