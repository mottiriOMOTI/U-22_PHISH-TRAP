/**
 * 演出3: ウイルス感染風の新規タブ（ポップアップ）自動生成エフェクト
 */
export const triggerVirusTabEffect = () => {
  console.log('☣️ 演出3: ウイルス風新規タブ生成を実行します')

  // 🟢 さきほどルーターに登録したURLパスを指定します
  const targetUrl = '/mailbox/feareffect/virus-alert'

  // ポップアップウィンドウのサイズと表示位置の設定
  const windowFeatures = 'width=600,height=500,top=200,left=400,resizable=yes,scrollbars=yes'

  // 🟢 登録したVueの警告ページを新しいタブ（ウィンドウ）で開く
  const newWindow = window.open(targetUrl, '_blank', windowFeatures)

  if (!newWindow) {
    console.warn('⚠️ ブラウザのポップアップブロックによって新規タブの生成が遮断されました。')
  }
}
