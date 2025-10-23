const db = require('../config/database');

async function createChatTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS chat_messages (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                user_id int(11) NOT NULL,
                message text NOT NULL,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (id),
                KEY user_id (user_id),
                KEY created_at (created_at),
                CONSTRAINT chat_messages_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await db.execute(createTableQuery);
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

createChatTable();