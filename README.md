# 🧠 BrainJam Arena

A complete competitive programming platform with Docker support, Judge0 API integration, and military-style ranking system. Perfect for coding competitions, practice, and learning.

![BrainJam Arena](https://img.shields.io/badge/Status-Active-green) ![Node.js](https://img.shields.io/badge/Node.js-18+-blue) ![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange) ![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

- 🔐 **Complete Authentication System** - JWT-based secure login/registration
- 💻 **Multi-Language Code Execution** - C++, Python, Java, JavaScript support via Judge0 API
- 🏆 **Military Ranking System** - From Private Recruit to Legendary General
- 🏁 **Contest Management** - Create, manage, and participate in coding contests
- 📚 **Learning Resources** - Structured learning paths and tutorials
- 👨‍💼 **Admin Dashboard** - Complete platform management
- 🎯 **Problem Categories** - Algorithmic challenges with difficulty levels
- 📊 **Progress Tracking** - Statistics, streaks, and performance analytics
- 🌐 **Responsive Design** - Works on desktop, tablet, and mobile
- 🐳 **Docker Ready** - One-command deployment

## 🚀 Quick Start (Docker - Recommended)

### Prerequisites
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Git** (to clone the repository)

### One-Command Setup
```bash
# 1. Clone the repository
git clone https://github.com/neyamulhasan/BrainJam.git
cd BrainJam

# 2. Quick setup (Windows)
quick-setup.bat

# 2. Quick setup (Linux/macOS)
chmod +x quick-setup.sh && ./quick-setup.sh
```

### Manual Docker Setup
```bash
# 1. Copy environment configuration
cp .env.shared .env

# 2. Start containers
docker-compose up -d

# 3. Initialize database
docker-compose exec app npm run init-db

# 4. Access application
# http://localhost:3000
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js v18 or higher
- MySQL 8.0 or XAMPP
- Git

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone https://github.com/neyamulhasan/BrainJam.git
   cd BrainJam
   npm install
   ```

2. **Database Setup**
   ```bash
   # Option A: Use existing MySQL
   # Make sure MySQL is running on port 3306
   
   # Option B: Use XAMPP
   # Start Apache and MySQL services (port 4306)
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize Database**
   ```bash
   npm run init-db
   npm run init-learning
   ```

5. **Start Application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode  
   npm start
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

**For Docker (Recommended):**
- Uses `.env.shared` (pre-configured with Judge0 API)
- No setup required - everything works out of the box

**For Local Development:**
```env
NODE_ENV=development
PORT=3000

# Database (supports auto-detection)
DB_HOST=localhost
DB_PORT=3306,4306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=brain_jam

# JWT Security
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h

# Judge0 API (Optional for local dev)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-rapidapi-key
```

## 🐳 Docker Configuration

### Files Structure
```
BrainJam/
├── Dockerfile               # Production container
├── docker-compose.yml       # Complete setup (app + database)
├── .dockerignore           # Docker build exclusions
├── .env.shared             # Shared environment (with Judge0 API)
├── .env.example            # Template for local development
└── quick-setup.sh/bat      # One-command setup scripts
```

### Docker Services
- **App Container**: Node.js application with health checks
- **MySQL Container**: Database with persistent storage and auto-initialization
- **Networking**: Internal Docker network for secure communication
- **Volumes**: Persistent data storage for database and uploads

### Docker Management
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Access container shell
docker-compose exec app sh

# Database access
docker-compose exec mysql mysql -u brainjam_user -p brain_jam
```

## 🎯 Platform Features

### Core Functionality
- 🔐 **User System**: Registration, login, profile management
- 💻 **Code Execution**: Multi-language support via Judge0 API
- 📊 **Problem Database**: Algorithmic challenges with test cases
- 🏁 **Contest System**: Create and manage coding competitions
- 📚 **Learning Hub**: Tutorials and educational resources
- 👨‍💼 **Admin Panel**: Complete platform management

### Military Ranking System
| Rank | Rating | Badge | Requirements |
|------|--------|-------|--------------|
| 🎖️ Private Recruit | 800-999 | Starter | Complete registration |
| ⭐ Cadet Coder | 1000-1199 | Learner | Solve 10+ problems |
| 🎯 Code Corporal | 1200-1399 | Solver | Win 3+ contests |
| 🛡️ Tech Lieutenant | 1400-1599 | Expert | 50+ problems solved |
| 👑 Algorithm Captain | 1600-1899 | Master | Top 10% in contests |
| 🏆 Legendary General | 1900+ | Legend | Elite performance |

## 🔌 Complete API Reference

### Authentication Endpoints
```bash
POST /api/auth/register      # User registration
POST /api/auth/login         # User authentication  
GET  /api/auth/profile       # Get user profile (JWT required)
```

### Problem & Contest Endpoints
```bash
GET  /api/problems           # List all problems
POST /api/problems/submit    # Submit solution
GET  /api/contests          # List contests
POST /api/contests/create   # Create contest (admin)
```

### Admin Endpoints
```bash
GET  /api/admin/users       # Manage users
POST /api/admin/problems    # Create problems
GET  /api/admin/stats       # Platform statistics
```

### System Endpoints
```bash
GET  /health                # Health check
GET  /api/test-db          # Database connection test
```

## 🔒 Security & Best Practices

### Authentication Security
- ✅ **bcrypt Hashing**: 12 salt rounds for password security
- ✅ **JWT Tokens**: Secure session management
- ✅ **Input Validation**: Server-side validation with express-validator
- ✅ **SQL Injection Prevention**: Parameterized queries only
- ✅ **XSS Protection**: Input sanitization and escaping

### Docker Security
- ✅ **Non-root User**: Application runs as non-privileged user
- ✅ **Environment Isolation**: Separate networks and containers
- ✅ **Secret Management**: Environment variables for sensitive data
- ✅ **Health Monitoring**: Automatic health checks and restart policies

## 🧪 Testing & Validation

### Manual Testing Checklist
- [ ] **Registration**: Create new account with validation
- [ ] **Login**: Authenticate with JWT token generation
- [ ] **Problem Solving**: Submit code and get execution results
- [ ] **Contest Participation**: Join and compete in contests
- [ ] **Admin Functions**: Manage users, problems, and contests
- [ ] **Docker Deployment**: One-command setup works

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Database test
curl http://localhost:3000/api/test-db

# Registration test
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","confirmPassword":"password123"}'

# Login test  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"password123"}'
```

## 🛠️ Database Management

### Available Scripts
```bash
npm start              # Start production server
npm run dev           # Development server with auto-reload
npm run init-db       # Initialize/reset database
npm run init-learning # Load learning resources
npm run update-db     # Run database updates
```

### Database Operations
```bash
# Reset database (Docker)
docker-compose exec app npm run init-db

# Update database schema (Docker)  
docker-compose exec app npm run update-db

# Access MySQL directly (Docker)
docker-compose exec mysql mysql -u brainjam_user -p brain_jam

# Backup database (Docker)
docker-compose exec mysql mysqldump -u brainjam_user -p brain_jam > backup.sql

# Restore database (Docker)
docker-compose exec -T mysql mysql -u brainjam_user -p brain_jam < backup.sql
```

## 🚀 Deployment Options

### 1. Docker (Recommended)
```bash
# One-command deployment
quick-setup.sh  # Linux/macOS
quick-setup.bat # Windows
```

### 2. Cloud Platforms
- **Railway**: Connect GitHub repo for auto-deployment
- **Heroku**: Use Docker container deployment
- **DigitalOcean Apps**: Docker-based deployment
- **AWS/GCP/Azure**: Container instances or app services

### 3. VPS/Dedicated Server
```bash
# Clone repository
git clone https://github.com/neyamulhasan/BrainJam.git
cd BrainJam

# Setup with Docker
docker-compose up -d

# Or manual setup
npm install
npm run init-db
npm start
```

## 🤝 Contributing & Sharing

### For Contributors
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m "Add new feature"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

### For Users
1. **Easy Setup**: Use `quick-setup.sh/bat` for instant deployment
2. **Shared Resources**: Uses project owner's Judge0 API (no setup needed)
3. **Complete Platform**: Get full competitive programming environment
4. **Zero Configuration**: Everything works out of the box

## 📞 Support & Documentation

### Quick Help
- **Issue Tracking**: [GitHub Issues](https://github.com/neyamulhasan/BrainJam/issues)
- **Docker Problems**: Check `docker-compose logs -f`
- **Database Issues**: Run `docker-compose exec app npm run init-db`
- **Port Conflicts**: Application auto-detects available ports

### Common Solutions
```bash
# Port already in use
netstat -tlnp | grep :3000  # Find process using port
sudo kill -9 <PID>          # Kill the process

# Database connection failed
docker-compose restart mysql # Restart MySQL container

# Permission errors (Linux)
sudo chown -R $USER:$USER .  # Fix file permissions
chmod +x quick-setup.sh      # Make script executable
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🎉 Get Started Now!

```bash
# Quick start (anyone can run this!)
git clone https://github.com/neyamulhasan/BrainJam.git
cd BrainJam
quick-setup.bat  # Windows
# or
./quick-setup.sh # Linux/macOS

# Access your platform at: http://localhost:3000
```

**Ready to compete? Start coding and climb the military ranks! 🚀**
   - Should return `{"success":true,"message":"Database connected successfully"}`

## 🔍 Troubleshooting

### Common Issues

**Port 3000 in use:**
```bash
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

**Database connection failed:**
- Ensure MySQL/XAMPP is running
- Check credentials in `.env`
- Run `npm run init-db`

**Registration/Login errors:**
- Check browser console for JavaScript errors
- Verify database tables exist
- Check server logs for detailed errors

### XAMPP Users
- ✅ MySQL runs on port 4306 (auto-detected)
- ✅ Usually no password required
- ✅ Compatible with MariaDB

## 🚧 Future Features

- Contest system with real-time competitions
- Code editor with syntax highlighting
- Judge0 integration for code execution
- Real-time leaderboards with Socket.io
- Friend system and challenges
- Problem difficulty progression
- Badge and achievement system

## 📄 License

This project is licensed under the MIT License.

## 🎖️ Credits

**BrainJam Arena** - Where Code Warriors Are Born! ⚔️

---

*Built for Software Engineering Laboratory - 9th Trimester*