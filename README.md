# 🧠 BrainJam Arena

A competitive programming platform where coders train, compete, and conquer challenges through real-time duels and a military-style ranking system.

![BrainJam Arena](https://img.shields.io/badge/Status-Active-green) ![Node.js](https://img.shields.io/badge/Node.js-v16+-blue) ![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)

## ✨ Features

- 🔐 **User Authentication** - Secure registration and login with JWT tokens
- 🎨 **Modern Dark UI** - Professional, responsive design
- 🏆 **Military Rank System** - Progress from Private Recruit to Legendary General
- 🔄 **Multi-Port MySQL** - Supports both standard MySQL (3306) and XAMPP (4306)
- � **Auto Port Detection** - Automatically finds available ports (3000-3009)
- �🛡️ **Security Features** - Password hashing, input validation, XSS protection
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js v16 or higher
- MySQL or XAMPP
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd BrainJam
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   - For XAMPP: Start Apache and MySQL services
   - For standard MySQL: Ensure MySQL service is running

4. **Initialize Database**
   ```bash
   npm run init-db
   ```

5. **Start the application**
   ```bash
   # Development mode (auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Home: http://localhost:3000
   - Register: http://localhost:3000/register
   - Login: http://localhost:3000/login

## 🔧 Configuration

The application automatically detects MySQL on ports 3306 and 4306. No manual configuration needed!

### Environment Variables (.env)
```env
NODE_ENV=development
PORT=3000

# Database - supports multiple ports (auto-detection)
DB_HOST=localhost
DB_PORT=3306,4306
DB_USER=root
DB_PASSWORD=
DB_NAME=brain_jam

# JWT Security
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
```

## 🏗️ Project Structure

```
BrainJam/
├── config/
│   └── database.js          # Multi-port MySQL connection
├── public/
│   ├── css/                 # Stylesheets
│   ├── js/                  # Frontend JavaScript
│   ├── index.html           # Home page
│   ├── login.html           # Login page
│   └── register.html        # Registration page
├── routes/
│   └── auth.js              # Authentication API routes
├── scripts/
│   └── init-db.js           # Database initialization
├── server.js                # Main server file
├── schema.sql               # Database schema
└── package.json             # Dependencies
```

## 🎯 Military Rank System

| Rank | Rating Range | Description |
|------|--------------|-------------|
| 🎖️ Private Recruit | 800-999 | New coders starting their journey |
| ⭐ Cadet Coder | 1000-1199 | Solid coding proficiency |
| 🎯 Code Corporal | 1200-1399 | Strong problem-solving skills |
| 🛡️ Tech Lieutenant | 1400-1599 | Strong logical thinking |
| 👑 Algorithm Captain | 1600-1899 | Complex coding challenges |
| 🏆 Legendary General | 1900+ | Elite coding mastery |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - Get user profile (requires JWT)

### System
- `GET /api/test-db` - Test database connection

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with 12 salt rounds
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Input Validation** - Server and client-side validation
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **XSS Protection** - Input sanitization
- ✅ **CORS Support** - Cross-origin resource sharing

## 🛠️ Development

### Available Scripts
```bash
npm start       # Start production server
npm run dev     # Start development server with auto-reload
npm run init-db # Initialize/reset database
```

### Database Management
```bash
# Reset database
npm run init-db

# Test connection
curl http://localhost:3000/api/test-db
```

## 🧪 Testing

### Manual Testing
1. **Registration Test**
   - Go to `/register`
   - Fill form with valid data
   - Check successful registration and redirect

2. **Login Test**
   - Go to `/login` 
   - Use registered credentials
   - Verify successful login and redirect

3. **Database Test**
   - Visit `/api/test-db`
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