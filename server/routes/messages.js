import express from 'express';
import { dbService } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get conversation messages between current user and target user
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const messages = await dbService.getMessages(currentUserId, targetUserId);

    // Also mark received messages as read
    await dbService.markRead(targetUserId, currentUserId);

    res.json(messages);
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Mark messages as read
router.post('/read', authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.body;
    const currentUserId = req.user.id;
    if (senderId) {
      await dbService.markRead(senderId, currentUserId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

export default router;
