/**
 * 演出2: 画面を真っ赤にフラッシュさせるエフェクト
 */
export const triggerFlashEffect = () => {
  console.log('🚨 演出2: 画面フラッシュを実行します')

  // 例: フラッシュ用のオーバーレイ要素を動的に作って一瞬表示する
  const overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.top = '0'
  overlay.style.left = '0'
  overlay.style.width = '100vw'
  overlay.style.height = '100vh'
  overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'
  overlay.style.zIndex = '9999'
  overlay.style.pointerEvents = 'none'
  
  document.body.appendChild(overlay)

  // 0.5秒かけてフェードアウトして消す
  setTimeout(() => {
    overlay.remove()
  }, 500)
}
