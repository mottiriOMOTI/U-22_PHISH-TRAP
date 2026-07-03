import { ref } from 'vue'

export const showSlack = ref(false)
export const slackUser = ref('')
export const slackMessage = ref('')
export const slackAvatar = ref('')
export const chatType = ref<'slack' | 'discord' | 'line'>('slack')

let chatTimer: any = null

/**
 * 3大チャット自動出し分け演出
 * @param situation 🟢 タグを指定 ('business' | 'school' | 'daily')
 */
export const triggerChatEffectByTag = (situation: 'business' | 'school' | 'daily') => {
  if (chatTimer) clearTimeout(chatTimer)
  showSlack.value = true

  // 🟢 割り振っていたチャットツールを各シチュエーションタグに完全直結！
  switch (situation) {
    case 'business':
      chatType.value = 'slack'
      slackUser.value = '同僚：佐藤くん'
      slackAvatar.value = 'mdi-account-circle'
      slackMessage.value = 'ちょ、さっき弾いたメール公式案件だよ！会議室で上司が激怒してるから大至急Slackのログ確認して！！'
      break

    case 'school':
      chatType.value = 'discord'
      slackUser.value = 'ゼミ同期：yamada_v'
      slackAvatar.value = 'mdi-discord'
      slackMessage.value = 'おいお前教授の課題提出フォームのアドレスをスパム報告してBANしたろｗｗ 締め切りあと3分でゼミ全員提出できんぞｗｗ'
      break

    case 'daily':
      chatType.value = 'line'
      slackUser.value = 'おかん'
      slackAvatar.value = 'mdi-message-text'
      slackMessage.value = 'あんた会社（学校）クビになったって本当！？今お父さんと家で大騒ぎになってるよ！大至急電話しなさい！！'
      break
  }

  chatTimer = setTimeout(() => { showSlack.value = false }, 4000)
}
