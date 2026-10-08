import React, { useState } from 'react';
import { Search, LogOut, Heart, Sparkles, MessageSquare, Clock, UserCheck } from 'lucide-react';

export default function Sidebar({
  currentUser,
  users,
  selectedUser,
  onSelectUser,
  onLogout,
  unreadCounts,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      (u.bio && u.bio.toLowerCase().includes(term))
    );
  });

  const formatLastSeen = (dateString, isOnline) => {
    if (isOnline) return 'Online';
    if (!dateString) return 'Offline';
    try {
      const d = new Date(dateString);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;

      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return `Today at ${formattedHours}:${mins} ${ampm}`;
      }
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${formattedHours}:${mins} ${ampm}`;
    } catch {
      return 'Offline';
    }
  };

  return (
    <aside className="sidebar-container">
      {/* Current logged-in user profile header */}
      <div className="current-user-card">
        <div className="avatar-wrapper">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
            alt={currentUser.name}
            className="user-header-avatar"
          />
          <span className="status-indicator-badge online"></span>
        </div>

        <div className="user-details">
          <div className="user-name-row">
            <span className="user-display-name">{currentUser.name}</span>
            {currentUser.isDeepika && (
              <span className="crown-badge" title="Special Queen Deepika">
                👑
              </span>
            )}
          </div>
          <span className="user-username">@{currentUser.username}</span>
        </div>

        <button
          className="btn-logout"
          onClick={onLogout}
          title="Switch Account / Logout"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Special tribute ribbon */}
      <div className="deepika-sidebar-tag">
        <Heart size={14} fill="#f43f5e" color="#f43f5e" />
        <span>Deepika's Chat Lounge</span>
        <Sparkles size={14} className="tag-sparkle" />
      </div>

      {/* Search user bar */}
      <div className="sidebar-search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => setSearchTerm('')}>
            ×
          </button>
        )}
      </div>

      {/* User list */}
      <div className="user-list-scroll">
        <div className="list-section-header">
          <span>CONVERSATIONS ({filteredUsers.length})</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="no-users-box">
            <p>No users found.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUser && String(selectedUser._id) === String(user._id);
            const unread = unreadCounts[user._id] || 0;

            return (
              <div
                key={user._id}
                className={`user-list-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectUser(user)}
              >
                <div className="avatar-wrapper">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="user-item-avatar"
                  />
                  <span
                    className={`status-indicator-badge ${user.isOnline ? 'online' : 'offline'}`}
                    title={user.isOnline ? 'Online now' : 'Offline'}
                  ></span>
                </div>

                <div className="user-item-info">
                  <div className="user-item-top">
                    <span className="user-item-name">
                      {user.name}
                      {user.isDeepika && <span className="crown-mini">👑</span>}
                    </span>
                    <span className="last-seen-text">
                      {formatLastSeen(user.lastSeen, user.isOnline)}
                    </span>
                  </div>

                  <div className="user-item-bottom">
                    <p className="user-item-bio">
                      {user.bio || 'Hey there! I am using Deepika Chat App.'}
                    </p>
                    {unread > 0 && <span className="unread-bubble">{unread}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
