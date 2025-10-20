const db = require('../config/database');

async function cleanupOldMessages() {
    try {
        console.log('Cleaning up old chat messages...');
        
        // Keep only the last 1000 messages (you can adjust this number)
        const cleanupQuery = `
            DELETE FROM chat_messages 
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM chat_messages 
                    ORDER BY created_at DESC 
                    LIMIT 1000
                ) AS keep_messages
            )
        `;
        
        const [result] = await db.execute(cleanupQuery);
        console.log(`✅ Cleaned up ${result.affectedRows} old messages`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning up messages:', error);
        process.exit(1);
    }
}

cleanupOldMessages();