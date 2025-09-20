const express = require('express');
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(isAdmin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Get total users count
        const [usersResult] = await db.execute('SELECT COUNT(*) as count FROM users');
        const totalUsers = usersResult[0].count;
        
        // Get active competitions count
        const [competitionsResult] = await db.execute(
            'SELECT COUNT(*) as count FROM contests WHERE end_time > NOW()'
        );
        const activeCompetitions = competitionsResult[0].count;
        
        // Get total problems count
        const [problemsResult] = await db.execute('SELECT COUNT(*) as count FROM problems');
        const totalProblems = problemsResult[0].count;
        
        res.json({
            success: true,
            totalUsers,
            activeCompetitions,
            totalProblems
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
});

// Get recent activity
router.get('/activity', async (req, res) => {
    try {
        // Get recent activity from existing tables instead of non-existent activity_log
        const [recentSubmissions] = await db.execute(`
            SELECT 
                u.username,
                CASE 
                    WHEN s.status = 'Accepted' THEN 'Problem Solved'
                    WHEN s.status = 'Wrong Answer' THEN 'Attempted Problem'
                    WHEN s.status = 'Compilation Error' THEN 'Compilation Error'
                    ELSE 'Code Submitted'
                END as action,
                s.created_at as timestamp
            FROM submissions s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 5
        `);
        
        // Get recent user registrations
        const [recentUsers] = await db.execute(`
            SELECT 
                username,
                'User Registered' as action,
                created_at as timestamp
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        // Get recent posts from geek feed
        const [recentPosts] = await db.execute(`
            SELECT 
                u.username,
                'Posted in Geek Feed' as action,
                p.created_at as timestamp
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 5
        `);
        
        // Combine all activities and sort by timestamp
        const allActivities = [
            ...recentSubmissions,
            ...recentUsers,
            ...recentPosts
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .slice(0, 10);
        
        res.json({
            success: true,
            activities: allActivities
        });
    } catch (error) {
        console.error('Error fetching admin activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent activity'
        });
    }
});

// Get all users (with pagination)
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get users with pagination
        const [usersResult] = await db.execute(`
            SELECT id, username, email, role, rating, rank_label, created_at
            FROM users
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        // Get total count for pagination
        const [countResult] = await db.execute('SELECT COUNT(*) as count FROM users');
        const totalUsers = countResult[0].count;
        
        res.json({
            success: true,
            users: usersResult,
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// Get all problems (with pagination)
router.get('/problems', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get problems with pagination
        const [problemsResult] = await db.execute(`
            SELECT id, title, difficulty, category, solved_count, created_at
            FROM problems
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        // Get total count for pagination
        const [countResult] = await db.execute('SELECT COUNT(*) as count FROM problems');
        const totalProblems = countResult[0].count;
        
        res.json({
            success: true,
            problems: problemsResult,
            pagination: {
                page,
                limit,
                totalProblems,
                totalPages: Math.ceil(totalProblems / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch problems'
        });
    }
});

// Get all competitions (with pagination)
router.get('/competitions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get competitions with pagination
        const [competitionsResult] = await db.execute(`
            SELECT c.id, c.title, c.start_time, c.end_time, c.visibility,
                   u.username as created_by_name, 
                   (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count
            FROM contests c
            LEFT JOIN users u ON c.created_by = u.id
            ORDER BY c.start_time DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        // Get total count for pagination
        const [countResult] = await db.execute('SELECT COUNT(*) as count FROM contests');
        const totalCompetitions = countResult[0].count;
        
        res.json({
            success: true,
            competitions: competitionsResult,
            pagination: {
                page,
                limit,
                totalCompetitions,
                totalPages: Math.ceil(totalCompetitions / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch competitions'
        });
    }
});

module.exports = router;