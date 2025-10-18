const mysql = require('mysql2/promise');

// Function to try connecting to multiple ports
async function createMySQLConnection() {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'brain_jam';
    
    // Parse ports from environment variable (comma-separated)
    const portsString = process.env.DB_PORT || '3306,4306';
    const ports = portsString.split(',').map(port => parseInt(port.trim()));
    
    console.log(`🔍 Attempting to connect to MySQL on ports: ${ports.join(', ')}`);
    
    // Try each port until one works
    for (const port of ports) {
        try {
            console.log(`🔌 Trying MySQL connection on port ${port}...`);
            
            const testConnection = await mysql.createConnection({
                host,
                port,
                user,
                password,
                charset: 'utf8mb4'
            });
            
            // Test the connection
            await testConnection.execute('SELECT 1');
            await testConnection.end();
            
            console.log(`✅ MySQL connection successful on port ${port}`);
            
            // Create the connection pool with the working port
            return mysql.createPool({
                host,
                port,
                user,
                password,
                database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                charset: 'utf8mb4'
            });
            
        } catch (error) {
            console.log(`❌ Failed to connect on port ${port}: ${error.message}`);
            // Continue to next port
        }
    }
    
    // If no port worked, throw an error
    throw new Error(`Failed to connect to MySQL on any of the specified ports: ${ports.join(', ')}`);
}

// Create the pool
let pool = null;

async function initializePool() {
    try {
        pool = await createMySQLConnection();
        
        // Test the pool connection
        const connection = await pool.getConnection();
        console.log('✅ MySQL pool initialized successfully');
        connection.release();
        
    } catch (error) {
        console.error('❌ MySQL pool initialization failed:', error.message);
        console.log('💡 Make sure MySQL is running on port 3306 or 4306 (XAMPP)');
        console.log('💡 Check your database credentials in the .env file');
    }
}

// Initialize the pool with retry logic
let initializationPromise = null;

async function initializePoolWithRetry() {
    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = (async () => {
        let retries = 10;
        while (retries > 0) {
            try {
                pool = await createMySQLConnection();
                
                // Test the pool connection
                const connection = await pool.getConnection();
                console.log('✅ MySQL pool initialized successfully');
                connection.release();
                return pool;
                
            } catch (error) {
                retries--;
                console.log(`⏳ Database connection attempt failed (${10 - retries}/10). Retrying in 3 seconds...`);
                console.log(`   Error: ${error.message}`);
                
                if (retries === 0) {
                    console.error('❌ MySQL pool initialization failed after all retries:', error.message);
                    console.log('💡 Make sure MySQL is running on port 3306 or 4306 (XAMPP)');
                    console.log('💡 Check your database credentials in the .env file');
                    throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    })();
    
    return initializationPromise;
}

// Start initialization
initializePoolWithRetry();

// Export a function that returns the pool when ready
async function getPool() {
    if (!pool) {
        console.log('⏳ Waiting for database pool initialization...');
        await initializePoolWithRetry();
    }
    return pool;
}

module.exports = {
    execute: async (query, params) => {
        const dbPool = await getPool();
        return await dbPool.execute(query, params);
    },
    getConnection: async () => {
        const dbPool = await getPool();
        return await dbPool.getConnection();
    }
};
