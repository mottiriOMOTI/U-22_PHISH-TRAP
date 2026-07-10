import { ref } from 'vue';
import { fetchAppSettings } from '@/api/settings'; // 設定取得APIをインポート

export function useSound() {
  /**
   * 警告音を再生します。
   * 設定がオフの場合は再生しません。
   */
  const playSound = async (soundPath: string = '/sounds/alert.wav') => {
    try {
      // 現在の設定を取得
      const settings = await fetchAppSettings();
      
      // 設定がオフなら再生せずに終了
      if (!settings.soundEnabled) {
        console.log('音声設定がオフのため再生をスキップします');
        return;
      }

      const audio = new Audio(soundPath);
      audio.play().catch((e) => console.warn('音声再生が拒否されました:', e));
    } catch (e) {
      console.error('音声設定の確認に失敗しました:', e);
    }
  };

  return { playSound };
}
