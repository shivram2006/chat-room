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

// Delete a single message
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const success = await dbService.deleteMessage(messageId);
    if (!success) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true, messageId });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Clear entire conversation with another user
router.delete('/clear/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.params;
    await dbService.clearConversation(currentUserId, targetUserId);
    res.json({ success: true, clearedWith: targetUserId });
  } catch (err) {
    console.error('Clear chat error:', err);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

// Toggle reaction on a message
router.post('/react/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    const userName = req.user.username;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const reactions = await dbService.toggleReaction(messageId, userId, userName, emoji);
    if (!reactions) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, messageId, reactions });
  } catch (err) {
    console.error('Reaction error:', err);
    res.status(500).json({ error: 'Failed to update reaction' });
  }
});

export default router;
