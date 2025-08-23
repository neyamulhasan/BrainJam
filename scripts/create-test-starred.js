const mysql = require('mysql2/promise');

async function createTestStarredUsers() {
    try {
        console.log('Creating test starred users...');
        
        // Create database connection with proper credentials
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'brain_jam',
            port: process.env.DB_PORT || 3306
        });
        
        // Get qwerty user ID (assuming qwerty exists)
        const [qwertyUser] = await connection.execute(
            'SELECT id FROM users WHERE username = ?', 
            ['qwerty']
        );
        
        if (qwertyUser.length === 0) {
            console.log('Qwerty user not found! Creating...');
            await connection.execute(
                'INSERT INTO users (username, email, password_hash, rating) VALUES (?, ?, ?, ?)',
                ['qwerty', 'qwerty@example.com', 'hashedpassword', 1250]
            );
            
            const [newQwertyUser] = await connection.execute(
                'SELECT id FROM users WHERE username = ?', 
                ['qwerty']
            );
            
            qwertyUserId = newQwertyUser[0].id;
        } else {
            qwertyUserId = qwertyUser[0].id;
        }
        
        console.log(`Qwerty user ID: ${qwertyUserId}`);
        
        // Create test users with varying ratings
        const testUsers = [
            { username: 'staruser1', email: 'star1@example.com', rating: 2100 },
            { username: 'staruser2', email: 'star2@example.com', rating: 1850 },
            { username: 'staruser3', email: 'star3@example.com', rating: 1600 },
            { username: 'staruser4', email: 'star4@example.com', rating: 1200 },
            { username: 'staruser5', email: 'star5@example.com', rating: 950 }
        ];
        
        const testUserIds = [];
        
        for (const user of testUsers) {
            // Check if user already exists
            const [existingUser] = await connection.execute(
                'SELECT id FROM users WHERE username = ?', 
                [user.username]
            );
            
            if (existingUser.length === 0) {
                // Create new user
                const [result] = await connection.execute(
                    'INSERT INTO users (username, email, password_hash, rating, rank_label) VALUES (?, ?, ?, ?, ?)',
                    [user.username, user.email, 'hashedpassword', user.rating, getRankFromRating(user.rating)]
                );
                testUserIds.push(result.insertId);
                console.log(`Created user: ${user.username} (ID: ${result.insertId}, Rating: ${user.rating})`);
            } else {
                // Update existing user's rating
                await connection.execute(
                    'UPDATE users SET rating = ?, rank_label = ? WHERE id = ?',
                    [user.rating, getRankFromRating(user.rating), existingUser[0].id]
                );
                testUserIds.push(existingUser[0].id);
                console.log(`Updated user: ${user.username} (ID: ${existingUser[0].id}, Rating: ${user.rating})`);
            }
        }
        
        // Clear existing starred relationships for qwerty
        await connection.execute(
            'DELETE FROM friends WHERE user_id = ? OR friend_id = ?',
            [qwertyUserId, qwertyUserId]
        );
        
        // Create starred relationships (add first 3 test users as qwerty's starred users)
        for (let i = 0; i < 3; i++) {
            await connection.execute(
                'INSERT INTO friends (user_id, friend_id, created_at) VALUES (?, ?, NOW())',
                [qwertyUserId, testUserIds[i]]
            );
            console.log(`Qwerty starred user: ${testUsers[i].username}`);
        }
        
        console.log('\n✅ Test starred users created successfully!');
        console.log('🌟 Qwerty now has 3 starred users');
        console.log('📊 5 test users with different ratings created');
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error creating test starred users:', error);
        process.exit(1);
    }
}

function getRankFromRating(rating) {
    if (rating >= 2000) return 'Legendary General';
    if (rating >= 1800) return 'Algorithm Captain';
    if (rating >= 1600) return 'Tech Lieutenant';
    if (rating >= 1400) return 'Code Corporal';
    if (rating >= 1200) return 'Cadet Coder';
    return 'Private Recruit';
}

// Run the script
createTestStarredUsers();
