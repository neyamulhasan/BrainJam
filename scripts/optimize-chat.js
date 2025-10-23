const db = require('../config/database');

async function optimizeChat() {
    try {
        // Keep only last 100 messages to reduce database size
        const cleanupQuery = `
            DELETE FROM chat_messages 
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM chat_messages 
                    ORDER BY created_at DESC 
                    LIMIT 100
                ) AS keep_messages
            )
        `;
        
        const [result] = await db.execute(cleanupQuery);
        // Add index if not exists
        try {
            await db.execute(`
                CREATE INDEX IF NOT EXISTS idx_chat_recent 
                ON chat_messages (created_at DESC, id DESC)
            `);
        } catch (error) {
        }
        
        // Optimize table
        await db.execute('OPTIMIZE TABLE chat_messages');
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

optimizeChat();