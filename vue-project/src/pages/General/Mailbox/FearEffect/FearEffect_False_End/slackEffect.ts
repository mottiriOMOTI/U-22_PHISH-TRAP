import { ref } from 'vue'

// 🟢 データを一元管理（Discord用の設定も共有）
export const showSlack = ref(false)
export const slackUser = ref('')
export const slackMessage = ref('')
export const slackAvatar = ref('')
export const chatType = ref<'slack' | 'discord'>('slack') // 🟢 どちらのデザインを使うかの判定フラグ

let chatTimer: any = null

/**
 * 演出16: 画面上部からビジネスチャット風（Slack/Discord）メッセージを降らせる
 * @param type 発言者のタイプ ('colleague' | 'manager' | 'discord_friend')
 */
export const triggerSlackEffect = (type: 'colleague' | 'manager' | 'discord_friend') => {
  console.log(`💬 チャットポップアップを実行します [ ${type} ]`)

  if (chatTimer) clearTimeout(chatTimer)
  showSlack.value = true

  // 🟢 タイプによって Slack か Discord かの見た目を切り替える
  if (type === 'discord_friend') {
    chatType.value = 'discord'
    slackUser.value = 'ネトフレ：yamada_v'
    slackAvatar.value = 'mdi-discord'
    slackMessage.value = 'おいおいお前のアカウント、ギルドの公式掲示板の書き込みをスパム報告してBAN申請したろｗｗｗ あれ正規のアナウンスやぞｗｗｗ'
  } else {
    chatType.value = 'slack'
    if (type === 'colleague') {
      slackUser.value = '同僚：佐藤くん'
      slackAvatar.value = 'mdi-account-circle'
      slackMessage.value = 'ちょ、さっき弾いたメール公式案件だよ！会議室で大騒ぎになってるから大至急Slackのログ確認して！！'
    } else {
      slackUser.value = 'システム統括：鈴木室長'
      slackAvatar.value = 'mdi-account-tie'
      slackMessage.value = '【警告】本日のクライアントメール破棄に伴い、インシデント報告書（事由：誤破棄）の起票を行ってください。'
    }
  }

  // 4秒後に自動で上部へ引っ込める
  chatTimer = setTimeout(() => {
    showSlack.value = false
    console.log('💬 チャットポップアップが自動で格納されました')
  }, 4000)
}
