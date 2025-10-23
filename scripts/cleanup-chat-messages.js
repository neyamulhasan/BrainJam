const db = require('../config/database');

async function cleanupOldMessages() {
    try {
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
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

cleanupOldMessages();