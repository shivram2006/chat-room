import React from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle, Sparkles } from 'lucide-react';

export default function InstallModal({ isOpen, onClose, deferredPrompt, onInstallSuccess }) {
  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        if (onInstallSuccess) onInstallSuccess();
        onClose();
      }
    }
  };

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="install-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="install-modal-header">
          <div className="install-icon-badge">
            <Smartphone size={32} />
          </div>
          <h2>Use as Mobile App 📱</h2>
          <p className="subtitle">
            Install Deepika Chat App on your phone's <b>Home Screen</b> for a full-screen native mobile experience!
          </p>
        </div>

        <div className="install-modal-body">
          {deferredPrompt ? (
            <div className="native-install-section">
              <p className="install-highlight-text">
                Direct installation available on your browser!
              </p>
              <button className="btn-direct-install" onClick={handleNativeInstall}>
                <Download size={20} />
                <span>Tap to Add to Home Screen</span>
              </button>
            </div>
          ) : isIos ? (
            <div className="ios-instructions">
              <div className="instruction-step">
                <span className="step-num">1</span>
                <div className="step-content">
                  <p>Tap the <b>Share button</b> <Share2 size={16} className="inline-icon" /> at the bottom of Safari.</p>
                </div>
              </div>
              <div className="instruction-step">
                <span className="step-num">2</span>
                <div className="step-content">
                  <p>Scroll down and select <b>'Add to Home Screen'</b> <PlusSquare size={16} className="inline-icon" />.</p>
                </div>
              </div>
              <div className="instruction-step">
                <span className="step-num">3</span>
                <div className="step-content">
                  <p>Tap <b>'Add'</b> at the top right. The app icon will appear on your phone!</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="android-instructions">
              <div className="instruction-step">
                <span className="step-num">1</span>
                <div className="step-content">
                  <p>Tap the <b>three dots (⋮)</b> menu icon at the top right of Chrome.</p>
                </div>
              </div>
              <div className="instruction-step">
                <span className="step-num">2</span>
                <div className="step-content">
                  <p>Select <b>'Install App'</b> or <b>'Add to Home screen'</b>.</p>
                </div>
              </div>
              <div className="instruction-step">
                <span className="step-num">3</span>
                <div className="step-content">
                  <p>Tap <b>Install</b> to enjoy the dedicated mobile app!</p>
                </div>
              </div>
            </div>
          )}

          <div className="install-perks">
            <div className="perk-item">
              <CheckCircle size={16} className="perk-icon" />
              <span>Full screen app feeling (no browser URL bar)</span>
            </div>
            <div className="perk-item">
              <CheckCircle size={16} className="perk-icon" />
              <span>Instant sound notifications for incoming messages</span>
            </div>
            <div className="perk-item">
              <CheckCircle size={16} className="perk-icon" />
              <span>Swipe reply and fast photo & file sharing</span>
            </div>
          </div>
        </div>

        <div className="install-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Got it / Close
          </button>
        </div>
      </div>
    </div>
  );
}
