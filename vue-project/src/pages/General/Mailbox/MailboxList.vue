<template>
  <v-container class="mailbox-list pa-4" max-width="900">
    <h2 class="text-h5 mb-4">受信トレイ</h2>

    <div v-if="loading">
      <v-skeleton-loader
        v-for="n in 5"
        :key="n"
        type="list-item-three-line"
        class="mb-2"
      />
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
      <template #append>
        <v-btn size="small" variant="text" @click="load">再試行</v-btn>
      </template>
    </v-alert>

    <v-alert
      v-else-if="mails.length === 0"
      type="info"
      variant="tonal"
    >
      表示できるメールがありません。
    </v-alert>

    <v-list v-else lines="three" density="comfortable" class="rounded-lg">
      <template v-for="(mail, i) in mails" :key="mail.id">
        <v-list-item
          class="mail-row"
          @click="openMail(mail.id)"
        >
          <template #prepend>
            <v-icon icon="mdi-email-outline" />
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ mail.sender_name }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-body-1 text-black">
            {{ mail.title }}
          </v-list-item-subtitle>

          <v-list-item-subtitle class="text-caption">
            {{ preview(mail.body) }}
          </v-list-item-subtitle>

          <template #append>
            <span class="text-caption text-grey">
              {{ formatDate(mail.created_at) }}
            </span>
          </template>
        </v-list-item>
        <v-divider v-if="i < mails.length - 1" />
      </template>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMails, type MailListItem } from '@/api/mailApi'

const router = useRouter()

const mails = ref<MailListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    // TODO: 認証ストア完成後に currentUser.current_scenario を渡す
    mails.value = await fetchMails()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'メールの取得に失敗しました'
  } finally {
    loading.value = false
  }
}

function openMail(id: string) {
  router.push({ name: 'MailOpen', query: { id } })
}

function preview(body: string): string {
  const plain = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > 60 ? plain.slice(0, 60) + '…' : plain
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(load)
</script>

<style scoped>
.mail-row {
  cursor: pointer;
}
.mail-row:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
