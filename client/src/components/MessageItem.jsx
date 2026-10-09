import React, { useState, useRef } from 'react';
import {
  Check,
  CheckCheck,
  CornerUpLeft,
  FileText,
  Download,
  Image as ImageIcon,
  Play,
  Pause,
  ExternalLink,
  Smile,
  Trash2,
} from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🔥', '🌸'];

export default function MessageItem({
  message,
  isOwn,
  senderUser,
  currentUserId,
  onReply,
  onImageClick,
  onReact,
  onDeleteMessage,
}) {
  const [touchStartX, setTouchStartX] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const audioRef = useRef(null);

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    // Only allow swipe to right
    if (diff > 0 && diff < 90) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 45) {
      onReply(message);
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Status icon component
  const renderStatus = () => {
    if (!isOwn) return null;
    const status = message.status || 'sent';

    if (status === 'read') {
      return (
        <span className="msg-status-ticks read" title="Read">
          <CheckCheck size={15} />
        </span>
      );
    }
    if (status === 'delivered') {
      return (
        <span className="msg-status-ticks delivered" title="Delivered">
          <CheckCheck size={15} />
        </span>
      );
    }
    return (
      <span className="msg-status-ticks sent" title="Sent">
        <Check size={14} />
      </span>
    );
  };

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce((acc, curr) => {
    if (!acc[curr.emoji]) {
      acc[curr.emoji] = { count: 0, users: [], hasReacted: false };
    }
    acc[curr.emoji].count += 1;
    acc[curr.emoji].users.push(curr.userName);
    if (String(curr.userId) === String(currentUserId)) {
      acc[curr.emoji].hasReacted = true;
    }
    return acc;
  }, {});

  const handleSelectReaction = (emoji) => {
    if (onReact) {
      onReact(message._id, emoji);
    }
    setShowReactionPicker(false);
  };

  return (
    <div
      className={`message-row ${isOwn ? 'own-message' : 'other-message'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe reveal action icon */}
      <div
        className="swipe-reply-indicator"
        style={{
          opacity: swipeOffset > 15 ? Math.min(1, swipeOffset / 40) : 0,
          transform: `translateX(${Math.min(30, swipeOffset * 0.4)}px)`,
        }}
      >
        <CornerUpLeft size={18} />
      </div>

      <div
        className="message-bubble"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease',
        }}
      >
        {/* Reply Quote Banner if this message is replying to something */}
        {message.replyTo && (
          <div className="replied-quote-box">
            <div className="reply-bar"></div>
            <div className="reply-body">
              <span className="reply-sender-name">
                {message.replyTo.senderName || 'Replied Message'}
              </span>
              <p className="reply-snippet-text">
                {message.replyTo.text || (message.replyTo.fileType ? `📎 Attached ${message.replyTo.fileType}` : 'Message')}
              </p>
            </div>
          </div>
        )}

        {/* Attached Files (File Sharing) */}
        {message.fileUrl && (
          <div className="message-attachment">
            {message.fileType === 'image' ? (
              <div
                className="image-attachment-wrapper"
                onClick={() => onImageClick && onImageClick(message.fileUrl)}
              >
                <img src={message.fileUrl} alt={message.fileName || 'Photo'} loading="lazy" />
              </div>
            ) : message.fileType === 'audio' ? (
              <div className="audio-player-attachment">
                <audio
                  ref={audioRef}
                  src={message.fileUrl}
                  onEnded={() => setIsPlayingAudio(false)}
                />
                <button
                  type="button"
                  className="btn-audio-toggle"
                  onClick={toggleAudio}
                >
                  {isPlayingAudio ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="audio-details">
                  <span className="audio-filename">{message.fileName || 'Voice Note'}</span>
                  <span className="audio-sub">Audio Message</span>
                </div>
              </div>
            ) : (
              <div className="generic-file-attachment">
                <div className="file-icon-box">
                  <FileText size={24} />
                </div>
                <div className="file-info-text">
                  <span className="filename-label">{message.fileName || 'Document'}</span>
                  <span className="filesize-label">
                    {message.fileSize ? `${Math.round(message.fileSize / 1024)} KB` : 'File'}
                  </span>
                </div>
                <a
                  href={message.fileUrl}
                  download={message.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-file-download"
                  title="Download File"
                >
                  <Download size={18} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Message Text */}
        {message.text && <p className="message-text-content">{message.text}</p>}

        {/* Message Footer: Time + Status Ticks */}
        <div className="message-footer-meta">
          <span className="message-timestamp">{formatTime(message.createdAt)}</span>
          {renderStatus()}
        </div>

        {/* Reaction badges pill row */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="message-reactions-row">
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                className={`reaction-pill ${data.hasReacted ? 'user-reacted' : ''}`}
                onClick={() => onReact && onReact(message._id, emoji)}
                title={data.users.join(', ')}
              >
                <span>{emoji}</span>
                {data.count > 1 && <span className="reaction-count">{data.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Quick Reaction popup bar */}
        {showReactionPicker && (
          <div className="quick-reaction-popup">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="btn-emoji-bubble"
                onClick={() => handleSelectReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Action Hover Bar (Reply, React, Delete) */}
        <div className="message-hover-actions">
          <button
            type="button"
            className="btn-msg-action"
            onClick={() => setShowReactionPicker((prev) => !prev)}
            title="React with emoji"
          >
            <Smile size={13} />
          </button>
          <button
            type="button"
            className="btn-msg-action"
            onClick={() => onReply(message)}
            title="Reply"
          >
            <CornerUpLeft size={13} />
          </button>
          <button
            type="button"
            className="btn-msg-action btn-msg-delete"
            onClick={() => {
              if (window.confirm('Delete this message?')) {
                onDeleteMessage(message._id);
              }
            }}
            title="Delete message"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
