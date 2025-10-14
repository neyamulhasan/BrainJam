// Common admin functionality
document.addEventListener('DOMContentLoaded', function() {
    // Setup logout functionality for all admin pages
    setupLogout();
    
    // Setup common navigation
    setupNavigation();
});

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                localStorage.removeItem('adminToken');
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
}

function setupNavigation() {
    // Get current page name
    const currentPage = window.location.pathname.split('/').pop();
    
    // Update active navigation item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Common utility functions for admin pages
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getIconForType(type)}"></i>
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Manual close
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
}

function getIconForType(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Check authentication status
function checkAuthStatus() {
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
    if (!authToken) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Loading indicator functions
function showLoading(element, message = 'Loading...') {
    element.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> ${message}
        </div>
    `;
}

function hideLoading(element) {
    const loading = element.querySelector('.loading-indicator');
    if (loading) {
        loading.remove();
    }
}