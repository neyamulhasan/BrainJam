const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Function to try connecting to multiple ports
async function createMySQLConnection() {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    
    // Parse ports from environment variable (comma-separated)
    const portsString = process.env.DB_PORT || '3306,4306';
    const ports = portsString.split(',').map(port => parseInt(port.trim()));
    
    console.log(`🔍 Attempting to connect to MySQL on ports: ${ports.join(', ')}`);
    
    // Try each port until one works
    for (const port of ports) {
        try {
            console.log(`🔌 Trying MySQL connection on port ${port}...`);
            
            const connection = await mysql.createConnection({
                host,
                port,
                user,
                password,
                charset: 'utf8mb4'
            });
            
            // Test the connection
            await connection.execute('SELECT 1');
            console.log(`✅ MySQL connection successful on port ${port}`);
            
            return { connection, port };
            
        } catch (error) {
            console.log(`❌ Failed to connect on port ${port}: ${error.message}`);
            // Continue to next port
        }
    }
    
    // If no port worked, throw an error
    throw new Error(`Failed to connect to MySQL on any of the specified ports: ${ports.join(', ')}`);
}

async function initializeDatabase() {
    console.log('🔧 Initializing BrainJam Arena Database...');
    
    try {
        // Create connection without specifying database
        const { connection, port } = await createMySQLConnection();
        console.log(`📡 Connected to MySQL on port ${port}`);

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split schema into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📄 Executing ${statements.length} SQL statements...`);

        // Execute each statement
        for (const statement of statements) {
            try {
                // Handle USE command separately as it's not supported in prepared statements
                if (statement.trim().toUpperCase().startsWith('USE ')) {
                    await connection.query(statement);
                } else if (statement.trim().toUpperCase().startsWith('CREATE DATABASE')) {
                    await connection.query(statement);
                } else {
                    await connection.execute(statement);
                }
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`❌ Error executing statement: ${statement.substring(0, 50)}...`);
                    console.error(error.message);
                }
            }
        }

        // Verify database setup
        await connection.query(`USE ${process.env.DB_NAME || 'brain_jam'}`);
        const [tables] = await connection.execute('SHOW TABLES');
        
        console.log('✅ Database initialized successfully!');
        console.log(`📊 Created ${tables.length} tables:`);
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        await connection.end();
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('💡 Make sure MySQL is running on port 3306 or 4306 (XAMPP)');
        console.log('💡 Check your database credentials in the .env file');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
