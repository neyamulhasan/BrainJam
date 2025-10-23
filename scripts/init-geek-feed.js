const mysql = require('mysql2/promise');
require('dotenv').config();

const initGeekFeedDB = async () => {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        // Create posts table if not exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id int(11) NOT NULL AUTO_INCREMENT,
                user_id int(11) NOT NULL,
                content text NOT NULL,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                KEY user_id (user_id),
                CONSTRAINT posts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        // Create post_reactions table if not exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS post_reactions (
                id int(11) NOT NULL AUTO_INCREMENT,
                post_id int(11) NOT NULL,
                user_id int(11) NOT NULL,
                reaction_type enum('like', 'dislike') NOT NULL,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                UNIQUE KEY unique_user_post_reaction (post_id, user_id),
                KEY user_id (user_id),
                CONSTRAINT post_reactions_ibfk_1 FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
                CONSTRAINT post_reactions_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        // Create post_stats view if not exists
        await connection.execute(`
            CREATE OR REPLACE VIEW post_stats AS
            SELECT 
                p.id AS post_id,
                p.user_id,
                p.content,
                p.created_at,
                COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.user_id END) AS likes_count,
                COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.user_id END) AS dislikes_count,
                (COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.user_id END) - 
                COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.user_id END)) AS net_votes
            FROM posts p
            LEFT JOIN post_reactions pr ON p.id = pr.post_id
            GROUP BY p.id;
        `);
        // Create sample posts if needed
        const [users] = await connection.execute('SELECT id, username FROM users LIMIT 5');
        
        if (users.length > 0) {
            const samplePosts = [
                { content: "Just achieved 'Sergeant' rank! Feeling pumped for the next challenge. #CodeCombat #AchievementUnlocked" },
                { content: "Won a duel against ByteSlinger! It was a close one, but my algorithm prevailed. #CodeCombat #DuelWinner" },
                { content: "Completed the 'Advanced Algorithms' challenge. It was tough, but the satisfaction is worth it. #CodeCombat #ChallengeAccepted" },
                { content: "Does anyone have tips for optimizing dynamic programming solutions? I'm trying to improve my runtime efficiency." },
                { content: "Check out my new personal best on the leaderboard! Hard work pays off! #BrainJam #TopCoder" }
            ];
            
            for (const post of samplePosts) {
                const randomUserIndex = Math.floor(Math.random() * users.length);
                const userId = users[randomUserIndex].id;
                
                // Add random time offset (0-6 hours ago)
                const hoursAgo = Math.floor(Math.random() * 7);
                const createdAt = new Date();
                createdAt.setHours(createdAt.getHours() - hoursAgo);
                
                await connection.execute(
                    'INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, ?)',
                    [userId, post.content, createdAt]
                );
            }
            // Add some reactions to the posts
            const [posts] = await connection.execute('SELECT id FROM posts');
            
            if (posts.length > 0) {
                for (const post of posts) {
                    const reactingUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, Math.ceil(users.length * 0.7));
                    
                    for (const user of reactingUsers) {
                        // 70% like, 30% dislike
                        const reaction = Math.random() > 0.3 ? 'like' : 'dislike';
                        
                        try {
                            await connection.execute(
                                'INSERT INTO post_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
                                [post.id, user.id, reaction]
                            );
                        } catch (error) {
                            // Ignore duplicate key errors
                            if (!error.message.includes('Duplicate entry')) {
                            }
                        }
                    }
                }
            }
        }
        await connection.end();
    } catch (error) {
        process.exit(1);
    }
};

initGeekFeedDB();
