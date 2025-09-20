@echo off
echo.
echo 🧠 BrainJam Arena - Automated Setup
echo ====================================
echo 🎯 Train. Compete. Conquer the Code.
echo.

echo ⏳ Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully!
echo.

echo ⏳ Step 2: Setting up environment...
if not exist .env (
    echo 📝 Creating .env configuration file...
    (
        echo NODE_ENV=development
        echo PORT=3000
        echo.
        echo # Database Configuration - Auto-detects both MySQL ports
        echo DB_HOST=localhost
        echo DB_PORT=3306,4306
        echo DB_USER=root
        echo DB_PASSWORD=
        echo DB_NAME=brain_jam
        echo.
        echo # JWT Security
        echo JWT_SECRET=brain-jam-super-secret-key-change-in-production
        echo JWT_EXPIRE=24h
    ) > .env
    echo ✅ Environment configuration created!
    echo 💡 The app will auto-detect MySQL on ports 3306 and 4306 (XAMPP)
) else (
    echo ✅ Environment configuration already exists.
)
echo.

echo ⏳ Step 3: Initializing database...
echo 💡 Attempting to connect to MySQL on ports 3306 and 4306...
call npm run init-db
if errorlevel 1 (
    echo ❌ Database initialization failed
    echo 💡 Make sure MySQL or XAMPP is running
    echo � For XAMPP: Start Apache + MySQL in XAMPP Control Panel
    pause
    exit /b 1
)
echo ✅ Database initialized successfully!
echo.

echo ⏳ Step 4: Starting BrainJam Arena...
echo 🔍 Server will check ports 3000 and 3001 for availability
echo 📄 Pages:
echo    • Home: http://localhost:[3000 or 3001]
echo    • Register: http://localhost:[3000 or 3001]/register  
echo    • Login: http://localhost:[3000 or 3001]/login
echo.
echo 🛡️ Features Ready:
echo    ✅ User Registration & Login
echo    ✅ JWT Authentication
echo    ✅ Military Rank System
echo    ✅ Multi-Port MySQL Support
echo    ✅ Responsive Dark Theme
echo    ✅ Smart Port Selection (3000/3001 only)
echo.
echo 🔄 Server will use port 3000 or 3001 only
echo Press Ctrl+C to stop the server
echo.
call npm run dev

pause
