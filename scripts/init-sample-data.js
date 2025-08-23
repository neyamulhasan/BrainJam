const db = require('../config/database');

async function initializeSampleData() {
    try {
        console.log('Initializing sample data...');

        // Insert sample languages
        await db.execute(`
            INSERT IGNORE INTO languages (id, name, judge0_id, is_active) VALUES
            (1, 'Python', 71, 1),
            (2, 'Java', 62, 1),
            (3, 'C++', 54, 1),
            (4, 'JavaScript', 63, 1),
            (5, 'C', 50, 1)
        `);

        // Insert sample badges
        await db.execute(`
            INSERT IGNORE INTO badges (id, code, name, description) VALUES
            (1, 'first_solve', 'First Solver', 'Solved your first problem'),
            (2, 'speed_demon', 'Speed Demon', 'Solved 10 problems in under 5 minutes'),
            (3, 'multi_lang', 'Multi-Language Master', 'Used 3+ programming languages'),
            (4, 'contest_warrior', 'Contest Warrior', 'Participated in 5 contests'),
            (5, 'problem_crusher', 'Problem Crusher', 'Solved 100+ problems')
        `);

        // Check if test user exists
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE username = ?', ['testuser']);
        
        let userId;
        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
            console.log('Using existing test user with ID:', userId);
        } else {
            // Insert a test user
            const [result] = await db.execute(`
                INSERT INTO users (username, email, password_hash, rating, rank_label, avatar_url) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['testuser', 'test@example.com', '$2b$10$dummy_hash', 1850, 'Algorithm Captain', '/images/default-avatar.png']);
            
            userId = result.insertId;
            console.log('Created test user with ID:', userId);
        }

        // Insert user stats
        await db.execute(`
            INSERT INTO user_stats (user_id, solved_count, contest_count, win_count, streak_days, last_active_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            solved_count = VALUES(solved_count),
            contest_count = VALUES(contest_count),
            win_count = VALUES(win_count),
            streak_days = VALUES(streak_days),
            last_active_at = VALUES(last_active_at)
        `, [userId, 250, 15, 12, 7]);

        // Insert sample problems
        const [problemResult] = await db.execute(`
            INSERT IGNORE INTO problems (id, slug, title, body_md, difficulty, created_by) VALUES
            (1, 'two-sum', 'Two Sum', 'Find two numbers that add up to target', 'Easy', ${userId}),
            (2, 'reverse-string', 'Reverse String', 'Reverse a given string', 'Easy', ${userId}),
            (3, 'binary-search', 'Binary Search', 'Implement binary search algorithm', 'Medium', ${userId})
        `);

        // Insert sample submissions
        for (let i = 0; i < 120; i++) {
            await db.execute(`
                INSERT IGNORE INTO submissions (user_id, problem_id, language_id, source_code, status, execution_time_ms) 
                VALUES (?, ?, ?, ?, 'Accepted', ?)
            `, [userId, (i % 3) + 1, (i % 3) + 1, '// Sample code', Math.floor(Math.random() * 2000) + 100]);
        }

        // Insert Python submissions
        for (let i = 0; i < 80; i++) {
            await db.execute(`
                INSERT IGNORE INTO submissions (user_id, problem_id, language_id, source_code, status, execution_time_ms) 
                VALUES (?, ?, 2, ?, 'Accepted', ?)
            `, [userId, (i % 3) + 1, '# Java code', Math.floor(Math.random() * 2000) + 100]);
        }

        // Insert C++ submissions
        for (let i = 0; i < 50; i++) {
            await db.execute(`
                INSERT IGNORE INTO submissions (user_id, problem_id, language_id, source_code, status, execution_time_ms) 
                VALUES (?, ?, 3, ?, 'Accepted', ?)
            `, [userId, (i % 3) + 1, '// C++ code', Math.floor(Math.random() * 2000) + 100]);
        }

        // Insert sample contests
        await db.execute(`
            INSERT IGNORE INTO contests (id, title, description, start_time, end_time, created_by) VALUES
            (1, 'Weekly Contest 1', 'Weekly coding contest', '2024-07-20 10:00:00', '2024-07-20 12:00:00', ${userId}),
            (2, 'Weekly Contest 2', 'Weekly coding contest', '2024-07-21 10:00:00', '2024-07-21 12:00:00', ${userId}),
            (3, 'Weekly Contest 3', 'Weekly coding contest', '2024-07-22 10:00:00', '2024-07-22 12:00:00', ${userId})
        `);

        // Insert sample rating history
        await db.execute(`
            INSERT IGNORE INTO rating_history (user_id, contest_id, rating_before, rating_after, delta, created_at) VALUES
            (${userId}, 1, 1824, 1850, 26, '2024-07-26 12:00:00'),
            (${userId}, 2, 1835, 1820, -15, '2024-07-25 12:00:00'),
            (${userId}, 3, 1790, 1820, 30, '2024-07-24 12:00:00'),
            (${userId}, NULL, 1785, 1790, 5, '2024-07-23 12:00:00'),
            (${userId}, NULL, 1765, 1785, 20, '2024-07-22 12:00:00')
        `);

        // Insert user badges
        await db.execute(`
            INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES
            (${userId}, 1),
            (${userId}, 2),
            (${userId}, 3),
            (${userId}, 4),
            (${userId}, 5)
        `);

        console.log('Sample data initialized successfully!');
        console.log('Test user credentials:');
        console.log('Username: testuser');
        console.log('Email: test@example.com');
        console.log('User ID:', userId);

    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

module.exports = { initializeSampleData };
