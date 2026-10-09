import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Phone,
  Video,
  MoreVertical,
  Sparkles,
  Smile,
  ShieldCheck,
  X,
  Download,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import { soundService } from '../utils/sound';

export default function ChatWindow({
  activeUser,
  currentUser,
  messages,
  isTyping,
  onSendMessage,
  onBack,
  onTyping,
  onReact,
  onDeleteMessage,
  onClearChat,
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleHeartShower = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 },
      shapes: ['star', 'circle'],
      colors: ['#f43f5e', '#ec4899', '#f472b6', '#fca5a5'],
    });
    soundService.playNotificationSound();
  };

  const handleClearChatPrompt = () => {
    if (!activeUser) return;
    if (window.confirm(`Clear all messages with ${activeUser.name}? This will delete the entire chat.`)) {
      if (onClearChat) {
        onClearChat(activeUser._id);
      }
    }
  };

  const formatLastSeenHeader = (user) => {
    if (user.isOnline) return 'Online now';
    if (!user.lastSeen) return 'Offline';
    try {
      const d = new Date(user.lastSeen);
      const hours = d.getHours() % 12 || 12;
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      return `Last seen at ${hours}:${mins} ${ampm}`;
    } catch {
      return 'Offline';
    }
  };

  if (!activeUser) {
    return (
      <div className="chat-empty-state">
        <div className="empty-state-card">
          <div className="empty-heart-ring">
            <Heart size={44} className="heart-float-anim" fill="#f43f5e" color="#f43f5e" />
          </div>
          <h2>Deepika Special Messenger 💖</h2>
          <p className="empty-tagline">
            No contacts available right now. As soon as another user registers, they will appear on the left so you can chat!
          </p>
          <div className="empty-features-list">
            <div className="feature-pill">👉 Swipe right on any message to reply</div>
            <div className="feature-pill">📎 Attach files & live camera photos</div>
            <div className="feature-pill">❤️ React with emojis & delete messages</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window-container">
      {/* Chat Header */}
      <div className="chat-window-header">
        <div className="header-left">
          <button className="btn-header-back" onClick={onBack} title="Back to conversations">
            <ArrowLeft size={20} />
          </button>

          <div className="avatar-wrapper">
            <img
              src={activeUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={activeUser.name}
              className="chat-header-avatar"
            />
            <span className={`status-indicator-badge ${activeUser.isOnline ? 'online' : 'offline'}`}></span>
          </div>

          <div className="chat-header-info">
            <div className="header-name-row">
              <span className="header-user-name">{activeUser.name}</span>
              {activeUser.isDeepika && <span className="crown-mini">👑</span>}
            </div>
            <span className={`header-status-text ${activeUser.isOnline ? 'online' : ''}`}>
              {formatLastSeenHeader(activeUser)}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-header-action love-shower-btn"
            onClick={handleHeartShower}
            title="Send Heart Shower to Deepika ✨"
          >
            <Heart size={18} fill="#f43f5e" color="#f43f5e" />
          </button>
          <button
            className="btn-header-action btn-header-trash"
            onClick={handleClearChatPrompt}
            title="Clear entire conversation"
          >
            <Trash2 size={18} />
          </button>
          <button
            className="btn-header-action"
            onClick={() => alert(`Calling ${activeUser.name}... 📞`)}
            title="Audio Call"
          >
            <Phone size={18} />
          </button>
          <button
            className="btn-header-action"
            onClick={() => alert(`Video calling ${activeUser.name}... 📹`)}
            title="Video Call"
          >
            <Video size={18} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="messages-area">
        <div className="messages-security-notice">
          <ShieldCheck size={14} />
          <span>Messages are private and end-to-end encrypted for Deepika 🌸</span>
        </div>

        {messages.length === 0 ? (
          <div className="no-messages-placeholder">
            <Heart size={32} className="no-msg-heart" />
            <p>No messages yet. Say hi to {activeUser.name}!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = String(msg.sender) === String(currentUser._id);
            return (
              <MessageItem
                key={msg._id}
                message={msg}
                isOwn={isOwn}
                senderUser={isOwn ? currentUser : activeUser}
                currentUserId={currentUser?._id}
                onReply={(m) =>
                  setReplyingTo({
                    _id: m._id,
                    text: m.text,
                    senderName: isOwn ? 'You' : activeUser.name,
                    fileType: m.fileType,
                  })
                }
                onImageClick={(url) => setPreviewImage(url)}
                onReact={onReact}
                onDeleteMessage={onDeleteMessage}
              />
            );
          })
        )}

        {/* Realtime Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator-row">
            <div className="typing-bubble">
              <div className="typing-dot dot-1"></div>
              <div className="typing-dot dot-2"></div>
              <div className="typing-dot dot-3"></div>
              <span className="typing-label-name">{activeUser.name} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input with swipe reply preview */}
      <MessageInput
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
      />

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-lightbox-close" onClick={() => setPreviewImage(null)}>
              <X size={24} />
            </button>
            <img src={previewImage} alt="Enlarged preview" className="lightbox-img" />
            <a
              href={previewImage}
              download="photo.jpg"
              target="_blank"
              rel="noreferrer"
              className="btn-lightbox-download"
            >
              <Download size={18} />
              <span>Download Image</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
