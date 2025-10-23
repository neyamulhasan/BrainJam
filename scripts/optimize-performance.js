const db = require('../config/database');

async function optimizeDatabase() {
    try {
        // Clean up old chat messages (keep only last 500)
        const [result] = await db.execute(`
            DELETE FROM chat_messages 
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM chat_messages 
                    ORDER BY created_at DESC 
                    LIMIT 500
                ) AS keep_messages
            )
        `);
        // Add indexes for better performance if not exists
        try {
            await db.execute(`
                CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
                ON chat_messages (created_at DESC)
            `);
        } catch (e) {
        }
        
        try {
            await db.execute(`
                CREATE INDEX IF NOT EXISTS idx_chat_messages_user_time 
                ON chat_messages (user_id, created_at DESC)
            `);
        } catch (e) {
        }
        
        // Analyze table for better query planning
        await db.execute('ANALYZE TABLE chat_messages');
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

optimizeDatabase();