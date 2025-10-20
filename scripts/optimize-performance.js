const db = require('../config/database');

async function optimizeDatabase() {
    try {
        console.log('🔧 Optimizing database for better performance...');
        
        // Clean up old chat messages (keep only last 500)
        console.log('📝 Cleaning up old chat messages...');
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
        console.log(`✅ Cleaned up ${result.affectedRows} old messages`);
        
        // Add indexes for better performance if not exists
        console.log('📊 Checking database indexes...');
        
        try {
            await db.execute(`
                CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
                ON chat_messages (created_at DESC)
            `);
            console.log('✅ Chat messages timestamp index created/verified');
        } catch (e) {
            console.log('ℹ️  Chat messages timestamp index already exists');
        }
        
        try {
            await db.execute(`
                CREATE INDEX IF NOT EXISTS idx_chat_messages_user_time 
                ON chat_messages (user_id, created_at DESC)
            `);
            console.log('✅ Chat messages user-time index created/verified');
        } catch (e) {
            console.log('ℹ️  Chat messages user-time index already exists');
        }
        
        // Analyze table for better query planning
        await db.execute('ANALYZE TABLE chat_messages');
        console.log('✅ Table analysis completed');
        
        console.log('🚀 Database optimization completed successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error optimizing database:', error);
        process.exit(1);
    }
}

optimizeDatabase();