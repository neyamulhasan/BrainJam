// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    const userNameElements = document.querySelectorAll('#user-name, #welcome-name, #leaderboard-name');
    const userRankElement = document.getElementById('user-rank');

    // Utility functions
    function showMessage(message, type = 'success') {
        const container = document.getElementById('message-container');
        container.innerHTML = `<div class="message ${type}">${message}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    // Check authentication
    function checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            // Redirect to login if not authenticated
            window.location.href = '/login.html';
            return false;
        }
        
        return JSON.parse(user);
    }

    // Load user data
    function loadUserData() {
        const user = checkAuth();
        if (!user) return;

        // Update user name in multiple places
        userNameElements.forEach(element => {
            if (element.id === 'leaderboard-name') {
                element.textContent = user.username || 'You';
            } else {
                element.textContent = user.username || 'Soldier';
            }
        });

        // Calculate user rank based on some dummy logic
        const ranks = [
            { name: 'Recruit', minPoints: 0 },
            { name: 'Private', minPoints: 500 },
            { name: 'Private First Class', minPoints: 1000 },
            { name: 'Corporal', minPoints: 2000 },
            { name: 'Sergeant', minPoints: 3500 },
            { name: 'Staff Sergeant', minPoints: 5000 },
            { name: 'Lieutenant', minPoints: 7500 },
            { name: 'Captain', minPoints: 10000 },
            { name: 'Major', minPoints: 15000 },
            { name: 'Colonel', minPoints: 25000 }
        ];

        // Dummy points based on username length (just for demo)
        const dummyPoints = 1247; // This would come from database in real app
        let currentRank = ranks[0];
        
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (dummyPoints >= ranks[i].minPoints) {
                currentRank = ranks[i];
                break;
            }
        }

        if (userRankElement) {
            userRankElement.textContent = currentRank.name;
        }
    }

    // Logout functionality
    function logout() {
        // Clear stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        showMessage('Logged out successfully. See you next time!', 'success');
        
        // Redirect to home page after short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    }

    // Event listeners
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Action button functionality
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cardTitle = this.closest('.action-card').querySelector('h3').textContent;
            showMessage(`${cardTitle} feature coming soon! 🚀`, 'info');
        });
    });

    // View full leaderboard button
    const viewFullBtn = document.querySelector('.view-full-btn');
    if (viewFullBtn) {
        viewFullBtn.addEventListener('click', function() {
            showMessage('Full leaderboard view coming soon! 📊', 'info');
        });
    }

    // Activity item click handlers
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('h4').textContent;
            showMessage(`Viewing details for: ${title}`, 'info');
        });
    });

    // Leaderboard item click handlers
    const leaderboardItems = document.querySelectorAll('.leaderboard-item');
    leaderboardItems.forEach(item => {
        item.addEventListener('click', function() {
            const name = this.querySelector('.name').textContent;
            if (name !== 'You') {
                showMessage(`Viewing profile: ${name}`, 'info');
            }
        });
    });

    // Add some interactive animations
    function addInteractiveEffects() {
        // Stat cards hover effect with random number animation
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                const statNumber = this.querySelector('h3');
                const originalText = statNumber.textContent;
                
                // Simple number animation effect
                let iterations = 0;
                const maxIterations = 10;
                const interval = setInterval(() => {
                    if (iterations < maxIterations) {
                        // Add small random variation for animation effect
                        const current = parseInt(originalText.replace(/[^0-9]/g, '')) || 0;
                        const variation = Math.floor(Math.random() * 10) - 5;
                        const animated = Math.max(0, current + variation);
                        statNumber.textContent = originalText.replace(/\d+/, animated.toString());
                        iterations++;
                    } else {
                        statNumber.textContent = originalText;
                        clearInterval(interval);
                    }
                }, 50);
            });
        });

        // Activity items pulse effect
        const activities = document.querySelectorAll('.activity-item');
        activities.forEach((activity, index) => {
            setTimeout(() => {
                activity.style.opacity = '0';
                activity.style.transform = 'translateX(-20px)';
                activity.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    activity.style.opacity = '1';
                    activity.style.transform = 'translateX(0)';
                }, 100);
            }, index * 100);
        });
    }

    // Initialize dashboard
    function initializeDashboard() {
        loadUserData();
        addInteractiveEffects();
        
        // Show welcome message
        setTimeout(() => {
            showMessage('Welcome to your dashboard! 🎯', 'success');
        }, 500);
    }

    // Start the dashboard
    initializeDashboard();

    // Periodic data refresh (simulate real-time updates)
    setInterval(() => {
        // In a real app, this would fetch fresh data from the server
        console.log('Dashboard data refresh (simulated)');
    }, 30000); // Every 30 seconds
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + L for logout
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        document.getElementById('logout-btn').click();
    }
    
    // Escape key to clear any messages
    if (e.key === 'Escape') {
        const messageContainer = document.getElementById('message-container');
        messageContainer.innerHTML = '';
    }
});

// Handle page visibility change (pause/resume animations when tab is not active)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Dashboard paused (tab not visible)');
    } else {
        console.log('Dashboard resumed (tab visible)');
    }
});
