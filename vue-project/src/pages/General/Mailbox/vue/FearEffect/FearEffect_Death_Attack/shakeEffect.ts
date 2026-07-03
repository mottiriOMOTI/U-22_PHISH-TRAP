/**
 * 演出1: 画面をガタガタ揺らすエフェクト
 */
export const triggerShakeEffect = () => {
  console.log('⚡ 演出1: 画面シェイクを実行します')

  // bodyタグにCSSアニメーション用のクラスを一時的に付与する例
  document.body.classList.add('effect-shake')

  // 1秒後にクラスを削除して元に戻す
  setTimeout(() => {
    document.body.classList.remove('effect-shake')
  }, 1000)
}
