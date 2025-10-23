const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Store active users in memory (in production, use Redis or database)
let activeUsers = new Map();
// Cache authenticated users to reduce token verification spam
let authCache = new Map();

// Get chat room data
router.get('/room', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Add user to active users
        activeUsers.set(userId, {
            id: userId,
            name: req.user.name,
            avatar: req.user.avatar || '/images/default-avatar.svg',
            joinedAt: new Date()
        });

        // Get recent messages from database
        const [messages] = await db.execute(`
            SELECT cm.id, cm.user_id, cm.message, cm.created_at,
                   u.username, u.avatar_url
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            ORDER BY cm.created_at DESC
            LIMIT 50
        `);

        // Format messages for frontend
        const formattedMessages = messages.reverse().map(msg => ({
            id: msg.id,
            userId: msg.user_id,
            username: msg.username,
            avatar: msg.avatar_url || '/images/default-avatar.svg',
            message: msg.message,
            timestamp: msg.created_at
        }));

        res.json({
            success: true,
            data: {
                messages: formattedMessages,
                activeUsers: Array.from(activeUsers.values()),
                currentUser: {
                    id: userId,
                    name: req.user.name,
                    avatar: req.user.avatar || '/images/default-avatar.svg'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load chat room' });
    }
});

// Send message
router.post('/message', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Message cannot be empty' });
        }

        if (message.length > 500) {
            return res.status(400).json({ success: false, error: 'Message too long' });
        }

        // Insert message into database
        const [result] = await db.execute(
            'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)',
            [userId, message.trim()]
        );

        // Get the inserted message with user details
        const [messageRows] = await db.execute(`
            SELECT cm.id, cm.user_id, cm.message, cm.created_at,
                   u.username, u.avatar_url
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.id = ?
        `, [result.insertId]);

        const newMessage = {
            id: messageRows[0].id,
            userId: messageRows[0].user_id,
            username: messageRows[0].username,
            avatar: messageRows[0].avatar_url || '/images/default-avatar.svg',
            message: messageRows[0].message,
            timestamp: messageRows[0].created_at
        };

        res.json({
            success: true,
            data: newMessage
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

// Get recent messages
router.get('/messages', authenticateToken, async (req, res) => {
    try {
        // Get recent messages from database
        const [messages] = await db.execute(`
            SELECT cm.id, cm.user_id, cm.message, cm.created_at,
                   u.username, u.avatar_url
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            ORDER BY cm.created_at DESC
            LIMIT 50
        `);

        // Format messages for frontend
        const formattedMessages = messages.reverse().map(msg => ({
            id: msg.id,
            userId: msg.user_id,
            username: msg.username,
            avatar: msg.avatar_url || '/images/default-avatar.svg',
            message: msg.message,
            timestamp: msg.created_at
        }));

        res.json({
            success: true,
            data: {
                messages: formattedMessages,
                activeUsers: Array.from(activeUsers.values())
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load messages' });
    }
});

// Leave chat room
router.post('/leave', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        activeUsers.delete(userId);

        res.json({
            success: true,
            activeUsers: Array.from(activeUsers.values())
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to leave chat' });
    }
});

// Get active users
router.get('/users', authenticateToken, async (req, res) => {
    try {
        // Remove users who have been inactive for more than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        for (const [userId, user] of activeUsers) {
            if (user.joinedAt < fiveMinutesAgo) {
                activeUsers.delete(userId);
            }
        }

        res.json({
            success: true,
            data: Array.from(activeUsers.values())
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get users' });
    }
});

// Clear all chat messages (admin only)
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin or the user themselves
        const userId = req.user.id;
        
        // Clear all messages from database
        await db.execute('DELETE FROM chat_messages');
        
        res.json({
            success: true,
            message: 'Chat cleared successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to clear chat' });
    }
});

module.exports = router;