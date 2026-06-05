import { defineStore } from 'pinia'
import {
  deleteMailQuestion,
  fetchMails,
  fetchQuestionExplanation,
  saveQuestionExplanation,
  updateMailQuestion,
  type MailListItem,
  type QuestionExplanation,
  type SaveQuestionExplanationPayload,
  type UpdateMailPayload,
} from '@/api/mailApi'

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
  saving: boolean
  deletingId: string | null
  explanation: QuestionExplanation | null
  explanationLoading: boolean
  explanationSaving: boolean
  error: string | null
}

export const question_scenario = defineStore('question_scenario', {
  state: (): QuestionScenarioState => ({
    scenario: 'school',
    questions: [],
    loading: false,
    saving: false,
    deletingId: null,
    explanation: null,
    explanationLoading: false,
    explanationSaving: false,
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

    async updateQuestion(id: string, payload: UpdateMailPayload) {
      this.saving = true
      this.error = null

      try {
        const updated = await updateMailQuestion(id, payload)
        const index = this.questions.findIndex((question) => question.id === id)

        if (index !== -1) {
          this.questions[index] = updated
        }

        return updated
      } catch (e) {
        this.error =
          e instanceof Error
            ? e.message
            : '\u554f\u984c\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f'
        throw e
      } finally {
        this.saving = false
      }
    },

    async deleteQuestion(id: string) {
      this.deletingId = id
      this.error = null

      try {
        await deleteMailQuestion(id)
        this.questions = this.questions.filter((question) => question.id !== id)
      } catch (e) {
        this.error =
          e instanceof Error
            ? e.message
            : '\u554f\u984c\u306e\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f'
        throw e
      } finally {
        this.deletingId = null
      }
    },

    async fetchExplanation(questionId: string) {
      this.explanationLoading = true
      this.error = null

      try {
        this.explanation = await fetchQuestionExplanation(questionId)
        return this.explanation
      } catch (e) {
        this.error =
          e instanceof Error
            ? e.message
            : '\u89e3\u8aac\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f'
        throw e
      } finally {
        this.explanationLoading = false
      }
    },

    async saveExplanation(questionId: string, payload: SaveQuestionExplanationPayload) {
      this.explanationSaving = true
      this.error = null

      try {
        this.explanation = await saveQuestionExplanation(questionId, payload)
        return this.explanation
      } catch (e) {
        this.error =
          e instanceof Error
            ? e.message
            : '\u89e3\u8aac\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f'
        throw e
      } finally {
        this.explanationSaving = false
      }
    },
  },
})
