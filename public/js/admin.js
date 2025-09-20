// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and is admin
    function checkAdminAuth() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            window.location.href = '/login.html';
            return false;
        }
        
        const user = JSON.parse(userData);
        
        if (user.role !== 'admin') {
            window.location.href = '/dashboard.html';
            return false;
        }
        
        return user;
    }

    // Utility function to show messages
    function showMessage(message, type = 'success') {
        // Create message container if it doesn't exist
        let container = document.getElementById('message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'message-container';
            container.className = 'message-container';
            document.body.appendChild(container);
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        container.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }

    // API call helper
    async function apiCall(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('authToken');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            const response = await fetch(`/api/admin/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-User-ID': user.id?.toString(),
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error in API call to ${endpoint}:`, error);
            showMessage(`Failed to load ${endpoint}: ${error.message}`, 'error');
            return null;
        }
    }

    // Load dashboard stats
    async function loadDashboardStats() {
        const data = await apiCall('stats');
        if (!data) return;
        
        // Update stats in the UI
        document.getElementById('total-users').textContent = data.totalUsers.toLocaleString();
        document.getElementById('active-competitions').textContent = data.activeCompetitions;
        document.getElementById('total-problems').textContent = data.totalProblems.toLocaleString();
    }

    // Load recent activity
    async function loadRecentActivity() {
        const data = await apiCall('activity');
        if (!data || !data.activities || !data.activities.length) return;
        
        const tableBody = document.getElementById('activity-table-body');
        tableBody.innerHTML = '';
        
        data.activities.forEach(activity => {
            const row = document.createElement('tr');
            
            // User column
            const userCell = document.createElement('td');
            userCell.textContent = activity.username;
            
            // Action column
            const actionCell = document.createElement('td');
            actionCell.textContent = activity.action;
            
            // Timestamp column
            const timestampCell = document.createElement('td');
            const date = new Date(activity.timestamp);
            timestampCell.textContent = date.toLocaleString();
            
            // Add cells to row
            row.appendChild(userCell);
            row.appendChild(actionCell);
            row.appendChild(timestampCell);
            
            // Add row to table
            tableBody.appendChild(row);
        });
    }

    // Set up action button handlers
    function setupActionHandlers() {
        // Create Competition button
        const createCompBtn = document.querySelector('.primary-btn');
        if (createCompBtn) {
            createCompBtn.addEventListener('click', function() {
                // Redirect to competition creation page or open modal
                // This is a placeholder for now
                showMessage('Competition creation feature coming soon!', 'info');
            });
        }
        
        // Add Problem button
        const addProblemBtn = document.querySelector('.secondary-btn');
        if (addProblemBtn) {
            addProblemBtn.addEventListener('click', function() {
                // Redirect to problem creation page or open modal
                // This is a placeholder for now
                showMessage('Problem creation feature coming soon!', 'info');
            });
        }
    }

    // Initialize the admin dashboard
    async function initializeAdminDashboard() {
        const adminUser = checkAdminAuth();
        if (!adminUser) return; // Redirect happens in checkAdminAuth
        
        try {
            // Load data in parallel
            await Promise.all([
                loadDashboardStats(),
                loadRecentActivity()
            ]);
            
            // Set up action handlers
            setupActionHandlers();
            
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
            showMessage('Error loading dashboard data', 'error');
        }
    }

    // Initialize navigation
    function initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Prevent default only if it's a placeholder link
                if (e.currentTarget.getAttribute('href') === '#') {
                    e.preventDefault();
                }
                
                // Remove active class from all nav items
                navItems.forEach(navItem => {
                    navItem.classList.remove('active');
                });
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // For now, just show a message
                const pageName = this.querySelector('span').textContent;
                if (pageName !== 'Dashboard') {
                    showMessage(`${pageName} feature coming soon!`, 'info');
                }
            });
        });
    }

    // Start initialization
    initializeAdminDashboard();
    initializeNavigation();
});