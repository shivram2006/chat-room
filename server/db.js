import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Message from './models/Message.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

let isMongoConnected = false;

// Initialize JSON store file if needed
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading store file, resetting:', err);
  }
  return { users: [], messages: [] };
}

function saveStore(store) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing store file:', err);
  }
}

// Ensure store initialized cleanly without fake users
function ensureDefaultUsers() {
  const store = loadStore();
  if (!store.users) store.users = [];
  if (!store.messages) store.messages = [];
  saveStore(store);
}

export async function connectDB() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/deepika_chat';
  
  // Clean URI if custom non-standard query parameters like ?chat-room= are present
  if (uri.includes('?chat-room=') || uri.includes('&chat-room=')) {
    uri = uri.replace(/\?chat-room=[^&]*/, '/deepika_chat?retryWrites=true&w=majority');
  } else if (uri.startsWith('mongodb+srv://') && !uri.includes('.mongodb.net/')) {
    // Ensure database name is included before query string
    uri = uri.replace('.mongodb.net/?', '.mongodb.net/deepika_chat?');
  }

  try {
    mongoose.set('strictQuery', false);
    console.log('🔄 Connecting to MongoDB database...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 7000,
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas successfully!');
  } catch (err) {
    isMongoConnected = false;
    console.log(`⚠️ MongoDB connection note: ${err.message}`);
    console.log('💡 Running seamlessly on local persistent store (data will be saved safely).');
    ensureDefaultUsers();
  }
}

export const dbService = {
  isMongo: () => isMongoConnected,

  async createUser(data) {
    if (isMongoConnected) {
      const u = new User(data);
      return await u.save();
    }
    const store = loadStore();
    const newUser = {
      _id: 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveStore(store);
    return newUser;
  },

  async findUserByUsername(username) {
    if (isMongoConnected) {
      return await User.findOne({ username: username.toLowerCase() });
    }
    const store = loadStore();
    return store.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (isMongoConnected) {
      return await User.findById(id).select('-password');
    }
    const store = loadStore();
    const u = store.users.find((u) => String(u._id) === String(id));
    if (!u) return null;
    const { password, ...rest } = u;
    return rest;
  },

  async getAllUsers(excludeId) {
    if (isMongoConnected) {
      return await User.find(excludeId ? { _id: { $ne: excludeId } } : {}).select('-password');
    }
    const store = loadStore();
    return store.users
      .filter((u) => !excludeId || String(u._id) !== String(excludeId))
      .map(({ password, ...rest }) => rest);
  },

  async updateUserStatus(id, isOnline, lastSeen = new Date()) {
    if (isMongoConnected) {
      return await User.findByIdAndUpdate(id, { isOnline, lastSeen }, { new: true });
    }
    const store = loadStore();
    const user = store.users.find((u) => String(u._id) === String(id));
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = lastSeen.toISOString ? lastSeen.toISOString() : lastSeen;
      saveStore(store);
      return user;
    }
    return null;
  },

  async createMessage(data) {
    if (isMongoConnected) {
      const msg = new Message(data);
      return await msg.save();
    }
    const store = loadStore();
    const newMsg = {
      _id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...data,
      status: data.status || 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.messages.push(newMsg);
    saveStore(store);
    return newMsg;
  },

  async getMessages(user1, user2) {
    if (isMongoConnected) {
      return await Message.find({
        $or: [
          { sender: user1, receiver: user2 },
          { sender: user2, receiver: user1 },
        ],
      }).sort({ createdAt: 1 });
    }
    const store = loadStore();
    return store.messages
      .filter(
        (m) =>
          (String(m.sender) === String(user1) && String(m.receiver) === String(user2)) ||
          (String(m.sender) === String(user2) && String(m.receiver) === String(user1))
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async markDelivered(receiverId) {
    if (isMongoConnected) {
      await Message.updateMany(
        { receiver: receiverId, status: 'sent' },
        { status: 'delivered' }
      );
      return;
    }
    const store = loadStore();
    let updated = false;
    store.messages.forEach((m) => {
      if (String(m.receiver) === String(receiverId) && m.status === 'sent') {
        m.status = 'delivered';
        updated = true;
      }
    });
    if (updated) saveStore(store);
  },

  async markRead(senderId, receiverId) {
    if (isMongoConnected) {
      await Message.updateMany(
        { sender: senderId, receiver: receiverId, status: { $ne: 'read' } },
        { status: 'read', readAt: new Date() }
      );
      return;
    }
    const store = loadStore();
    let updated = false;
    store.messages.forEach((m) => {
      if (
        String(m.sender) === String(senderId) &&
        String(m.receiver) === String(receiverId) &&
        m.status !== 'read'
      ) {
        m.status = 'read';
        m.readAt = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) saveStore(store);
  },
};
