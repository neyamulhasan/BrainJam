#!/bin/bash
set -e

echo "=========================================="
echo " BrainJam Arena - Dependency Installation "
echo "=========================================="
echo "This script will automatically install all required dependencies for BrainJam Arena."
echo "Compatible with: NVM, Volta, FNM, system Node.js installations"
echo "Requirements: Node.js 16.0.0+ and npm"
echo

# 1. Check Node.js
echo "[1/6] Checking Node.js installation..."

# Check if running with sudo and try to find node in user's environment
if [[ $EUID -eq 0 ]]; then
    echo "WARNING: Running with sudo detected!"
    echo "Trying to locate Node.js in user environment..."
    
    # Get the actual user (not root)
    REAL_USER=${SUDO_USER:-$USER}
    
    # Try common Node.js installation paths
    NODE_PATHS=(
        "/home/$REAL_USER/.nvm/versions/node/*/bin"
        "/home/$REAL_USER/.volta/bin"
        "/home/$REAL_USER/.fnm/node-versions/*/installation/bin"
        "/usr/local/bin"
        "/usr/bin"
        "/opt/node/bin"
    )
    
    for path in "${NODE_PATHS[@]}"; do
        # Handle wildcard paths for NVM
        if [[ "$path" == *"*"* ]]; then
            for expanded_path in $path; do
                if [[ -f "$expanded_path/node" ]]; then
                    export PATH="$expanded_path:$PATH"
                    echo "Found Node.js in: $expanded_path"
                    break 2
                fi
            done
        else
            if [[ -f "$path/node" ]]; then
                export PATH="$path:$PATH"
                echo "Found Node.js in: $path"
                break
            fi
        fi
    done
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not accessible!"
    echo
    echo "SOLUTION OPTIONS:"
    echo "1. If you have Node.js installed via NVM/Volta/FNM, run WITHOUT sudo:"
    echo "   ./install-dependencies.sh"
    echo
    echo "2. Install Node.js using one of these methods:"
    echo "   • Official installer: https://nodejs.org/"
    echo "   • Using NVM: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "   • Using package manager: sudo apt install nodejs npm"
    echo
    echo "   Minimum required version: 16.0.0"
    echo "   Recommended version: 18.0.0 or higher"
    exit 1
fi

echo "Node.js version:"
node --version
echo

# 2. Check npm
echo "[2/6] Checking npm installation..."

# npm usually comes with Node.js, so if we found Node.js, npm should be in the same directory
if [[ $EUID -eq 0 ]] && command -v node &> /dev/null; then
    # Get the directory where node was found and add it to PATH for npm
    NODE_DIR=$(dirname "$(command -v node)")
    export PATH="$NODE_DIR:$PATH"
fi

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed or not accessible!"
    echo
    echo "SOLUTION OPTIONS:"
    echo "1. If you have Node.js installed via NVM/Volta/FNM, run WITHOUT sudo:"
    echo "   ./install-dependencies.sh"
    echo
    echo "2. npm should come with Node.js installation"
    echo "   If Node.js is installed but npm is missing, try:"
    echo "   • Reinstall Node.js from https://nodejs.org/"
    echo "   • Or install npm separately: sudo apt install npm"
    exit 1
fi

echo "npm version:"
npm --version
echo

# 3. Install main dependencies
echo "[3/6] Installing main dependencies..."
echo "Installing: express, mysql2, bcrypt, bcryptjs, cors, jsonwebtoken, body-parser, express-validator, dotenv, socket.io"
npm install express@^4.18.2 mysql2@^3.6.5 bcrypt@^5.1.1 bcryptjs@^3.0.2 cors@^2.8.5 jsonwebtoken@^9.0.2 body-parser@^1.20.2 express-validator@^7.0.1 dotenv@^16.3.1 socket.io@^4.7.4

echo "Main dependencies installed successfully!"
echo

# 4. Install dev dependencies
echo "[4/6] Installing development dependencies..."
echo "Installing: nodemon"
npm install --save-dev nodemon@^3.0.2
echo "Development dependencies installed successfully!"
echo

# 5. Verify installation
echo "[5/6] Verifying installation..."
npm list --depth=0
echo

# 6. Setup completion
echo "[6/6] Installation completed successfully!"
echo "=========================================="
echo " Setup Instructions:"
echo "=========================================="
echo " 1. Make sure MySQL is installed and running"
echo " 2. Create a database named 'brain_jam'"
echo " 3. Run: npm run init-db   (to initialize database)"
echo " 4. Run: npm start         (to start the server)"
echo
echo " Server will be available at: http://localhost:3001"
echo "=========================================="
echo

# Optional: check MySQL
echo "Checking MySQL connectivity..."
if command -v mysql &> /dev/null; then
    echo "MySQL version:"
    mysql --version
else
    echo "WARNING: MySQL command not found in PATH"
    echo "Make sure MySQL is installed and accessible"
fi

echo
echo "Dependencies installation completed!"
echo "You can now run 'npm start' to start the BrainJam Arena server."
