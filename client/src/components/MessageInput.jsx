import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  Camera,
  Smile,
  X,
  FileText,
  Image as ImageIcon,
  Heart,
  Sparkles,
} from 'lucide-react';
import { apiUrl } from '../utils/api';
import CameraModal from './CameraModal';

const QUICK_EMOJIS = ['💖', '✨', '🌸', '🥰', '💌', '🌹', '👑', '😘', '💫', '🔥'];

export default function MessageInput({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping,
}) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleCameraCapture = (file) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setFilePreview({ url, name: file.name, type: 'image' });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);

    // Typing notification trigger
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // If image, create local preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview({ url, name: file.name, type: 'image' });
    } else {
      setFilePreview({ url: null, name: file.name, type: 'file' });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddEmoji = (emoji) => {
    setText((prev) => prev + emoji);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !selectedFile) || uploading) return;

    setUploading(true);

    try {
      let fileData = null;

      // If there's an attached file, upload first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const token = localStorage.getItem('deepika_chat_token');
        const res = await fetch(apiUrl('/api/upload'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          throw new Error('File upload failed');
        }
        fileData = await res.json();
      }

      await onSendMessage({
        text: text.trim(),
        fileData,
        replyTo: replyingTo
          ? {
              id: replyingTo._id,
              text: replyingTo.text,
              senderName: replyingTo.senderName || 'User',
              fileType: replyingTo.fileType,
            }
          : null,
      });

      // Clear input
      setText('');
      handleRemoveFile();
      if (onCancelReply) onCancelReply();
      if (onTyping) onTyping(false);
    } catch (err) {
      console.error('Send error:', err);
      alert('Message send failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="message-input-wrapper">
      {/* Reply Quote Banner */}
      {replyingTo && (
        <div className="replying-to-preview">
          <div className="reply-preview-left">
            <span className="replying-label">Replying to {replyingTo.senderName || 'Message'}</span>
            <p className="replying-text-excerpt">
              {replyingTo.text || (replyingTo.fileType ? `📎 ${replyingTo.fileType} file` : 'Message')}
            </p>
          </div>
          <button
            type="button"
            className="btn-cancel-reply"
            onClick={onCancelReply}
            title="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* File selected preview chip */}
      {filePreview && (
        <div className="file-preview-chip">
          {filePreview.type === 'image' ? (
            <img src={filePreview.url} alt="upload preview" className="chip-img-thumb" />
          ) : (
            <FileText size={20} className="chip-file-icon" />
          )}
          <span className="chip-filename">{filePreview.name}</span>
          <button type="button" className="btn-remove-chip" onClick={handleRemoveFile}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quick Emojis strip */}
      {showEmojiPicker && (
        <div className="quick-emojis-bar">
          {QUICK_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              className="btn-emoji-quick"
              onClick={() => handleAddEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="input-form-bar">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Attachment button */}
        <button
          type="button"
          className="btn-input-action"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Attach photo, video or document"
        >
          <Paperclip size={20} />
        </button>

        {/* Live Camera button */}
        <button
          type="button"
          className="btn-input-action"
          onClick={() => setShowCameraModal(true)}
          title="Take photo from camera"
        >
          <Camera size={20} />
        </button>

        {/* Emoji trigger */}
        <button
          type="button"
          className={`btn-input-action ${showEmojiPicker ? 'active' : ''}`}
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          title="Emojis"
        >
          <Smile size={20} />
        </button>

        {/* Text Area */}
        <textarea
          rows={1}
          placeholder="Type a message for Deepika..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="chat-textarea"
        />

        {/* Send Button */}
        <button
          type="submit"
          className="btn-send-message"
          disabled={uploading || (!text.trim() && !selectedFile)}
          title="Send Message"
        >
          {uploading ? (
            <div className="btn-spinner"></div>
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
