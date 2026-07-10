/**
 * サウンド再生用のコンポーザブル
 * 他のVueファイルから簡単に音を鳴らすことができます。
 */
export function useSound() {
  /**
   * 警告音を再生します。
   * @param soundPath 再生する音源のパス（デフォルトは public/sounds/alert.wav）
   */
  const playSound = (soundPath: string = '/sounds/alert.wav') => {
    const audio = new Audio(soundPath);
    audio.play().catch((e) => console.warn('音声再生が拒否されました:', e));
  };

  return { playSound };
}