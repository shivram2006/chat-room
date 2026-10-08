import React, { useState } from 'react';
import { Sparkles, User, Lock, Heart, ArrowRight, UserPlus, LogIn, Check } from 'lucide-react';
import { apiUrl } from '../utils/api';

const AVATAR_OPTIONS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', label: 'Elegance' },
  { id: '2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', label: 'Smile' },
  { id: '3', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80', label: 'Cool' },
  { id: '4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', label: 'Gentle' },
  { id: '5', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', label: 'Grace' },
];

export default function AuthModal({ isOpen, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyData =
        mode === 'login'
          ? { username, password }
          : { name, username, password, avatar: selectedAvatar, bio };

      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      localStorage.setItem('deepika_chat_token', data.token);
      localStorage.setItem('deepika_chat_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {/* Glow decoration */}
        <div className="auth-glow"></div>

        <div className="auth-header">
          <div className="auth-special-pill">
            <Sparkles size={14} /> Specially Designed For Deepika
          </div>
          <h2>Designed for Deepika 💖</h2>
          <p className="auth-subtext">
            {mode === 'login'
              ? 'Place to meet two strangers'
              : 'Create your account to start chatting'}
          </p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Your Name</label>
                <div className="input-icon-box">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Choose Avatar</label>
                <div className="avatar-selection-grid">
                  {AVATAR_OPTIONS.map((item) => (
                    <div
                      key={item.id}
                      className={`avatar-option-thumb ${selectedAvatar === item.url ? 'active' : ''}`}
                      onClick={() => setSelectedAvatar(item.url)}
                    >
                      <img src={item.url} alt={item.label} />
                      {selectedAvatar === item.url && (
                        <div className="avatar-check">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>About / Status Bio (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Always smiling ✨"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Username</label>
            <div className="input-icon-box">
              <User size={18} className="input-icon" />
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-icon-box">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? (
              <span className="spinner-text">Please wait...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-toggle-mode">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button type="button" onClick={() => setMode('register')}>
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
