document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        alert('Please login to access contests');
        window.location.href = '/login.html';
        return;
    }

    // Load active contests
    loadActiveContests();
    
    // Load upcoming contests
    loadUpcomingContests();
});

// Function to load active contests
async function loadActiveContests() {
    const container = document.getElementById('contests-container');
    
    try {
        container.innerHTML = '<div class="loading">Loading active contests...</div>';
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        const response = await fetch('/api/contests/active', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch active contests');
        }
        
        const data = await response.json();
        const contests = data.contests || [];
        
        if (contests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Active Contests</h3>
                    <p>There are no active contests at the moment. Check back later or check upcoming contests!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contests.map(contest => {
            const timeRemaining = getTimeRemaining(contest.end_time);
            const isRegistered = contest.is_registered;
            
            return `
                <div class="contest-card">
                    <div class="contest-header">
                        <h3 class="contest-title">${escapeHtml(contest.title)}</h3>
                        <span class="contest-status status-live">Live</span>
                    </div>
                    <p class="contest-description">${escapeHtml(contest.description || '')}</p>
                    <div class="contest-meta">
                        <span><i class="fas fa-users"></i> ${contest.participant_count || 0} participants</span>
                        <span><i class="fas fa-clock"></i> ${timeRemaining}</span>
                    </div>
                    <div class="contest-actions">
                        ${isRegistered ? 
                            `<button class="btn btn-primary" onclick="enterContest(${contest.id})">Enter Contest</button>` :
                            `<button class="btn btn-secondary" disabled>Not Registered</button>`
                        }
                        <button class="btn btn-secondary" onclick="viewContestDetails(${contest.id})">View Details</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('❌ Error loading active contests:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Contests</h3>
                <p>Failed to load active contests. Please refresh the page.</p>
            </div>
        `;
    }
}

// Function to load upcoming contests
async function loadUpcomingContests() {
    const container = document.getElementById('upcoming-contests-container');
    
    try {
        container.innerHTML = '<div class="loading">Loading upcoming contests...</div>';
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        const response = await fetch('/api/contests/upcoming', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch upcoming contests');
        }
        
        const data = await response.json();
        const contests = data.contests || [];
        
        if (contests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No Upcoming Contests</h3>
                    <p>There are no upcoming contests scheduled. Stay tuned for new competitions!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contests.map(contest => {
            const startDate = formatDateTime(contest.start_time);
            const duration = `${contest.duration || 'N/A'} hours`;
            const isRegistered = contest.is_registered;
            
            return `
                <div class="contest-card">
                    <div class="contest-header">
                        <h3 class="contest-title">${escapeHtml(contest.title)}</h3>
                        <span class="contest-status status-upcoming">Upcoming</span>
                    </div>
                    <p class="contest-description">${escapeHtml(contest.description || '')}</p>
                    <div class="contest-meta">
                        <span><i class="fas fa-calendar"></i> ${startDate}</span>
                        <span><i class="fas fa-clock"></i> ${duration}</span>
                    </div>
                    <div class="contest-actions">
                        ${isRegistered ? 
                            `<button class="btn btn-success" disabled><i class="fas fa-check"></i> Registered</button>` :
                            `<button class="btn btn-primary" onclick="registerForContest(${contest.id})">Register</button>`
                        }
                        <button class="btn btn-secondary" onclick="viewContestDetails(${contest.id})">View Details</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('❌ Error loading upcoming contests:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Contests</h3>
                <p>Failed to load upcoming contests. Please refresh the page.</p>
            </div>
        `;
    }
}

// Contest registration function
async function registerForContest(contestId) {
    if (!contestId) {
        showNotification('Invalid contest ID', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            showNotification('Please login to register for contests', 'error');
            setTimeout(() => window.location.href = '/login.html', 2000);
            return;
        }
        
        const response = await fetch(`/api/contests/${contestId}/register`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Successfully registered for contest!', 'success');
            // Reload both upcoming and active contests to update registration status
            await loadUpcomingContests();
            await loadActiveContests();
        } else {
            showNotification(data.message || 'Failed to register for contest', 'error');
        }
    } catch (error) {
        console.error('Error registering for contest:', error);
        showNotification('Failed to register for contest. Please try again.', 'error');
    }
}

// View contest details function
async function viewContestDetails(contestId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/contests/${contestId}/details`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch contest details');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch contest details');
        }
        
        const contest = data.contest;
        
        // Display contest details in a modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${escapeHtml(contest.title)}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="contest-details">
                        <p><strong>Description:</strong> ${escapeHtml(contest.description || 'No description available')}</p>
                        <p><strong>Start Time:</strong> ${formatDateTime(contest.start_time)}</p>
                        <p><strong>End Time:</strong> ${formatDateTime(contest.end_time)}</p>
                        <p><strong>Duration:</strong> ${contest.duration || 'N/A'} hours</p>
                        <p><strong>Total Problems:</strong> ${contest.total_problems || 0}</p>
                        <p><strong>Current Participants:</strong> ${contest.participant_count || 0}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching contest details:', error);
        showNotification('Failed to load contest details', 'error');
    }
}

// Enter contest function for active contests
async function enterContest(contestId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            showNotification('Please login to enter contests', 'error');
            setTimeout(() => window.location.href = '/login.html', 2000);
            return;
        }
        
        // Check registration status first
        const response = await fetch(`/api/contests/${contestId}/status`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showNotification(data.message || 'Failed to check contest status', 'error');
            return;
        }
        
        if (!data.is_registered) {
            showNotification('You must register for this contest before entering', 'error');
            return;
        }
        
        // Redirect to contest workspace
        window.location.href = `/contest.html?id=${contestId}`;
    } catch (error) {
        console.error('Error entering contest:', error);
        showNotification('Failed to enter contest. Please try again.', 'error');
    }
}

// Utility functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function getTimeRemaining(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) {
        return 'Contest ended';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m left`;
    } else {
        return `${minutes}m left`;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Auto-refresh contests every 30 seconds
setInterval(() => {
    loadActiveContests();
    loadUpcomingContests();
}, 30000);