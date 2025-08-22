# 🚀 Quick Setup Guide for BrainJam Arena

## For XAMPP Users (MySQL on port 4306)

### Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. MySQL will run on port **4306** (XAMPP default)

### Step 2: Setup BrainJam Arena
1. **Run the setup script:**
   ```cmd
   setup.bat
   ```

2. **Or manual setup:**
   ```cmd
   npm install
   npm run init-db
   npm start
   ```

### Step 3: Access the Application
- **Home Page:** http://localhost:3000
- **Login:** http://localhost:3000/login  
- **Register:** http://localhost:3000/register

---

## For Standard MySQL Users (port 3306)

### Step 1: Start MySQL Service
```cmd
net start mysql
```

### Step 2: Setup BrainJam Arena
Same as above - the app will automatically detect port 3306.

---

## 🔧 How Multi-Port Detection Works

The application will automatically try to connect to MySQL in this order:
1. **Port 3306** (Standard MySQL)
2. **Port 4306** (XAMPP MySQL)

### Environment Configuration (`.env` file):
```env
DB_HOST=localhost
DB_PORT=3306,4306    # Comma-separated ports to try
DB_USER=root
DB_PASSWORD=         # Usually empty for XAMPP
DB_NAME=brain_jam
```

---

## 🛠️ Troubleshooting

### MySQL Connection Issues:
1. **XAMPP Users:** Make sure MySQL is started in XAMPP Control Panel
2. **Standard MySQL:** Ensure MySQL service is running
3. **Check ports:** Verify MySQL is running on 3306 or 4306
4. **Password:** For XAMPP, usually no password is needed (leave empty)

### Port Check Commands:
```cmd
# Check what's running on port 3306
netstat -an | findstr :3306

# Check what's running on port 4306  
netstat -an | findstr :4306
```

### Database Issues:
```cmd
# Re-initialize database
npm run init-db

# Test database connection
curl http://localhost:3000/api/test-db
```

---

## 📋 Default Credentials

### For XAMPP:
- **Username:** root
- **Password:** (empty)
- **Port:** 4306

### For Standard MySQL:
- **Username:** root  
- **Password:** (your MySQL password)
- **Port:** 3306

---

## 🎯 Features Available

### ✅ Current Features:
- User Registration & Login
- JWT Authentication  
- Password Hashing
- Responsive Design
- Dark Theme UI
- Military Rank System Display

### 🚧 Coming Soon:
- Contest System
- Code Editor
- Problem Sets
- Real-time Competitions
- Leaderboards

---

## 🔍 Verification Steps

1. **Check server startup:**
   ```
   ✅ MySQL connection successful on port 4306 (or 3306)
   🚀 BrainJam Arena server running on http://localhost:3000
   ```

2. **Test database connection:**
   Visit: http://localhost:3000/api/test-db
   Should return: `{"success":true,"message":"Database connected successfully"}`

3. **Test registration:**
   - Go to http://localhost:3000/register
   - Create a new account
   - Should redirect to home page after successful registration

---

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify MySQL is running (XAMPP Control Panel)
3. Check `.env` file configuration
4. Try running `npm run init-db` again

**Happy Coding! 🧠⚔️**
