<template>
    <v-dialog :model-value="modelValue" max-width="860" @update:model-value="$emit('update:modelValue', $event)">
        <v-card class="edit-dialog">
            <v-card-title class="dialog-header d-flex align-center">
                <div>
                    <div class="text-h6">問題編集</div>
                    <div class="text-caption text-medium-emphasis">メール本文と判定情報を編集します</div>
                </div>
                <v-spacer />
                <v-btn icon="mdi-close" variant="text" aria-label="閉じる" @click="$emit('update:modelValue', false)" />
            </v-card-title>

            <v-divider />

            <v-card-text>
                <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
                    {{ error }}
                </v-alert>

                <v-row>
                    <v-col cols="12">
                        <v-text-field v-model="form.title" label="メールタイトル" variant="outlined" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.sender_name" label="差出人名" variant="outlined" />
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.sender_email" label="差出人メール" variant="outlined" />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.body" label="本文" variant="outlined" rows="8" auto-grow />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-switch v-model="form.is_phishing" color="error" label="詐欺メール" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-switch v-model="form.has_link" color="warning" label="リンクあり" hide-details />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-switch v-model="form.has_attachment" color="info" label="添付あり" hide-details />
                    </v-col>
                    <v-col cols="12">
                        <v-text-field
                            v-model="form.phishing_type"
                            label="詐欺タイプ"
                            variant="outlined"
                            :disabled="!form.is_phishing"
                        />
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider />

            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn variant="text" @click="$emit('update:modelValue', false)">キャンセル</v-btn>
                <v-btn color="primary" :loading="saving" @click="save">保存</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { UpdateMailPayload } from '@/api/mailApi'

const props = defineProps<{
    modelValue: boolean
    question: (UpdateMailPayload & { id?: string }) | null
    saving?: boolean
    error?: string | null
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    save: [payload: UpdateMailPayload]
}>()

const form = reactive<UpdateMailPayload>({
    title: '',
    sender_name: '',
    sender_email: '',
    body: '',
    is_phishing: false,
    phishing_type: null,
    has_link: false,
    has_attachment: false,
})

watch(
    () => props.question,
    (question) => {
        if (!question) return
        Object.assign(form, {
            title: question.title,
            sender_name: question.sender_name,
            sender_email: question.sender_email,
            body: question.body,
            is_phishing: question.is_phishing,
            phishing_type: question.phishing_type,
            has_link: question.has_link,
            has_attachment: question.has_attachment,
        })
    },
    { immediate: true },
)

function save() {
    emit('save', {
        ...form,
        title: form.title.trim(),
        sender_name: form.sender_name.trim(),
        sender_email: form.sender_email.trim(),
        body: form.body.trim(),
        phishing_type: form.is_phishing ? form.phishing_type?.trim() || null : null,
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
</style>
