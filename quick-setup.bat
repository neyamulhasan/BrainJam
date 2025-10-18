@echo off
setlocal enabledelayedexpansion

REM BrainJam Quick Setup Script for Windows

echo.
echo 🚀 ======================================
echo    BrainJam Quick Setup
echo    Competitive Programming Platform  
echo ======================================
echo.

:check_requirements
echo [INFO] Checking system requirements...

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first:
    echo   Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [SUCCESS] All requirements met!

:setup_environment
echo [INFO] Setting up environment...

if not exist .env (
    if exist .env.shared (
        copy .env.shared .env >nul
        echo [SUCCESS] Environment configuration copied from .env.shared
    ) else (
        if exist .env.example (
            copy .env.example .env >nul
        ) else (
            echo. > .env
        )
        echo [WARNING] Created basic .env file
    )
) else (
    echo [INFO] .env file already exists, keeping current configuration
)

:start_services
echo [INFO] Starting BrainJam services...

REM Stop existing containers and remove volumes for fresh start
docker-compose down -v >nul 2>&1
docker-compose build --no-cache  
docker-compose up -d

echo [SUCCESS] Services started successfully!

:wait_for_services
echo [INFO] Waiting for services to initialize...
timeout /t 20 /nobreak >nul

:initialize_database
echo [INFO] Initializing database...

REM Try to initialize database
docker-compose exec -T app npm run init-db >nul 2>&1

if errorlevel 1 (
    echo [WARNING] Database initialization failed. You can initialize it manually later.
    echo [INFO] Run: docker-compose exec app npm run init-db
) else (
    echo [SUCCESS] Database initialized successfully!
)

:show_completion
echo.
echo 🎉 BrainJam is now running!
echo.
echo 📱 Access your application:
echo    🌐 Main App: http://localhost:3000
echo    ❤️  Health Check: http://localhost:3000/health
echo.
echo 🗄️ Database Access:
echo    📍 Host: localhost
echo    🔌 Port: 3306  
echo    👤 User: brainjam_user
echo    🔑 Password: brainjam_shared_password
echo.
echo 🛠️ Useful Commands:
echo    📊 View logs: docker-compose logs -f
echo    🛑 Stop services: docker-compose down
echo    🔄 Restart: docker-compose restart
echo    🔄 Rebuild: docker-compose down -v && docker-compose build --no-cache && docker-compose up -d
echo.
echo 🎯 Features Available:
echo    ✅ User Registration ^& Authentication
echo    ✅ Problem Solving ^& Practice  
echo    ✅ Contest Management
echo    ✅ Code Execution (Judge0 API)
echo    ✅ Learning Resources
echo    ✅ Admin Dashboard
echo.
echo [INFO] Check README.md for detailed documentation
echo.
echo [SUCCESS] Setup completed! Happy coding! 🚀
echo.
pause