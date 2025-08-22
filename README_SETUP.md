# BrainJam Arena 🧠⚔️

A competitive programming platform where coders train, compete, and conquer challenges through real-time duels and military-style ranking system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v8.0+)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BrainJam
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup MySQL Database**
   - Create a MySQL database named `brain_jam`
   - Update the `.env` file with your database credentials

4. **Configure Environment**
   ```bash
   # Copy and edit the environment file
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=brain_jam
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=24h
   ```

5. **Initialize Database**
   ```bash
   npm run init-db
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - Home page: `/`
   - Login: `/login`
   - Register: `/register`

## 🏗️ Project Structure

```
BrainJam/
├── config/
│   └── database.js          # MySQL connection pool
├── public/
│   ├── css/
│   │   ├── home.css         # Home page styles
│   │   └── auth.css         # Authentication pages styles
│   ├── js/
│   │   ├── home.js          # Home page functionality
│   │   ├── login.js         # Login page functionality
│   │   └── register.js      # Registration page functionality
│   ├── index.html           # Home page
│   ├── login.html           # Login page
│   └── register.html        # Registration page
├── routes/
│   └── auth.js              # Authentication routes
├── scripts/
│   └── init-db.js           # Database initialization script
├── server.js                # Main server file
├── schema.sql               # Database schema
├── package.json             # Dependencies and scripts
└── .env                     # Environment configuration
```

## 🛠️ Features

### ✅ Implemented
- **Home Page**: Landing page with features overview and military rank progression
- **User Authentication**: 
  - Registration with email validation
  - Login with username/email
  - JWT-based authentication
  - Password hashing with bcrypt
- **Database Integration**: MySQL with connection pooling
- **Responsive Design**: Mobile-first approach
- **Real-time Validation**: Client-side form validation
- **Error Handling**: Comprehensive error messages

### 🚧 Planned
- Contest system
- Problem sets with difficulty levels
- Real-time code editor (Monaco/Ace)
- Judge0 integration for code execution
- Socket.io for real-time features
- Leaderboards and rankings
- Friend system and challenges

## 🎯 Military Rank System

- **Private Recruit** (800-999): New coders starting their journey
- **Cadet Coder** (1000-1199): Demonstrating solid coding proficiency  
- **Code Corporal** (1200-1399): Shows strong problem-solving skills
- **Tech Lieutenant** (1400-1599): Exhibits strong logical thinking
- **Algorithm Captain** (1600-1899): Commands complex coding challenges
- **Legendary General** (1900+): The highest rank with legendary skills

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)

### Testing
- `GET /api/test-db` - Test database connection

## 🎨 Design Features

- **Dark Theme**: Professional dark color scheme
- **Modern UI**: Clean, minimalist design
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Works on all device sizes
- **Military Aesthetic**: Rank badges and military-inspired design

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS enabled

## 🧪 Testing

```bash
# Test database connection
curl http://localhost:3000/api/test-db

# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","confirmPassword":"password123"}'

# Test user login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"password123"}'
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `` |
| `DB_NAME` | Database name | `brain_jam` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `24h` |

## 🚨 Troubleshooting

### Database Connection Issues
1. Ensure MySQL is running
2. Check database credentials in `.env`
3. Verify database exists: `CREATE DATABASE brain_jam;`
4. Run initialization script: `npm run init-db`

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>
```

### Permission Errors
- Ensure proper file permissions
- Run with appropriate user privileges
- Check MySQL user permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎖️ Credits

Created for Software Engineering Laboratory - 9th Trimester
BrainJam Arena - Where Code Warriors Are Born! ⚔️
