const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Utility function to determine rank based on rating
function getRankFromRating(rating) {
    if (rating >= 2200) return 'Legendary General';
    if (rating >= 1800) return 'Algorithm Captain';
    if (rating >= 1500) return 'Tech Lieutenant';
    if (rating >= 1200) return 'Code Corporal';
    if (rating >= 900) return 'Cadet Coder';
    return 'Private Recruit';
}

// Utility function to update user rank based on current rating
async function updateUserRank(userId) {
    try {
        // Get current user rating
        const [userRows] = await db.execute(
            'SELECT rating, rank_label FROM users WHERE id = ?',
            [userId]
        );
        
        if (userRows.length === 0) return false;
        
        const currentRating = userRows[0].rating;
        const currentRank = userRows[0].rank_label;
        const newRank = getRankFromRating(currentRating);
        
        // Update rank if it has changed
        if (currentRank !== newRank) {
            await db.execute(
                'UPDATE users SET rank_label = ? WHERE id = ?',
                [newRank, userId]
            );
            console.log(`Updated user ${userId} rank from ${currentRank} to ${newRank} (rating: ${currentRating})`);
            return { changed: true, oldRank: currentRank, newRank, rating: currentRating };
        }
        
        return { changed: false, rank: currentRank, rating: currentRating };
    } catch (error) {
        console.error('Error updating user rank:', error);
        return false;
    }
}

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    // For simplicity, using user data from localStorage
    // In production, verify JWT token
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
    }
    
    req.user = { id: parseInt(userId) };
    next();
};

