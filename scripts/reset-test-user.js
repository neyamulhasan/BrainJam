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

async function resetTestUser() {
    try {
        // Reset qwerty user to realistic starting values
        await db.execute(
            'UPDATE users SET rating = 800, rank_label = "Private Recruit" WHERE username = "qwerty"'
        );
        
        console.log('✅ Reset user qwerty to rating 800 (Private Recruit)');
        
        // Show current status
        const [users] = await db.execute(
            'SELECT username, rating, rank_label FROM users WHERE username = "qwerty"'
        );
        
        if (users.length > 0) {
            const user = users[0];
            console.log(`👤 ${user.username}: ${user.rating} rating (${user.rank_label})`);
        }
        
    } catch (error) {
        console.error('Error resetting user:', error);
    } finally {
        await db.end();
    }
}

resetTestUser();
