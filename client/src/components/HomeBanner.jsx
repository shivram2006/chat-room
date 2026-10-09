import React, { useState } from 'react';
import { Smartphone, Sparkles, Heart, Bell, CheckCircle2, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../utils/sound';

export default function HomeBanner({ onOpenInstall, deferredPrompt, onInstalled }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && window.Notification?.permission === 'granted';
  });
  const [celebrated, setCelebrated] = useState(false);

  const handleConfetti = () => {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#f472b6', '#cbd5e1', '#fbbf24'],
    });
    soundService.playNotificationSound();
    setCelebrated(true);
    setTimeout(() => setCelebrated(false), 2000);
  };

  const handleEnableNotifications = async () => {
    soundService.playNotificationSound();
    const granted = await soundService.requestNotificationPermission();
    setSoundEnabled(granted);
    if (granted) {
      soundService.showSystemNotification(
        'Deepika Chat 💖',
        'Notifications enabled! You will hear a sweet sound when a message arrives.'
      );
    }
  };

  return (
    <div className="home-banner-container">
      {/* Background ambient glow */}
      <div className="banner-glow-orb orb-1"></div>
      <div className="banner-glow-orb orb-2"></div>

      <div className="banner-inner">
        <div className="banner-top-badges">
          <span className="badge-exclusive">
            <Sparkles className="icon-pulse" size={14} /> EXCLUSIVE EDITION
          </span>
          <span className="badge-romantic" onClick={handleConfetti} title="Click for love sparkles!">
            <Heart size={14} fill="#f43f5e" color="#f43f5e" />
            Made with unconditional love
          </span>
        </div>

        {/* BADE BADE LETTERS AS REQUESTED */}
        <h1 className="banner-grand-title">
          THIS APP HAS BEEN DESIGNED FOR <span className="gradient-highlight">DEEPIKA</span>
        </h1>

        {/* EK PYARI SI LINE */}
        <p className="banner-sweet-quote">
          “Jahan har lafz me sirf tum ho, aur har paigaam dil se nikal kar dil tak pahunche... Har pal, har baat sirf tumhare liye.” ✨💖
        </p>

        {/* ACTION BUTTONS: "USE AS MOBILE APP" & "NOTIFICATION CHIME" */}
        <div className="banner-action-buttons">
          <button
            className="btn-mobile-app-cta"
            onClick={onOpenInstall}
            id="use-as-mobile-app-btn"
            title="Add Deepika Chat to your home screen"
          >
            <div className="btn-icon-wrapper">
              <Smartphone size={20} />
            </div>
            <div className="btn-text-content">
              <span className="btn-small-label">One-Tap Install</span>
              <span className="btn-main-label">Use as Mobile App</span>
            </div>
            <span className="app-badge-live">PWA</span>
          </button>

          <button
            className={`btn-sound-cta ${soundEnabled ? 'sound-active' : ''}`}
            onClick={handleEnableNotifications}
            id="notification-sound-btn"
            title="Click to test / enable notification sound chime"
          >
            <Bell size={18} className={soundEnabled ? 'bell-ringing' : ''} />
            <span>{soundEnabled ? '🔔 Sound Alerts Active' : '🔔 Enable Notification Chime'}</span>
          </button>

          <button className="btn-sparkle-love" onClick={handleConfetti}>
            <Heart size={18} fill="#f43f5e" />
            <span>{celebrated ? '💖 Dil Se Pyaar!' : 'Send Love Sparkle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