// Get user profile and progress
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Update user rank based on current rating
        await updateUserRank(userId);
        
        // Get user basic info with user stats
        const [userRows] = await db.execute(`
            SELECT u.username, u.rank_label, u.rating, u.avatar_url, u.created_at,
                   us.solved_count, us.contest_count, us.win_count, us.streak_days
            FROM users u
            LEFT JOIN user_stats us ON u.id = us.user_id
            WHERE u.id = ?
        `, [userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userRows[0];
        
        // Calculate rank progression
        const rankProgression = {
            'Private Recruit': { threshold: 0, next: 'Cadet Coder', nextThreshold: 900 },
            'Cadet Coder': { threshold: 900, next: 'Code Corporal', nextThreshold: 1200 },
            'Code Corporal': { threshold: 1200, next: 'Tech Lieutenant', nextThreshold: 1500 },
            'Tech Lieutenant': { threshold: 1500, next: 'Algorithm Captain', nextThreshold: 1800 },
            'Algorithm Captain': { threshold: 1800, next: 'Legendary General', nextThreshold: 2200 },
            'Legendary General': { threshold: 2200, next: 'Max Rank', nextThreshold: 2500 }
        };
        
        const currentRank = user.rank_label;
        const progression = rankProgression[currentRank] || rankProgression['Private Recruit'];
        
        // Get global rank with proper tie handling
        const [rankRows] = await db.execute(`
            SELECT 
                (SELECT COUNT(DISTINCT rating) FROM users WHERE rating > ?) + 1 as global_rank,
                (SELECT COUNT(*) FROM users WHERE rating > ?) as users_ahead,
                (SELECT COUNT(*) FROM users WHERE rating = ?) as users_same_rating,
                (SELECT COUNT(*) FROM users) as total_users
            FROM dual
        `, [user.rating, user.rating, user.rating]);
        
        const rankInfo = rankRows[0];
        
        res.json({
            name: user.username,
            rank: currentRank,
            rating: user.rating,
            avatar: user.avatar_url || '/images/default-avatar.svg',
            currentPoints: user.rating,
            nextRank: progression.next,
            nextRankPoints: progression.nextThreshold,
            progressPercent: Math.min(100, ((user.rating - progression.threshold) / (progression.nextThreshold - progression.threshold)) * 100),
            globalRank: rankInfo.global_rank,
            usersAhead: rankInfo.users_ahead,
            usersSameRating: rankInfo.users_same_rating,
            totalUsers: rankInfo.total_users,
            memberSince: new Date(user.created_at).getFullYear(),
            solvedCount: user.solved_count || 0,
            contestCount: user.contest_count || 0,
            winCount: user.win_count || 0,
            streakDays: user.streak_days || 0
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get match history (using rating history and contest data)
router.get('/matches', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get actual match history from rating_history with contest details
        const [matches] = await db.execute(`
            SELECT 
                DATE_FORMAT(rh.created_at, '%Y-%m-%d') as date,
                CASE 
                    WHEN c.title IS NOT NULL THEN c.title
                    WHEN rh.reason = 'contest' THEN CONCAT('Contest #', rh.contest_id)
                    WHEN rh.reason = 'problem_solve' THEN 'Problem Practice'
                    ELSE 'Rating Update'
                END as opponent,
                CASE 
                    WHEN rh.delta > 0 THEN 'Win'
                    WHEN rh.delta < 0 THEN 'Loss'
                    ELSE 'Draw'
                END as result,
                rh.delta as ratingChange,
                rh.rating_before,
                rh.rating_after,
                rh.reason,
                rh.created_at
            FROM rating_history rh
            LEFT JOIN contests c ON rh.contest_id = c.id
            WHERE rh.user_id = ?
            ORDER BY rh.created_at DESC
            LIMIT 10
        `, [userId]);
        
        // Format the response
        const formattedMatches = matches.map(match => ({
            date: match.date,
            opponent: match.opponent,
            result: match.result,
            ratingChange: match.ratingChange > 0 ? `+${match.ratingChange}` : match.ratingChange.toString(),
            ratingBefore: match.rating_before,
            ratingAfter: match.rating_after,
            type: match.reason
        }));
        
        res.json(formattedMatches);
    } catch (error) {
        console.error('Matches fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user statistics
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get comprehensive statistics from multiple tables
        const [statsRows] = await db.execute(`
            SELECT us.solved_count, us.contest_count, us.win_count, us.streak_days
            FROM user_stats us WHERE us.user_id = ?
        `, [userId]);
        
        const stats = statsRows[0] || { solved_count: 0, contest_count: 0, win_count: 0, streak_days: 0 };
        
        // Get languages used with problem counts
        const [languageRows] = await db.execute(`
            SELECT l.name, COUNT(DISTINCT s.problem_id) as solved_count
            FROM submissions s 
            JOIN languages l ON s.language_id = l.id 
            WHERE s.user_id = ? AND s.status = 'Accepted'
            GROUP BY l.id, l.name
            ORDER BY solved_count DESC
        `, [userId]);
        
        // Get average solve time from accepted submissions
        const [timeRows] = await db.execute(`
            SELECT AVG(execution_time_ms) as avg_time_ms, COUNT(*) as total_submissions
            FROM submissions 
            WHERE user_id = ? AND status = 'Accepted' AND execution_time_ms IS NOT NULL
        `, [userId]);
        
        // Get difficulty breakdown
        const [difficultyRows] = await db.execute(`
            SELECT p.difficulty, COUNT(DISTINCT s.problem_id) as solved_count
            FROM submissions s
            JOIN problems p ON s.problem_id = p.id
            WHERE s.user_id = ? AND s.status = 'Accepted'
            GROUP BY p.difficulty
        `, [userId]);
        
        // Get recent activity count
        const [recentRows] = await db.execute(`
            SELECT COUNT(*) as recent_submissions
            FROM submissions 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `, [userId]);
        
        // Get contest performance
        const [contestPerformance] = await db.execute(`
            SELECT 
                AVG(cs.rank) as avg_rank,
                COUNT(*) as participated_contests,
                SUM(CASE WHEN cs.rank <= 3 THEN 1 ELSE 0 END) as top3_finishes
            FROM contest_scores cs
            WHERE cs.user_id = ?
        `, [userId]);
        
        const avgTimeMs = timeRows[0]?.avg_time_ms || 0;
        const avgTimeMinutes = Math.round(avgTimeMs / 1000 / 60);
        
        // Prepare language statistics
        const solvedByLanguage = {};
        languageRows.forEach(row => {
            solvedByLanguage[row.name] = row.solved_count;
        });
        
        // Prepare difficulty breakdown
        const difficultyBreakdown = {};
        difficultyRows.forEach(row => {
            difficultyBreakdown[row.difficulty] = row.solved_count;
        });
        
        res.json({
            problemsSolved: stats.solved_count,
            languagesUsed: languageRows.length,
            avgSolveTime: avgTimeMinutes > 0 ? `${avgTimeMinutes} min` : 'N/A',
            solvedByLanguage,
            difficultyBreakdown,
            contestCount: stats.contest_count,
            winCount: stats.win_count,
            streakDays: stats.streak_days,
            totalSubmissions: timeRows[0]?.total_submissions || 0,
            recentActivity: recentRows[0]?.recent_submissions || 0,
            avgContestRank: contestPerformance[0]?.avg_rank ? Math.round(contestPerformance[0].avg_rank) : null,
            top3Finishes: contestPerformance[0]?.top3_finishes || 0
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user achievements
router.get('/achievements', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [badges] = await db.execute(`
            SELECT b.name, b.description, b.code, ub.earned_at
            FROM user_badges ub 
            JOIN badges b ON ub.badge_id = b.id 
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        `, [userId]);
        
        res.json(badges);
    } catch (error) {
        console.error('Achievements fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent activity
router.get('/activity', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get recent submissions with problem details
        const [recentSubmissions] = await db.execute(`
            SELECT 
                s.created_at,
                s.status,
                s.execution_time_ms,
                p.title as problem_title,
                p.difficulty,
                l.name as language_name,
                c.title as contest_title
            FROM submissions s
            JOIN problems p ON s.problem_id = p.id
            JOIN languages l ON s.language_id = l.id
            LEFT JOIN contests c ON s.contest_id = c.id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
            LIMIT 10
        `, [userId]);
        
        // Get recent contest participations
        const [recentContests] = await db.execute(`
            SELECT 
                c.title,
                c.start_time,
                c.end_time,
                cp.joined_at,
                cs.rank,
                cs.score
            FROM contest_participants cp
            JOIN contests c ON cp.contest_id = c.id
            LEFT JOIN contest_scores cs ON cp.contest_id = cs.contest_id AND cp.user_id = cs.user_id
            WHERE cp.user_id = ?
            ORDER BY cp.joined_at DESC
            LIMIT 5
        `, [userId]);
        
        // Get recent badges earned
        const [recentBadges] = await db.execute(`
            SELECT 
                b.name,
                b.description,
                ub.earned_at
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
            LIMIT 3
        `, [userId]);
        
        res.json({
            submissions: recentSubmissions,
            contests: recentContests,
            badges: recentBadges
        });
    } catch (error) {
        console.error('Activity fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get leaderboard data
router.get('/leaderboard', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get top users globally with proper ranking (handles ties)
        const [topUsers] = await db.execute(`
            SELECT 
                username,
                rating,
                rank_label,
                avatar_url,
                DENSE_RANK() OVER (ORDER BY rating DESC) as position,
                ROW_NUMBER() OVER (ORDER BY rating DESC, created_at ASC) as display_order
            FROM users
            ORDER BY rating DESC, created_at ASC
            LIMIT 15
        `, []);
        
        // Get user's exact position and context
        const [userRankInfo] = await db.execute(`
            WITH ranked_users AS (
                SELECT 
                    id,
                    username,
                    rating,
                    rank_label,
                    avatar_url,
                    DENSE_RANK() OVER (ORDER BY rating DESC) as position,
                    ROW_NUMBER() OVER (ORDER BY rating DESC, created_at ASC) as display_order
                FROM users
            )
            SELECT 
                position,
                display_order,
                username,
                rating,
                rank_label,
                avatar_url,
                (SELECT COUNT(*) FROM users WHERE rating > (SELECT rating FROM users WHERE id = ?)) as users_ahead,
                (SELECT COUNT(*) FROM users WHERE rating = (SELECT rating FROM users WHERE id = ?)) as users_same_rating
            FROM ranked_users
            WHERE id = ?
        `, [userId, userId, userId]);
        
        const userRank = userRankInfo[0];
        
        // If user is not in top 15, get users around their rank
        let contextUsers = [];
        if (userRank && userRank.position > 15) {
            const [nearbyUsers] = await db.execute(`
                WITH ranked_users AS (
                    SELECT 
                        username,
                        rating,
                        rank_label,
                        avatar_url,
                        DENSE_RANK() OVER (ORDER BY rating DESC) as position,
                        ROW_NUMBER() OVER (ORDER BY rating DESC, created_at ASC) as display_order
                    FROM users
                )
                SELECT * FROM ranked_users
                WHERE display_order BETWEEN ? AND ?
                ORDER BY display_order
            `, [Math.max(1, userRank.display_order - 2), userRank.display_order + 2]);
            
            contextUsers = nearbyUsers;
        }
        
        res.json({
            topUsers: topUsers.map(user => ({
                username: user.username,
                rating: user.rating,
                rank: user.rank_label,
                avatar: user.avatar_url || '/images/default-avatar.svg',
                position: user.position,
                displayOrder: user.display_order
            })),
            currentUser: userRank ? {
                username: userRank.username,
                rating: userRank.rating,
                rank_label: userRank.rank_label,
                avatar_url: userRank.avatar_url || '/images/default-avatar.svg',
                position: userRank.position,
                displayOrder: userRank.display_order,
                usersAhead: userRank.users_ahead,
                usersSameRating: userRank.users_same_rating
            } : null,
            contextUsers: contextUsers.map(user => ({
                username: user.username,
                rating: user.rating,
                rank: user.rank_label,
                avatar: user.avatar_url || '/images/default-avatar.svg',
                position: user.position,
                displayOrder: user.display_order
            }))
        });
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get starred users leaderboard
router.get('/leaderboard/starred', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get starred users leaderboard including the current user
        const [starredLeaderboard] = await db.execute(`
            SELECT 
                u.id,
                u.username,
                u.rating,
                u.rank_label,
                u.avatar_url,
                DENSE_RANK() OVER (ORDER BY u.rating DESC) as position,
                ROW_NUMBER() OVER (ORDER BY u.rating DESC, u.created_at ASC) as display_order,
                CASE WHEN u.id = ? THEN 1 ELSE 0 END as is_current_user
            FROM users u
            WHERE u.id = ? 
               OR u.id IN (
                   SELECT f.friend_id FROM friends f WHERE f.user_id = ?
                   UNION
                   SELECT f.user_id FROM friends f WHERE f.friend_id = ?
               )
            ORDER BY u.rating DESC, u.created_at ASC
        `, [userId, userId, userId, userId]);
        
        // Get starred users count
        const [starredCount] = await db.execute(`
            SELECT COUNT(*) as total_starred
            FROM (
                SELECT f.friend_id as starred FROM friends f WHERE f.user_id = ?
                UNION
                SELECT f.user_id as starred FROM friends f WHERE f.friend_id = ?
            ) as all_starred
        `, [userId, userId]);

        res.json({
            starred: starredLeaderboard.map(user => ({
                id: user.id,
                username: user.username,
                rating: user.rating,
                rank: user.rank_label,
                avatar: user.avatar_url || '/images/default-avatar.svg',
                position: user.position,
                displayOrder: user.display_order,
                isCurrentUser: user.is_current_user === 1
            })),
            totalStarred: starredCount[0].total_starred,
            currentUserIncluded: starredLeaderboard.some(user => user.id === userId)
        });
    } catch (error) {
        console.error('Starred users leaderboard fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add/Remove starred user
router.post('/starred/:action/:targetUserId', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, targetUserId } = req.params;
        const targetId = parseInt(targetUserId);

        if (userId === targetId) {
            return res.status(400).json({ error: 'Cannot star yourself' });
        }

        // Check if target user exists
        const [targetUser] = await db.execute('SELECT id, username FROM users WHERE id = ?', [targetId]);
        if (targetUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (action === 'add') {
            // Check if already starred
            const [existingStarred] = await db.execute(
                'SELECT 1 FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, targetId, targetId, userId]
            );

            if (existingStarred.length > 0) {
                return res.status(400).json({ error: 'User already starred' });
            }

            // Add starred user (bidirectional)
            await db.execute('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [userId, targetId]);
            
            res.json({ 
                success: true, 
                message: `Starred ${targetUser[0].username}`,
                action: 'starred'
            });

        } else if (action === 'remove') {
            // Remove starred user (bidirectional)
            await db.execute(
                'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, targetId, targetId, userId]
            );
            
            res.json({ 
                success: true, 
                message: `Unstarred ${targetUser[0].username}`,
                action: 'unstarred'
            });
        } else {
            return res.status(400).json({ error: 'Invalid action. Use add or remove' });
        }

    } catch (error) {
        console.error('Starred user action error:', error);
        res.status(500).json({ error: 'Failed to update starred user status' });
    }
});

// Search users for starring
router.get('/users/search', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        // Search users by username, excluding current user and existing starred users
        const [users] = await db.execute(`
            SELECT 
                u.id,
                u.username,
                u.rating,
                u.rank_label,
                u.avatar_url,
                CASE WHEN f.user_id IS NOT NULL THEN 1 ELSE 0 END as is_starred
            FROM users u
            LEFT JOIN (
                SELECT friend_id as user_id FROM friends WHERE user_id = ?
                UNION
                SELECT user_id FROM friends WHERE friend_id = ?
            ) f ON u.id = f.user_id
            WHERE u.username LIKE ? AND u.id != ?
            ORDER BY 
                is_starred ASC,
                u.rating DESC,
                u.username ASC
            LIMIT 20
        `, [userId, userId, `%${q}%`, userId]);

        res.json({
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                rating: user.rating,
                rank: user.rank_label,
                avatar: user.avatar_url || '/images/default-avatar.svg',
                isStarred: user.is_starred === 1
            })),
            query: q
        });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, avatar_url } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email is already taken by another user
        const [existingUser] = await db.execute(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email is already taken' });
        }

        // Validate avatar URL if provided
        if (avatar_url && avatar_url.trim() !== '') {
            const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
            if (!urlRegex.test(avatar_url)) {
                return res.status(400).json({ error: 'Invalid image URL format. Please use a valid image URL ending with .jpg, .jpeg, .png, .gif, or .webp' });
            }
        }

        // Update user profile
        await db.execute(
            'UPDATE users SET email = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [email, avatar_url || null, userId]
        );

        // Get updated user data
        const [updatedUser] = await db.execute(
            'SELECT email, avatar_url FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                email: updatedUser[0].email,
                avatar_url: updatedUser[0].avatar_url || '/images/default-avatar.svg'
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user email for edit profile form
router.get('/profile/email', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [userRows] = await db.execute(
            'SELECT email, avatar_url FROM users WHERE id = ?',
            [userId]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            email: userRows[0].email,
            avatar_url: userRows[0].avatar_url
        });
        
    } catch (error) {
        console.error('Profile email fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile data' });
    }
});

// DEMO: Simulate solving a problem (for testing ranking system)
router.post('/simulate-solve', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { ratingIncrease = 50 } = req.body;

        // Get current user data
        const [userRows] = await db.execute(
            'SELECT username, rating, rank_label FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRows[0];
        const oldRating = user.rating;
        const oldRank = user.rank_label;
        const newRating = oldRating + parseInt(ratingIncrease);
        const newRank = getRankFromRating(newRating);

        // Update user rating
        await db.execute(
            'UPDATE users SET rating = ? WHERE id = ?',
            [newRating, userId]
        );

        // Update rank (this will be done automatically by updateUserRank)
        const rankUpdate = await updateUserRank(userId);

        // Add to rating history
        await db.execute(
            'INSERT INTO rating_history (user_id, rating_before, rating_after, delta, reason) VALUES (?, ?, ?, ?, ?)',
            [userId, oldRating, newRating, ratingIncrease, 'problem_solve']
        );

        const promoted = oldRank !== newRank;

        res.json({
            success: true,
            username: user.username,
            oldRating,
            newRating,
            ratingIncrease: parseInt(ratingIncrease),
            oldRank,
            newRank,
            promoted,
            message: promoted 
                ? `Congratulations! You've been promoted from ${oldRank} to ${newRank}!`
                : `Rating increased! You're still a ${newRank}.`
        });

    } catch (error) {
        console.error('Error simulating problem solve:', error);
        res.status(500).json({ error: 'Failed to simulate problem solve' });
    }
});

module.exports = router;
