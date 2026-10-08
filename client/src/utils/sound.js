// Web Audio API synthesized notification sound
// Guarantees crystal-clear, melodic chime without external audio files
class SoundService {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play a pleasant, sweet melodic double-chime (like an elegant bell)
  playNotificationSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E6 (1318.5 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.1); // Slide up to E6

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A6 (1760 Hz) - slightly delayed for a romantic sparkle chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.12);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

      // Mobile vibration if supported
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([80, 40, 100]);
        } catch (_) {}
      }
    } catch (e) {
      console.warn('Audio playback not allowed yet without user interaction:', e);
    }
  }

  // Request browser notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Trigger system notification
  showSystemNotification(title, body, icon = '/icon.svg') {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200],
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (err) {
        console.log('Notification error:', err);
      }
    }
  }
}

export const soundService = new SoundService();
