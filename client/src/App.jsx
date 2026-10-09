import React, { useState, useEffect, useRef } from 'react';
import HomeBanner from './components/HomeBanner';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AuthModal from './components/AuthModal';
import InstallModal from './components/InstallModal';
import { socket } from './utils/socket';
import { soundService } from './utils/sound';
import { apiUrl } from './utils/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('deepika_chat_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Store active user ref for socket listeners
  const selectedUserRef = useRef(selectedUser);
  selectedUserRef.current = selectedUser;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // PWA beforeinstallprompt handler
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      console.log('Deepika Chat App installed successfully!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Fetch users list
  const fetchUsers = async () => {
    const token = localStorage.getItem('deepika_chat_token');
    if (!token) return;

    try {
      const res = await fetch(apiUrl('/api/auth/users'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (data.length === 0) {
          setSelectedUser(null);
        } else if (!selectedUserRef.current || !data.some(u => String(u._id) === String(selectedUserRef.current?._id))) {
          setSelectedUser(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async (targetUserId) => {
    if (!targetUserId) return;
    const token = localStorage.getItem('deepika_chat_token');
    if (!token) return;

    try {
      const res = await fetch(apiUrl(`/api/messages/${targetUserId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        // Clear unread count for this user
        setUnreadCounts((prev) => ({ ...prev, [targetUserId]: 0 }));
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Handle User Login/Logout
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem('deepika_chat_token');
    localStorage.removeItem('deepika_chat_user');
    socket.disconnect();
    setCurrentUser(null);
    setSelectedUser(null);
    setMessages([]);
    setShowAuthModal(true);
  };

  // Manage Socket Connection & Events
  useEffect(() => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('user_connected', currentUser._id);
    fetchUsers();

    // Socket Event: receive incoming message
    const onReceiveMessage = (newMsg) => {
      const currentSelected = selectedUserRef.current;
      const isFromActiveUser = currentSelected && String(newMsg.sender) === String(currentSelected._id);

      // Play audio notification chime! (notification bajana bhi chahiye!)
      soundService.playNotificationSound();

      // Show system notification if browser permits
      soundService.showSystemNotification(
        `New message from ${newMsg.replyTo?.senderName || 'Deepika Chat'}`,
        newMsg.text || 'Sent an attachment'
      );

      if (isFromActiveUser) {
        setMessages((prev) => [...prev, newMsg]);
        // Tell server this was read immediately
        socket.emit('mark_as_read', {
          senderId: newMsg.sender,
          receiverId: currentUserRef.current?._id,
        });
      } else {
        // Increment unread badge for sender
        setUnreadCounts((prev) => ({
          ...prev,
          [newMsg.sender]: (prev[newMsg.sender] || 0) + 1,
        }));
      }
    };

    // Socket Event: Sync message sent from other tab/device
    const onMessageSentSync = (msg) => {
      const currentSelected = selectedUserRef.current;
      if (currentSelected && String(msg.receiver) === String(currentSelected._id)) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    // Socket Event: User online/offline status change
    const onUserStatusChange = ({ userId, isOnline, lastSeen }) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (String(u._id) === String(userId)) {
            return { ...u, isOnline, lastSeen };
          }
          return u;
        })
      );
      if (selectedUserRef.current && String(selectedUserRef.current._id) === String(userId)) {
        setSelectedUser((prev) => prev && { ...prev, isOnline, lastSeen });
      }
    };

    // Socket Event: Typing indicator
    const onUserTyping = ({ senderId, isTyping: typingStatus }) => {
      if (selectedUserRef.current && String(selectedUserRef.current._id) === String(senderId)) {
        setIsTyping(typingStatus);
      }
    };

    // Socket Event: Read receipts updated
    const onMessagesMarkedRead = ({ byUserId }) => {
      if (selectedUserRef.current && String(selectedUserRef.current._id) === String(byUserId)) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.receiver) === String(byUserId) ? { ...m, status: 'read' } : m
          )
        );
      }
    };

    // Socket Event: Message reaction updated
    const onMessageReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, reactions } : m))
      );
    };

    // Socket Event: Message deleted
    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    };

    // Socket Event: Chat cleared
    const onChatCleared = ({ byUserId, otherUserId }) => {
      const cur = selectedUserRef.current;
      const myId = currentUserRef.current?._id;
      if (
        cur &&
        ((String(cur._id) === String(byUserId) && String(myId) === String(otherUserId)) ||
          (String(cur._id) === String(otherUserId) && String(myId) === String(byUserId)))
      ) {
        setMessages([]);
      }
    };

    socket.on('receive_message', onReceiveMessage);
    socket.on('message_sent_sync', onMessageSentSync);
    socket.on('user_status_change', onUserStatusChange);
    socket.on('user_typing', onUserTyping);
    socket.on('messages_marked_read', onMessagesMarkedRead);
    socket.on('message_reacted', onMessageReacted);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('chat_cleared', onChatCleared);

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('message_sent_sync', onMessageSentSync);
      socket.off('user_status_change', onUserStatusChange);
      socket.off('user_typing', onUserTyping);
      socket.off('messages_marked_read', onMessagesMarkedRead);
      socket.off('message_reacted', onMessageReacted);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('chat_cleared', onChatCleared);
    };
  }, [currentUser]);

  // When selected user changes, load their conversation
  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(selectedUser._id);
      setIsTyping(false);
      socket.emit('mark_as_read', {
        senderId: selectedUser._id,
        receiverId: currentUser._id,
      });
    }
  }, [selectedUser]);

  // Send a message
  const handleSendMessage = ({ text, fileData, replyTo }) => {
    return new Promise((resolve, reject) => {
      if (!selectedUser || !currentUser) {
        reject(new Error('User not selected'));
        return;
      }

      const payload = {
        sender: currentUser._id,
        receiver: selectedUser._id,
        text: text || '',
        fileUrl: fileData ? fileData.fileUrl : '',
        fileName: fileData ? fileData.fileName : '',
        fileType: fileData ? fileData.fileType : '',
        fileSize: fileData ? fileData.fileSize : 0,
        replyTo: replyTo || null,
      };

      socket.emit('send_message', payload, (response) => {
        if (response && response.success) {
          setMessages((prev) => [...prev, response.message]);
          resolve(response.message);
        } else {
          reject(new Error(response?.error || 'Send failed'));
        }
      });
    });
  };

  // Send typing status
  const handleTypingStatus = (typing) => {
    if (!selectedUser || !currentUser) return;
    socket.emit('typing', {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      isTyping: typing,
    });
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsMobileChatOpen(true);
  };

  // Toggle reaction on a message
  const handleReact = (messageId, emoji) => {
    if (!selectedUser || !currentUser) return;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id) !== String(messageId)) return m;
        const currentReactions = m.reactions || [];
        const idx = currentReactions.findIndex((r) => String(r.userId) === String(currentUser._id));
        let updatedReactions = [...currentReactions];
        if (idx > -1) {
          if (updatedReactions[idx].emoji === emoji) {
            updatedReactions.splice(idx, 1);
          } else {
            updatedReactions[idx] = { ...updatedReactions[idx], emoji };
          }
        } else {
          updatedReactions.push({ emoji, userId: currentUser._id, userName: currentUser.username });
        }
        return { ...m, reactions: updatedReactions };
      })
    );

    socket.emit('message_react', {
      messageId,
      emoji,
      userId: currentUser._id,
      userName: currentUser.username,
      otherUserId: selectedUser._id,
    });

    const token = localStorage.getItem('deepika_chat_token');
    fetch(apiUrl(`/api/messages/react/${messageId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    }).catch((err) => console.error('Reaction API error:', err));
  };

  // Delete single message
  const handleDeleteMessage = (messageId) => {
    if (!selectedUser || !currentUser) return;
    setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));

    socket.emit('delete_message', {
      messageId,
      userId: currentUser._id,
      otherUserId: selectedUser._id,
    });

    const token = localStorage.getItem('deepika_chat_token');
    fetch(apiUrl(`/api/messages/${messageId}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch((err) => console.error('Delete message API error:', err));
  };

  // Clear entire conversation
  const handleClearChat = (targetUserId) => {
    if (!currentUser) return;
    setMessages([]);

    socket.emit('clear_chat', {
      userId: currentUser._id,
      otherUserId: targetUserId,
    });

    const token = localStorage.getItem('deepika_chat_token');
    fetch(apiUrl(`/api/messages/clear/${targetUserId}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch((err) => console.error('Clear chat API error:', err));
  };

  return (
    <div className={`app-root-layout ${isMobileChatOpen ? 'mobile-chat-mode' : ''}`}>
      {/* Grand Top Banner with prominent title & "Use as mobile app" */}
      <div className={`home-banner-wrapper ${isMobileChatOpen ? 'mobile-hidden' : ''}`}>
        <HomeBanner
          onOpenInstall={() => setShowInstallModal(true)}
          deferredPrompt={deferredPrompt}
        />
      </div>

      {/* Main Chat Interface */}
      <main className="main-chat-container">
        <div className={`chat-card-shell ${isMobileChatOpen ? 'mobile-chat-active' : ''}`}>
          {currentUser && (
            <Sidebar
              currentUser={currentUser}
              users={users}
              selectedUser={selectedUser}
              onSelectUser={handleSelectUser}
              onLogout={handleLogout}
              unreadCounts={unreadCounts}
            />
          )}

          <ChatWindow
            activeUser={selectedUser}
            currentUser={currentUser}
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onBack={() => setIsMobileChatOpen(false)}
            onTyping={handleTypingStatus}
            onReact={handleReact}
            onDeleteMessage={handleDeleteMessage}
            onClearChat={handleClearChat}
          />
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal || !currentUser}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Mobile App Install Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}
