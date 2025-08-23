const mysql = require('mysql2/promise');
require('dotenv').config();

// Create database connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'brain_jam',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createTestFriends() {
    try {
        console.log('Creating test friends data...\n');

        // Create some test users if they don't exist
        const testUsers = [
            { username: 'alice_coder', email: 'alice@test.com', rating: 1200, rank: 'Code Corporal' },
            { username: 'bob_solver', email: 'bob@test.com', rating: 950, rank: 'Cadet Coder' },
            { username: 'charlie_dev', email: 'charlie@test.com', rating: 1500, rank: 'Tech Lieutenant' },
            { username: 'diana_algo', email: 'diana@test.com', rating: 1800, rank: 'Algorithm Captain' },
            { username: 'eve_master', email: 'eve@test.com', rating: 2100, rank: 'Legendary General' }
        ];

        // Insert test users
        for (const user of testUsers) {
            try {
                await db.execute(
                    'INSERT IGNORE INTO users (username, email, password_hash, rating, rank_label) VALUES (?, ?, ?, ?, ?)',
                    [user.username, user.email, 'test_password', user.rating, user.rank]
                );
                console.log(`✅ Created user: ${user.username} (${user.rating} rating)`);
            } catch (error) {
                if (error.code !== 'ER_DUP_ENTRY') {
                    console.error(`❌ Error creating user ${user.username}:`, error.message);
                }
            }
        }

        // Get user IDs
        const [users] = await db.execute(
            'SELECT id, username FROM users WHERE username IN (?, ?, ?, ?, ?, ?)',
            ['qwerty', 'alice_coder', 'bob_solver', 'charlie_dev', 'diana_algo', 'eve_master']
        );

        const userMap = {};
        users.forEach(user => {
            userMap[user.username] = user.id;
        });

        console.log('\n📊 Available users:');
        users.forEach(user => {
            console.log(`- ${user.username} (ID: ${user.id})`);
        });

        // Create friendships for qwerty (assuming qwerty is the main test user)
        if (userMap.qwerty) {
            const friendships = [
                [userMap.qwerty, userMap.alice_coder],
                [userMap.qwerty, userMap.bob_solver],
                [userMap.qwerty, userMap.charlie_dev]
            ];

            console.log('\n🤝 Creating friendships...');
            for (const [userId, friendId] of friendships) {
                if (userId && friendId) {
                    try {
                        // Insert friendship (bidirectional relationships)
                        await db.execute(
                            'INSERT IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)',
                            [userId, friendId]
                        );
                        
                        const usernames = users.filter(u => u.id === userId || u.id === friendId).map(u => u.username);
                        console.log(`✅ Added friendship: ${usernames[0]} ↔ ${usernames[1]}`);
                    } catch (error) {
                        if (error.code !== 'ER_DUP_ENTRY') {
                            console.error(`❌ Error creating friendship:`, error.message);
                        }
                    }
                }
            }

            // Update user_stats for test users
            console.log('\n📈 Updating user stats...');
            for (const user of testUsers) {
                if (userMap[user.username]) {
                    await db.execute(
                        'INSERT INTO user_stats (user_id, solved_count, contest_count, win_count, streak_days) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE solved_count = VALUES(solved_count), contest_count = VALUES(contest_count), win_count = VALUES(win_count), streak_days = VALUES(streak_days)',
                        [userMap[user.username], Math.floor(Math.random() * 50) + 10, Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 5), Math.floor(Math.random() * 30) + 1]
                    );
                    console.log(`✅ Updated stats for ${user.username}`);
                }
            }

            console.log('\n🎉 Test friends data created successfully!');
            console.log('\nNow you can:');
            console.log('1. Go to http://localhost:3001/dashboard.html');
            console.log('2. Click on the "Friends" tab in the leaderboard');
            console.log('3. See your friends ranked by rating');
            console.log('4. Use "Add Friend" to search and add more friends');
            
        } else {
            console.log('❌ User "qwerty" not found. Please create this user first or use a different username.');
        }

    } catch (error) {
        console.error('❌ Error creating test friends:', error);
    } finally {
        await db.end();
    }
}

createTestFriends();
