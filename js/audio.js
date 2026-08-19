/**
 * audio.js - 原生 Web Audio API 音效與觸覺生成器
 * 完全採用數學波形合成木魚聲與磬聲，零外部檔案依賴，支援 30 年以上跨平台運作。
 */

const SoundSynthesizer = {
  ctx: null,

  /**
   * 初始化/解鎖 AudioContext (瀏覽器要求首次點擊後始可發聲)
   */
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  /**
   * 敲擊木魚聲 (Woodblock)
   * 原理：正弦波與三角波疊加，配合快速指數衰減包絡線
   * @param {Object} config - 配置參數
   */
  playWoodblock(config) {
    if (!config.soundEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. 主音調 (Oscillator) - 完全保留第 1 版參數 (680Hz)，僅音量降至 20% (0.8 -> 0.16)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = config.woodblockFreq || 680;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, now + 0.04);

    // 保留第 1 版的 0.08 秒長度，呈現完整的木質尾音
    const duration = config.woodblockDuration || 0.08;
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    // 2. 瞬態點擊層 (Click Transient) - 保留第 1 版的 1600Hz 撞擊，音量降至 20% (0.5 -> 0.10)
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1600, now);

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.10, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.012);
  },

  /**
   * 滿百 / 圓滿磬聲 (Bell / Chime - 古剎青銅引磬升級版)
   * 原理：雙頻率微差疊加產生禪意拍頻 (Beats) + 高頻金屬泛音 (Overtone) + 3.5秒悠遠餘音
   * @param {number} freq - 基頻 (Hz，預設 880Hz)
   * @param {number} duration - 音長 (秒，預設 3.5 秒)
   */
  playChime(freq = 880, duration = 3.5) {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. 基音 A (主頻率 880Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + duration);

    // 2. 基音 B (微差頻率 +3.5Hz，在空氣中物理干涉出每秒 3.5 次「嗡～嗡～嗡～」禪意拍頻)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq + 3.5, now);
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + duration);

    // 3. 高頻金屬泛音 (約 2.41 倍基頻，快速衰減，提供金屬槌撞擊瞬間的清亮質感)
    const overtone = this.ctx.createOscillator();
    const overtoneGain = this.ctx.createGain();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.41, now);
    overtoneGain.gain.setValueAtTime(0.15, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // 金屬泛音 1.2 秒內快速收尾

    overtone.connect(overtoneGain);
    overtoneGain.connect(this.ctx.destination);
    overtone.start(now);
    overtone.stop(now + 1.2);
  },

  /**
   * 觸覺震動 (Vibration API)
   * @param {Array<number>} pattern - 震動模式 (毫秒)
   */
  vibrate(pattern = [15]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
};