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
  const [touchStartY, setTouchStartY] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef(0);
  const audioRef = useRef(null);

  // Swipe gesture handlers with vertical scroll protection
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = Math.abs(currentY - touchStartY);

    // If scrolling vertically, do not hijack touch for swipe
    if (diffY > 12 && diffY > Math.abs(diffX)) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }

    // Only allow swipe to right
    if (diffX > 0 && diffX < 90) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 45) {
      onReply(message);
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  // Double tap to react with Heart ❤️ & single tap to toggle actions on mobile
  const handleBubbleClick = (e) => {
    // If click was on a button/link/audio, ignore
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('audio')) {
      return;
    }

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      // Double tap detected!
      if (onReact) onReact(message._id, '❤️');
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 850);
      setShowReactionPicker(false);
      setShowMobileActions(false);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Single tap on mobile toggles actions
    if (window.innerWidth <= 768) {
      setShowMobileActions((prev) => !prev);
    }
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
        onClick={handleBubbleClick}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease',
        }}
      >
        {/* Double-tap animated heart pop */}
        {showHeartPop && <div className="heart-doubletap-pop">❤️</div>}

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
          <button
            type="button"
            className="btn-msg-dots"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileActions((prev) => !prev);
            }}
            title="Message options"
            aria-label="Message options"
          >
            <Smile size={12} />
          </button>
        </div>

        {/* Reaction badges pill row */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="message-reactions-row">
            {Object.entries(groupedReactions).map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                className={`reaction-pill ${data.hasReacted ? 'user-reacted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact && onReact(message._id, emoji);
                }}
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
          <div className="quick-reaction-popup" onClick={(e) => e.stopPropagation()}>
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="btn-emoji-bubble"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectReaction(emoji);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Action Hover & Mobile Bar (Reply, React, Delete) */}
        <div
          className={`message-hover-actions ${showMobileActions ? 'mobile-visible' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn-msg-action"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionPicker((prev) => !prev);
            }}
            title="React with emoji"
          >
            <Smile size={13} />
          </button>
          <button
            type="button"
            className="btn-msg-action"
            onClick={(e) => {
              e.stopPropagation();
              onReply(message);
              setShowMobileActions(false);
            }}
            title="Reply"
          >
            <CornerUpLeft size={13} />
          </button>
          <button
            type="button"
            className="btn-msg-action btn-msg-delete"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this message?')) {
                onDeleteMessage(message._id);
              }
              setShowMobileActions(false);
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
