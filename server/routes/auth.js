import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbService } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'deepika_secret_love_token_2026';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, avatar, bio, isDeepika } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await dbService.findUserByUsername(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken, please choose another!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
    ];
    const chosenAvatar = avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const isDeepikaUser = isDeepika || cleanUsername === 'deepika' || name.toLowerCase().includes('deepika');

    const newUser = await dbService.createUser({
      name,
      username: cleanUsername,
      password: hashedPassword,
      avatar: chosenAvatar,
      bio: bio || (isDeepikaUser ? 'Queen of hearts 💖 The app is designed just for me!' : 'Hey there! Loving this chat app!'),
      isDeepika: Boolean(isDeepikaUser),
      isOnline: true,
      lastSeen: new Date(),
    });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, isDeepika: newUser.isDeepika },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userResp = {
      _id: newUser._id,
      name: newUser.name,
      username: newUser.username,
      avatar: newUser.avatar,
      bio: newUser.bio,
      isDeepika: newUser.isDeepika,
      isOnline: newUser.isOnline,
      lastSeen: newUser.lastSeen,
    };

    res.status(201).json({ message: 'Welcome to Deepika Chat App!', token, user: userResp });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await dbService.findUserByUsername(cleanUsername);
    if (!user) {
      return res.status(400).json({ error: 'User not found. Would you like to sign up?' });
    }

    let isMatch = false;
    // Check bcrypt match or default sample fallback
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
      // Also allow default login shortcut for demo convenience if password is 'deepika123' or '123456'
      if (!isMatch && (password === 'deepika123' || password === '123456' || password === 'admin')) {
        isMatch = true;
      }
    } else {
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password. Please try again.' });
    }

    // Set online
    await dbService.updateUserStatus(user._id, true, new Date());

    const token = jwt.sign(
      { id: user._id, username: user.username, isDeepika: user.isDeepika },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userResp = {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      isDeepika: user.isDeepika,
      isOnline: true,
      lastSeen: new Date(),
    };

    res.json({ message: 'Login successful', token, user: userResp });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users for chat list
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await dbService.getAllUsers(req.user.id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Fast quick-login for demo (e.g. switch between Deepika and Admirer effortlessly)
router.post('/quick-login', async (req, res) => {
  try {
    const { role } = req.body; // 'deepika' or 'admirer'
    const targetUsername = role === 'deepika' ? 'deepika' : 'admirer';
    let user = await dbService.findUserByUsername(targetUsername);

    if (!user) {
      const isD = role === 'deepika';
      user = await dbService.createUser({
        name: isD ? 'Deepika ✨' : 'Special Someone 💕',
        username: targetUsername,
        password: '$2a$10$wE8wJ7qF3Q6vO0wH4Gf0OeY5lq0c2e3a4b5c6d7e8f9a0b1c2d3e4',
        avatar: isD
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        bio: isD ? 'Queen of hearts 💖 The app is designed just for me!' : 'Always here to chat with Deepika ✨',
        isDeepika: isD,
        isOnline: true,
        lastSeen: new Date(),
      });
    } else {
      await dbService.updateUserStatus(user._id, true, new Date());
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, isDeepika: user.isDeepika },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Quick login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        isDeepika: user.isDeepika,
        isOnline: true,
        lastSeen: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Quick login failed' });
  }
});

export default router;
