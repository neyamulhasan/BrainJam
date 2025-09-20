const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all published learning resources with categories and vote counts
router.get('/resources', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                lr.id,
                lr.title,
                lr.slug,
                lr.meta_description,
                lr.featured_image,
                lr.view_count,
                lr.estimated_read_time,
                lr.published_at,
                lc.name as category_name,
                lc.slug as category_slug,
                u.username as author_name,
                COALESCE(upvotes.count, 0) as upvotes,
                COALESCE(downvotes.count, 0) as downvotes
            FROM learning_resources lr
            JOIN learning_categories lc ON lr.category_id = lc.id
            JOIN users u ON lr.author_id = u.id
            LEFT JOIN (
                SELECT resource_id, COUNT(*) as count 
                FROM learning_resource_votes 
                WHERE vote_type = 'upvote' 
                GROUP BY resource_id
            ) upvotes ON lr.id = upvotes.resource_id
            LEFT JOIN (
                SELECT resource_id, COUNT(*) as count 
                FROM learning_resource_votes 
                WHERE vote_type = 'downvote' 
                GROUP BY resource_id
            ) downvotes ON lr.id = downvotes.resource_id
            WHERE lr.status = 'published'
        `;
        
        const queryParams = [];
        
        if (category) {
            query += ' AND lc.slug = ?';
            queryParams.push(category);
        }
        
        if (search) {
            query += ' AND (lr.title LIKE ? OR lr.content LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY lr.published_at DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));
        
        const [resources] = await db.execute(query, queryParams);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM learning_resources lr
            JOIN learning_categories lc ON lr.category_id = lc.id
            WHERE lr.status = 'published'
        `;
        
        const countParams = [];
        if (category) {
            countQuery += ' AND lc.slug = ?';
            countParams.push(category);
        }
        
        if (search) {
            countQuery += ' AND (lr.title LIKE ? OR lr.content LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        
        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            resources,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching learning resources:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch learning resources'
        });
    }
});

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await db.execute(`
            SELECT 
                lc.*,
                COUNT(lr.id) as resource_count
            FROM learning_categories lc
            LEFT JOIN learning_resources lr ON lc.id = lr.category_id AND lr.status = 'published'
            GROUP BY lc.id
            ORDER BY lc.name
        `);
        
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});

// Get a single resource by slug
router.get('/resources/:slug', async (req, res) => {
    try {
        const [resources] = await db.execute(`
            SELECT 
                lr.*,
                lc.name as category_name,
                lc.slug as category_slug,
                u.username as author_name,
                COALESCE(upvotes.count, 0) as upvotes,
                COALESCE(downvotes.count, 0) as downvotes
            FROM learning_resources lr
            JOIN learning_categories lc ON lr.category_id = lc.id
            JOIN users u ON lr.author_id = u.id
            LEFT JOIN (
                SELECT resource_id, COUNT(*) as count 
                FROM learning_resource_votes 
                WHERE vote_type = 'upvote' 
                GROUP BY resource_id
            ) upvotes ON lr.id = upvotes.resource_id
            LEFT JOIN (
                SELECT resource_id, COUNT(*) as count 
                FROM learning_resource_votes 
                WHERE vote_type = 'downvote' 
                GROUP BY resource_id
            ) downvotes ON lr.id = downvotes.resource_id
            WHERE lr.slug = ? AND lr.status = 'published'
        `, [req.params.slug]);
        
        if (resources.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }
        
        const resource = resources[0];
        
        // Get resource tags
        const [tags] = await db.execute(`
            SELECT tag FROM learning_resource_tags
            WHERE resource_id = ?
        `, [resource.id]);
        
        resource.tags = tags.map(t => t.tag);
        
        // Increment view count
        await db.execute(`
            UPDATE learning_resources 
            SET view_count = view_count + 1 
            WHERE id = ?
        `, [resource.id]);
        
        res.json({
            success: true,
            resource
        });
    } catch (error) {
        console.error('Error fetching learning resource:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch learning resource'
        });
    }
});

// Vote on a resource (requires authentication)
router.post('/resources/:id/vote', authenticateToken, async (req, res) => {
    try {
        const { vote_type } = req.body; // 'upvote' or 'downvote'
        const resource_id = req.params.id;
        const user_id = req.user.id;
        
        if (!['upvote', 'downvote'].includes(vote_type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid vote type'
            });
        }
        
        // Check if user already voted
        const [existingVote] = await db.execute(`
            SELECT * FROM learning_resource_votes
            WHERE resource_id = ? AND user_id = ?
        `, [resource_id, user_id]);
        
        if (existingVote.length > 0) {
            // Update existing vote
            await db.execute(`
                UPDATE learning_resource_votes
                SET vote_type = ?
                WHERE resource_id = ? AND user_id = ?
            `, [vote_type, resource_id, user_id]);
        } else {
            // Insert new vote
            await db.execute(`
                INSERT INTO learning_resource_votes (resource_id, user_id, vote_type)
                VALUES (?, ?, ?)
            `, [resource_id, user_id, vote_type]);
        }
        
        // Get updated vote counts
        const [votes] = await db.execute(`
            SELECT 
                SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE 0 END) as upvotes,
                SUM(CASE WHEN vote_type = 'downvote' THEN 1 ELSE 0 END) as downvotes
            FROM learning_resource_votes
            WHERE resource_id = ?
        `, [resource_id]);
        
        res.json({
            success: true,
            votes: votes[0] || { upvotes: 0, downvotes: 0 }
        });
    } catch (error) {
        console.error('Error voting on resource:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to vote on resource'
        });
    }
});

module.exports = router;