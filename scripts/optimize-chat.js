const db = require('../config/database');

async function optimizeChat() {
    try {
        console.log('🧹 Optimizing chat system for better performance...');
        
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
        console.log(`✅ Cleaned up ${result.affectedRows} old messages`);
        
        // Add index if not exists
        try {
            await db.execute(`
                CREATE INDEX IF NOT EXISTS idx_chat_recent 
                ON chat_messages (created_at DESC, id DESC)
            `);
            console.log('✅ Performance index created/verified');
        } catch (error) {
            console.log('ℹ️  Index already exists');
        }
        
        // Optimize table
        await db.execute('OPTIMIZE TABLE chat_messages');
        console.log('✅ Table optimized');
        
        console.log('🚀 Chat optimization completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error optimizing chat:', error);
        process.exit(1);
    }
}

optimizeChat();