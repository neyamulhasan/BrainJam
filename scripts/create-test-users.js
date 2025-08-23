const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
    try {
        console.log('Creating additional test users for ranking demonstration...');

        // Create multiple test users with different ratings
        const testUsers = [
            { username: 'CodeMaster_2025', email: 'codemaster@example.com', rating: 2100, rank: 'Legendary General' },
            { username: 'AlgoNinja', email: 'algoninja@example.com', rating: 2050, rank: 'Legendary General' },
            { username: 'DevWarrior', email: 'devwarrior@example.com', rating: 1950, rank: 'Algorithm Captain' },
            { username: 'ByteBeast', email: 'bytebeast@example.com', rating: 1900, rank: 'Algorithm Captain' },
            { username: 'CodingAce', email: 'codingace@example.com', rating: 1875, rank: 'Algorithm Captain' },
            { username: 'techguru123', email: 'techguru@example.com', rating: 1860, rank: 'Algorithm Captain' },
            { username: 'programmerpro', email: 'programmerpro@example.com', rating: 1840, rank: 'Algorithm Captain' },
            { username: 'ScriptSage', email: 'scriptsage@example.com', rating: 1820, rank: 'Tech Lieutenant' },
            { username: 'LogicLord', email: 'logiclord@example.com', rating: 1800, rank: 'Tech Lieutenant' },
            { username: 'DataDriven', email: 'datadriven@example.com', rating: 1780, rank: 'Tech Lieutenant' },
            { username: 'CodeCrusher', email: 'codecrusher@example.com', rating: 1750, rank: 'Tech Lieutenant' },
            { username: 'AlgoExpert', email: 'algoexpert@example.com', rating: 1720, rank: 'Tech Lieutenant' },
            { username: 'PythonPro', email: 'pythonpro@example.com', rating: 1680, rank: 'Tech Lieutenant' },
            { username: 'JavaJedi', email: 'javajedi@example.com', rating: 1650, rank: 'Tech Lieutenant' },
            { username: 'CppChampion', email: 'cppchampion@example.com', rating: 1600, rank: 'Code Corporal' },
            { username: 'JSWizard', email: 'jswizard@example.com', rating: 1550, rank: 'Code Corporal' },
            { username: 'WebDev101', email: 'webdev101@example.com', rating: 1500, rank: 'Code Corporal' },
            { username: 'newbie_coder', email: 'newbie@example.com', rating: 1200, rank: 'Code Corporal' },
            { username: 'learning_fast', email: 'learning@example.com', rating: 1000, rank: 'Cadet Coder' },
            { username: 'beginner_dev', email: 'beginner@example.com', rating: 850, rank: 'Private Recruit' }
        ];

        const passwordHash = await bcrypt.hash('password123', 10);

        for (const user of testUsers) {
            // Check if user already exists
            const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [user.username]);
            
            if (existing.length === 0) {
                // Insert user
                const [userResult] = await db.execute(`
                    INSERT INTO users (username, email, password_hash, rating, rank_label, avatar_url) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [user.username, user.email, passwordHash, user.rating, user.rank, '/images/default-avatar.svg']);

                const userId = userResult.insertId;

                // Insert user stats with some reasonable data
                await db.execute(`
                    INSERT INTO user_stats (user_id, solved_count, contest_count, win_count, streak_days, last_active_at) 
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [
                    userId, 
                    Math.floor(user.rating / 10), // problems solved based on rating
                    Math.floor(user.rating / 200), // contest count
                    Math.floor(user.rating / 300), // win count
                    Math.floor(Math.random() * 30) // random streak
                ]);

                // Add some rating history
                await db.execute(`
                    INSERT INTO rating_history (user_id, rating_before, rating_after, delta, reason, created_at) 
                    VALUES (?, ?, ?, ?, 'contest', DATE_SUB(NOW(), INTERVAL ? DAY))
                `, [userId, user.rating - 25, user.rating, 25, Math.floor(Math.random() * 7)]);

                console.log(`Created user: ${user.username} (Rating: ${user.rating})`);
            } else {
                console.log(`User ${user.username} already exists, skipping...`);
            }
        }

        console.log('Test users creation completed!');
        
        // Show current leaderboard
        const [leaderboard] = await db.execute(`
            SELECT username, rating, rank_label,
                   DENSE_RANK() OVER (ORDER BY rating DESC) as position
            FROM users 
            ORDER BY rating DESC 
            LIMIT 10
        `);

        console.log('\nCurrent Top 10 Leaderboard:');
        leaderboard.forEach(user => {
            console.log(`#${user.position} ${user.username} - ${user.rating} (${user.rank_label})`);
        });

    } catch (error) {
        console.error('Error creating test users:', error);
    }
}

module.exports = { createTestUsers };
