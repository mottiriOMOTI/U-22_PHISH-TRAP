<template>
  <main class="mailbox-page" :aria-busy="loading ? 'true' : 'false'">
    <header class="mailbox-hero">
      <v-icon icon="mdi-email-outline" class="mailbox-hero__icon" />
      <div>
        <h1>受信トレイ</h1>
        <p>メール一覧</p>
      </div>
    </header>

    <section class="mailbox-panel">
      <div v-if="loading">
        <div class="mail-row-skeleton" v-for="n in 4" :key="n">
          <span class="mail-row-skeleton__icon"></span>
          <div>
            <span class="mail-row-skeleton__line"></span>
            <span class="mail-row-skeleton__line mail-row-skeleton__line--short"></span>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-if="mails.length === 0" class="mailbox-state">
          <div class="mailbox-state__icon"><v-icon icon="mdi-inbox-outline" /></div>
          <div>
            <h3>メールはありません</h3>
            <p>新しいメッセージはまだ届いていません</p>
          </div>
        </div>

        <div v-else class="mail-list">
          <button
            class="mail-row__button"
            v-for="m in mails"
            :key="m.id"
            type="button"
            @click="openMail(m.id)"
          >
            <div class="mail-row__icon"><v-icon icon="mdi-email-outline" /></div>
            <div class="mail-row__content">
              <div class="mail-row__sender">{{ m.sender_name }}</div>
              <div class="mail-row__title">{{ m.title }}</div>
              <div class="mail-row__preview">{{ preview(m.body) }}</div>
            </div>
            <div class="mail-row__meta">{{ formatDate(m.created_at) }}</div>
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMails, type MailListItem } from '@/api/mailApi'

const router = useRouter()
const mails = ref<MailListItem[]>([])
const loading = ref(true)

function preview(body: string) {
  return (body || '').slice(0, 100)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function openMail(id: string) {
  router.push({ path: '/mailopen', query: { id } })
}

onMounted(async () => {
  loading.value = true
  try {
    mails.value = await fetchMails()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style src="../../Main.css"></style>
<style lang="css" scoped src="../css/MailboxList.css"></style>
