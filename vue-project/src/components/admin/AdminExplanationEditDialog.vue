<template>
    <v-dialog :model-value="modelValue" max-width="860" @update:model-value="$emit('update:modelValue', $event)">
        <v-card class="edit-dialog">
            <v-card-title class="dialog-header d-flex align-center">
                <div>
                    <div class="text-h6">解説編集</div>
                    <div class="text-caption text-medium-emphasis">危険な理由、警告サイン、正しい対処法を編集します</div>
                </div>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" aria-label="閉じる" @click="$emit('update:modelValue', false)" />
            </v-card-title>

            <v-divider />

            <v-card-text>
                <v-skeleton-loader v-if="loading" type="article" />
                <template v-else>
                    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
                        {{ error }}
                    </v-alert>

                    <v-textarea
                        v-model="form.why_dangerous"
                        label="なぜ危険か"
                        variant="outlined"
                        rows="4"
                        auto-grow
                        class="mb-4"
                    />

                    <div class="d-flex align-center mb-2">
                        <div class="text-subtitle-2">警告サイン</div>
                        <v-spacer />
                        <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="addWarningSignal">
                            追加
                        </v-btn>
                    </div>

                    <div class="warning-signal-list mb-4">
                        <div v-for="(_, index) in form.warning_signals" :key="index" class="warning-signal-row">
                            <v-text-field
                                v-model="form.warning_signals[index]"
                                :label="`警告サイン ${index + 1}`"
                                variant="outlined"
                                hide-details
                            />
                            <v-btn
                                icon="mdi-close"
                                variant="text"
                                color="error"
                                aria-label="警告サインを削除"
                                :disabled="form.warning_signals.length === 1"
                                @click="removeWarningSignal(index)"
                            />
                        </div>
                    </div>

                    <v-textarea
                        v-model="form.correct_action"
                        label="正しい対処法"
                        variant="outlined"
                        rows="4"
                        auto-grow
                    />
                </template>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)">キャンセル</v-btn>
                <v-btn color="primary" :loading="saving" :disabled="loading" @click="save">保存</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { SaveQuestionExplanationPayload } from '@/api/mailApi'

const props = defineProps<{
    modelValue: boolean
    explanation: SaveQuestionExplanationPayload | null
    loading?: boolean
    saving?: boolean
    error?: string | null
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    save: [payload: SaveQuestionExplanationPayload]
}>()

const form = reactive<SaveQuestionExplanationPayload>({
    why_dangerous: '',
    warning_signals: [''],
    correct_action: '',
})

watch(
    () => props.explanation,
    (explanation) => {
        Object.assign(form, {
            why_dangerous: explanation?.why_dangerous ?? '',
            warning_signals: explanation?.warning_signals?.length ? [...explanation.warning_signals] : [''],
            correct_action: explanation?.correct_action ?? '',
        })
    },
    { immediate: true },
)

function addWarningSignal() {
    form.warning_signals.push('')
}

function removeWarningSignal(index: number) {
    if (form.warning_signals.length === 1) return
    form.warning_signals.splice(index, 1)
}

function save() {
    emit('save', {
        why_dangerous: form.why_dangerous.trim(),
        warning_signals: form.warning_signals.map((signal) => signal.trim()).filter(Boolean),
        correct_action: form.correct_action.trim(),
    })
}
</script>

<style scoped>
.edit-dialog {
    border-radius: 8px;
}

.dialog-header {
    min-height: 72px;
}

.warning-signal-list {
    display: grid;
    gap: 10px;
}

.warning-signal-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40px;
    gap: 8px;
    align-items: center;
}
</style>
