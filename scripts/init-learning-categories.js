const mysql = require('mysql2/promise');
require('dotenv').config();

// Function to try connecting to multiple ports
async function createMySQLConnection() {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'brain_jam';
    
    // Parse ports from environment variable (comma-separated)
    const portsString = process.env.DB_PORT || '3306,4306';
    const ports = portsString.split(',').map(port => parseInt(port.trim()));
    // Try each port until one works
    for (const port of ports) {
        try {
            const connection = await mysql.createConnection({
                host,
                port,
                user,
                password,
                database,
                charset: 'utf8mb4'
            });
            
            // Test the connection
            await connection.execute('SELECT 1');
            return connection;
            
        } catch (error) {
            // Continue to next port
        }
    }
    
    // If no port worked, throw an error
    throw new Error(`Failed to connect to MySQL on any of the specified ports: ${ports.join(', ')}`);
}

async function initializeLearningCategories() {
    // Default categories for learning resources
    const defaultCategories = [
        { name: 'Algorithms', slug: 'algorithms', description: 'Learn about various algorithms and their implementations' },
        { name: 'Data Structures', slug: 'data-structures', description: 'Explore different data structures and their applications' },
        { name: 'Web Development', slug: 'web-development', description: 'Front-end and back-end web development tutorials' },
        { name: 'Mobile Development', slug: 'mobile-development', description: 'Mobile app development for Android and iOS' },
        { name: 'System Design', slug: 'system-design', description: 'Design scalable systems and architecture' },
        { name: 'Database', slug: 'database', description: 'Database design, optimization and query techniques' },
        { name: 'Machine Learning', slug: 'machine-learning', description: 'Introduction to ML algorithms and applications' },
        { name: 'Competitive Programming', slug: 'competitive-programming', description: 'Tips and tricks for competitive programming' }
    ];
    
    let connection;
    
    try {
        // Create a direct connection to the database
        connection = await createMySQLConnection();
        
        // Check if categories already exist
        const [existingCategories] = await connection.execute('SELECT COUNT(*) as count FROM learning_categories');
        
        if (existingCategories[0].count > 0) {
            return;
        }
        
        // Insert default categories
        for (const category of defaultCategories) {
            await connection.execute(
                'INSERT INTO learning_categories (name, slug, description) VALUES (?, ?, ?)',
                [category.name, category.slug, category.description]
            );
        }
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    (async () => {
        try {
            await initializeLearningCategories();
            process.exit(0);
        } catch (error) {
            process.exit(1);
        }
    })();
}

module.exports = { initializeLearningCategories };