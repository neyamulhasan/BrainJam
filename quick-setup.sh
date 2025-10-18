#!/bin/bash

# BrainJam Quick Setup Script
# This script sets up BrainJam with shared Judge0 API access

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "🚀 ======================================"
    echo "   BrainJam Quick Setup"
    echo "   Competitive Programming Platform"
    echo "======================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    print_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first:"
        echo "  Windows/Mac: https://www.docker.com/products/docker-desktop"
        echo "  Linux: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    print_success "All requirements met!"
}

setup_environment() {
    print_info "Setting up environment..."
    
    # Copy shared environment if .env doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.shared ]; then
            cp .env.shared .env
            print_success "Environment configuration copied from .env.shared"
        else
            print_warning "No .env.shared found. Creating basic .env file..."
            cp .env.example .env 2>/dev/null || touch .env
        fi
    else
        print_info ".env file already exists, keeping current configuration"
    fi
}

start_services() {
    print_info "Starting BrainJam services..."
    
    # Start with the main docker-compose.yml
    docker-compose down 2>/dev/null || true
    docker-compose build --no-cache
    docker-compose up -d
    COMPOSE_FILE="docker-compose.yml"
    
    print_success "Services started successfully!"
    
    # Wait for services to be ready
    print_info "Waiting for services to initialize..."
    sleep 10
    
    # Check if services are healthy
    if docker-compose ps | grep -q "Up (healthy)"; then
        print_success "Services are healthy and ready!"
    else
        print_warning "Services are starting up. This may take a few moments..."
    fi
}

initialize_database() {
    print_info "Initializing database..."
    
    # Wait a bit more for database to be ready
    sleep 5
    
    # Initialize database with retry logic
    for i in {1..3}; do
        if docker-compose exec -T app npm run init-db 2>/dev/null; then
            break
        fi
        
        if [ $i -eq 3 ]; then
            print_warning "Database initialization failed. You can initialize it manually later."
            print_info "Run: docker-compose exec app npm run init-db"
            return
        fi
        
        print_info "Retrying database initialization... ($i/3)"
        sleep 5
    done
    
    print_success "Database initialized successfully!"
}

show_completion_info() {
    echo ""
    echo -e "${GREEN}🎉 BrainJam is now running!${NC}"
    echo ""
    echo "📱 Access your application:"
    echo "   🌐 Main App: http://localhost:3000"
    echo "   ❤️  Health Check: http://localhost:3000/health"
    echo ""
    echo "🗄️ Database Access:"
    echo "   📍 Host: localhost"
    echo "   🔌 Port: 3306"
    echo "   👤 User: brainjam_user"
    echo "   🔑 Password: brainjam_shared_password"
    echo ""
    echo "🛠️ Useful Commands:"
    echo "   📊 View logs: docker-compose logs -f"
    echo "   🛑 Stop services: docker-compose down"
    echo "   🔄 Restart: docker-compose restart"
    echo ""
    echo "🎯 Features Available:"
    echo "   ✅ User Registration & Authentication"
    echo "   ✅ Problem Solving & Practice"
    echo "   ✅ Contest Management"
    echo "   ✅ Code Execution (Judge0 API)"
    echo "   ✅ Learning Resources"
    echo "   ✅ Admin Dashboard"
    echo ""
    print_info "Check DOCKER_README.md for detailed documentation"
}

main() {
    print_header
    
    check_requirements
    setup_environment
    start_services
    initialize_database
    show_completion_info
    
    echo ""
    print_success "Setup completed! Happy coding! 🚀"
}

# Handle script interruption
trap 'print_error "Setup interrupted. Run the script again to retry."; exit 1' INT

# Run main function
main "$@"