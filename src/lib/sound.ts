// Web Audio API 合成音效（纯代码合成，无任何外部音频资源加载）

const SOUND_STORAGE_KEY = 'git-learn-sound-enabled';

/** 判断当前是否启用音效（默认开启，SSR 安全） */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return false;
  }
}

/** 设置音效开关状态 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('sound-setting-change', { detail: { enabled } }));
    }
  } catch {
    // ignore
  }
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** 播放轻脆的打字敲击音（极短、柔和低沉的白噪/低频正弦微击） */
export function playKeySound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    // 轻微音高扰动，听起来更自然
    osc.frequency.setValueAtTime(440 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.03);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // ignore
  }
}

/** 步骤完成/命令执行成功提示音（清脆的上行双音 C5 -> G5） */
export function playStepSuccessSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // 两个明亮的音符构成胜利小三和弦向上过渡
    playTone(523.25, now, 0.12); // C5
    playTone(659.25, now + 0.08, 0.18); // E5
  } catch {
    // ignore
  }
}

/** 步骤失败/命令报错提示音（柔和低沉的下行微提示） */
export function playStepErrorSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // ignore
  }
}

/** 任务/章节通关庆典音效（上行大三和弦琶音 C5 -> E5 -> G5 -> C6） */
export function playFanfareSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.16 }, // C5
      { freq: 659.25, time: 0.12, dur: 0.16 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.2 }, // G5
      { freq: 1046.5, time: 0.38, dur: 0.5 }, // C6
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.18, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur);
    });
  } catch {
    // ignore
  }
}
