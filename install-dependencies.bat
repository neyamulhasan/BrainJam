@echo off
echo ==========================================
echo BrainJam Arena - Dependency Installation
echo ==========================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Minimum required version: 16.0.0
    pause
    exit /b 1
)

REM Display Node.js version
echo Node.js version:
node --version
echo.

REM Check if npm is installed
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo npm should come with Node.js installation
    pause
    exit /b 1
)

REM Display npm version
echo npm version:
npm --version
echo.

REM Install main dependencies
echo [3/6] Installing main dependencies...
echo Installing: express, mysql2, bcrypt, bcryptjs, cors, jsonwebtoken, body-parser, express-validator, dotenv, socket.io
npm install express@^4.18.2 mysql2@^3.6.5 bcrypt@^5.1.1 bcryptjs@^3.0.2 cors@^2.8.5 jsonwebtoken@^9.0.2 body-parser@^1.20.2 express-validator@^7.0.1 dotenv@^16.3.1 socket.io@^4.7.4
if %errorlevel% neq 0 (
    echo ERROR: Failed to install main dependencies!
    pause
    exit /b 1
)
echo Main dependencies installed successfully!
echo.

REM Install development dependencies
echo [4/6] Installing development dependencies...
echo Installing: nodemon
npm install --save-dev nodemon@^3.0.2
if %errorlevel% neq 0 (
    echo ERROR: Failed to install development dependencies!
    pause
    exit /b 1
)
echo Development dependencies installed successfully!
echo.

REM Verify all dependencies are installed
echo [5/6] Verifying installation...
npm list --depth=0
echo.

REM Display setup completion message
echo [6/6] Installation completed successfully!
echo.
echo ==========================================
echo Setup Instructions:
echo ==========================================
echo 1. Make sure MySQL is installed and running
echo 2. Create a database named 'brain_jam'
echo 3. Run: npm run init-db (to initialize database)
echo 4. Run: npm start (to start the server)
echo.
echo Server will be available at: http://localhost:3001
echo ==========================================
echo.

REM Check if MySQL is accessible (optional)
echo Checking MySQL connectivity...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MySQL command not found in PATH
    echo Make sure MySQL is installed and accessible
) else (
    echo MySQL version:
    mysql --version
)
echo.

echo Dependencies installation completed!
echo You can now run 'npm start' to start the BrainJam Arena server.
pause
