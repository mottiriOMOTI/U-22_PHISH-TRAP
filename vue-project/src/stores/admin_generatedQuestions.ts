import { defineStore } from 'pinia'
import type { GeneratedQuestion } from '@/api/question_generate'
import type { SaveQuestionExplanationPayload, UpdateMailPayload } from '@/api/mailApi'

type GeneratedPhishingType = GeneratedQuestion['phishing_type']

export type EditableGeneratedQuestion = GeneratedQuestion & {
  id: string
  created_at: string
  updated_at: string
}

type AdminGeneratedQuestionsState = {
  questions: EditableGeneratedQuestion[]
  savedIds: string[]
}

function toGeneratedPhishingType(value: string | null): GeneratedPhishingType {
  if (
    value === 'credential_theft' ||
    value === 'account_takeover' ||
    value === 'malware_attachment'
  ) {
    return value
  }

  return null
}

export const useAdminGeneratedQuestions = defineStore('admin_generated_questions', {
  state: (): AdminGeneratedQuestionsState => ({
    questions: [],
    savedIds: [],
  }),

  getters: {
    unsavedQuestions: (state) =>
      state.questions.filter((question) => !state.savedIds.includes(question.id)),
  },

  actions: {
    replaceQuestions(questions: GeneratedQuestion[]) {
      const now = new Date().toISOString()
      this.questions = questions.map((question, index) => ({
        ...question,
        id: `generated-${Date.now()}-${index}`,
        created_at: now,
        updated_at: now,
      }))
      this.savedIds = []
    },

    getQuestion(id: string) {
      return this.questions.find((question) => question.id === id) ?? null
    },

    updateQuestion(id: string, payload: UpdateMailPayload) {
      const index = this.questions.findIndex((question) => question.id === id)
      if (index === -1) return

      const currentQuestion = this.questions[index]
      if (!currentQuestion) return

      this.questions[index] = {
        ...currentQuestion,
        ...payload,
        phishing_type: toGeneratedPhishingType(payload.phishing_type),
        updated_at: new Date().toISOString(),
      }
    },

    updateExplanation(id: string, payload: SaveQuestionExplanationPayload) {
      const index = this.questions.findIndex((question) => question.id === id)
      if (index === -1) return

      const currentQuestion = this.questions[index]
      if (!currentQuestion) return

      this.questions[index] = {
        ...currentQuestion,
        explanation: payload,
        updated_at: new Date().toISOString(),
      }
    },

    deleteQuestion(id: string) {
      this.questions = this.questions.filter((question) => question.id !== id)
      this.savedIds = this.savedIds.filter((savedId) => savedId !== id)
    },

    markSaved(id: string) {
      if (!this.savedIds.includes(id)) {
        this.savedIds.push(id)
      }
    },
  },
})
