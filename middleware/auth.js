const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET || 'brainjam-secret-key-2025', (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    error: 'Invalid token'
                });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        // Get user from database to verify role
        const [users] = await db.execute(
            'SELECT role FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = users[0];

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to verify admin permissions'
        });
    }
};

module.exports = { authenticateToken, isAdmin };