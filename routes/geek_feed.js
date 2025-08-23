const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

// Authentication middleware
const authenticateUser = (req, res, next) => {
    try {
        console.log('Auth headers:', req.headers.authorization);
        
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        // Check if no token
        if (!token) {
            console.log('No token provided in request');
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }
        
        // Check for JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables!');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }
        
        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            console.log('Authentication successful for user:', decoded.username);
            next();
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return res.status(401).json({
                success: false,
                message: 'Token is not valid'
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

// GET all posts with sorting options
router.get('/posts', authenticateUser, async (req, res) => {
    try {
        console.log('GET /posts - User:', req.user);
        const sort = req.query.sort || 'latest'; // Default to latest
        console.log('Sorting by:', sort);
        
        // Fix the SQL query to properly count reactions and remove profile_picture field
        let query = `
            SELECT 
                p.id, 
                p.content, 
                p.created_at, 
                u.id as user_id, 
                u.username, 
                (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction_type = 'like') as likes,
                (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction_type = 'dislike') as dislikes,
                (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction_type = 'like') -
                (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction_type = 'dislike') as net_votes,
                (SELECT reaction_type FROM post_reactions WHERE post_id = p.id AND user_id = ? LIMIT 1) as user_reaction
            FROM posts p
            JOIN users u ON p.user_id = u.id
        `;
        
        if (sort === 'top') {
            query += ' ORDER BY net_votes DESC, p.created_at DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }
        
        console.log('Executing query with user ID:', req.user.id);
        const [posts] = await db.execute(query, [req.user.id]);
        console.log('Found posts:', posts.length);
        
        res.status(200).json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// POST a new post
router.post('/posts', [
    authenticateUser,
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Post content must be between 1 and 1000 characters')
], async (req, res) => {
    try {
        console.log('POST /posts - User:', req.user);
        console.log('Post body:', req.body);
        
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        
        const { content } = req.body;
        const userId = req.user.id;
        console.log(`Creating post for user ID: ${userId} with content: ${content.substring(0, 30)}...`);
        
        // Insert post into database
        const [result] = await db.execute(
            'INSERT INTO posts (user_id, content) VALUES (?, ?)',
            [userId, content]
        );
        console.log('Post inserted with ID:', result.insertId);
        
        // Get the newly created post with user info (without profile_picture field)
        const [post] = await db.execute(
            `SELECT 
                p.id, 
                p.content, 
                p.created_at, 
                u.id as user_id, 
                u.username,
                0 as likes,
                0 as dislikes,
                0 as net_votes,
                NULL as user_reaction
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?`,
            [result.insertId]
        );
        
        console.log('Fetched new post details:', post[0] ? 'Success' : 'Failed');
        
        res.status(201).json({
            success: true,
            data: post[0]
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// POST a reaction to a post
router.post('/posts/:postId/react', [
    authenticateUser,
    body('reaction').isIn(['like', 'dislike']).withMessage('Reaction must be either like or dislike')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        
        const { postId } = req.params;
        const { reaction } = req.body;
        const userId = req.user.id;
        
        // Check if post exists
        const [postResult] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        // Check if user has already reacted to this post
        const [existingReaction] = await db.execute(
            'SELECT id, reaction_type FROM post_reactions WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );
        
        let result;
        
        if (existingReaction.length > 0) {
            if (existingReaction[0].reaction_type === reaction) {
                // If same reaction, remove it
                await db.execute(
                    'DELETE FROM post_reactions WHERE id = ?',
                    [existingReaction[0].id]
                );
            } else {
                // If different reaction, update it
                await db.execute(
                    'UPDATE post_reactions SET reaction_type = ? WHERE id = ?',
                    [reaction, existingReaction[0].id]
                );
            }
        } else {
            // If no existing reaction, create new one
            await db.execute(
                'INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
                [postId, userId, reaction]
            );
        }
        
        // Get updated reaction counts
        const [updatedPost] = await db.execute(
            `SELECT 
                COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as likes,
                COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as dislikes,
                (COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) - 
                 COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END)) as net_votes,
                MAX(CASE WHEN user_id = ? THEN reaction_type ELSE NULL END) as user_reaction
            FROM post_reactions
            WHERE post_id = ?`,
            [userId, postId]
        );
        
        res.status(200).json({
            success: true,
            data: {
                postId,
                ...updatedPost[0]
            }
        });
    } catch (error) {
        console.error('Error reacting to post:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete a post (only the post author can delete)
router.delete('/posts/:postId', authenticateUser, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;
        
        // Check if post exists and belongs to the user
        const [postResult] = await db.execute(
            'SELECT id FROM posts WHERE id = ? AND user_id = ?',
            [postId, userId]
        );
        
        if (postResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found or you do not have permission to delete it'
            });
        }
        
        // Delete the post (reactions will cascade delete due to foreign key)
        await db.execute('DELETE FROM posts WHERE id = ?', [postId]);
        
        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
