const express = require('express');
const cors = require('cors');
const path = require('path');
const net = require('net');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const geekFeedRoutes = require('./routes/geek_feed');
const adminRoutes = require('./routes/admin');
const learningRoutes = require('./routes/learning');
const db = require('./config/database');

const app = express();

// Function to check if a port is available
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(true);
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
}

// Function to find available port (only 3000 or 3001)
async function findAvailablePort() {
    const allowedPorts = [3000, 3001];
    console.log(`🔍 Checking available ports: ${allowedPorts.join(', ')}...`);
    
    for (const port of allowedPorts) {
        console.log(`🔌 Checking port ${port}...`);
        
        if (await isPortAvailable(port)) {
            console.log(`✅ Port ${port} is available!`);
            return port;
        } else {
            console.log(`🔄 Port ${port} is in use`);
        }
    }
    
    throw new Error(`Both ports 3000 and 3001 are in use. Please free one of these ports and try again.`);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/geek-feed', geekFeedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/learning', learningRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/geek-feed', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'geek-feed.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/content-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'content-management.html'));
});

app.get('/create-resource', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'create-resource.html'));
});

app.get('/test-learning-api', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-learning-api.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server with automatic port detection (3000 or 3001 only)
async function startServer() {
    try {
        // First try the PORT from environment variable if it's 3000 or 3001
        const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : null;
        
        let PORT;
        if (preferredPort && (preferredPort === 3000 || preferredPort === 3001)) {
            // If PORT is specified and is 3000 or 3001, check if it's available
            console.log(`🎯 Checking preferred port ${preferredPort} from environment...`);
            if (await isPortAvailable(preferredPort)) {
                PORT = preferredPort;
                console.log(`✅ Using preferred port ${PORT}`);
            } else {
                console.log(`🔄 Port ${preferredPort} is in use, checking alternative...`);
                // Try the other port (if preferred is 3000, try 3001, and vice versa)
                const alternativePort = preferredPort === 3000 ? 3001 : 3000;
                console.log(`🔌 Checking port ${alternativePort}...`);
                if (await isPortAvailable(alternativePort)) {
                    PORT = alternativePort;
                    console.log(`✅ Port ${alternativePort} is available!`);
                } else {
                    throw new Error(`Both ports 3000 and 3001 are in use. Please free one of these ports and try again.`);
                }
            }
        } else {
            // No specific port set or invalid port, find available port from 3000/3001
            if (preferredPort && preferredPort !== 3000 && preferredPort !== 3001) {
                console.log(`⚠️ Port ${preferredPort} is not allowed. Only ports 3000 and 3001 are supported.`);
            }
            PORT = await findAvailablePort();
        }
        
        app.listen(PORT, () => {
            console.log(`🚀 BrainJam Arena server running on http://localhost:${PORT}`);
            console.log(`📊 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
            console.log(`💡 Server selected port ${PORT} (only 3000/3001 allowed)`);
            console.log(`🌐 Access your application at: http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.log('💡 Please free either port 3000 or 3001 and try again');
        console.log('💡 You can check what\'s using these ports with: lsof -i :3000 or lsof -i :3001');
        process.exit(1);
    }
}

// Start the server
startServer();
