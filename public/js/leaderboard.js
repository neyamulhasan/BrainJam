// Leaderboard Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    function checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            window.location.href = '/login.html';
            return null;
        }
        
        return JSON.parse(user);
    }

    // Show message
    function showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        container.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // API call helper
    async function apiCall(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('authToken');
            const user = JSON.parse(localStorage.getItem('user'));
            
            const response = await fetch(`/api/dashboard/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-User-ID': user.id?.toString() || '1',
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
            console.error('API call failed:', error);
            showMessage(`Failed to load data: ${error.message}`, 'error');
            return null;
        }
    }

    // Load global leaderboard
    async function loadGlobalLeaderboard(page = 1, rankFilter = 'all') {
        const globalLeaderboard = document.getElementById('global-leaderboard');
        globalLeaderboard.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><span>Loading global leaderboard...</span></div>';
        
        const data = await apiCall(`leaderboard/global?page=${page}&rank=${rankFilter}`);
        if (!data) return;
        
        displayLeaderboard(data.leaderboard, globalLeaderboard, data.currentUser);
        updatePagination(data.pagination);
        updateStats(data.stats, data.currentUser);
    }

    // Update statistics
    function updateStats(stats, currentUser) {
        // Update total users
        const totalUsersEl = document.getElementById('total-users');
        if (totalUsersEl && stats) {
            totalUsersEl.textContent = stats.totalUsers || '--';
        }
        
        // Update your rank badge
        const yourRankBadge = document.getElementById('your-rank-badge');
        if (yourRankBadge && currentUser) {
            const rankPosition = currentUser.position || '--';
            yourRankBadge.textContent = rankPosition === '--' ? '--' : `#${rankPosition}`;
            
            // Apply special styling for top ranks
            yourRankBadge.className = 'rank-badge large';
            if (rankPosition === 1) yourRankBadge.classList.add('rank-1');
            else if (rankPosition === 2) yourRankBadge.classList.add('rank-2');
            else if (rankPosition === 3) yourRankBadge.classList.add('rank-3');
        }
    }

    // Load starred users leaderboard
    async function loadStarredLeaderboard() {
        const starredLeaderboard = document.getElementById('starred-leaderboard');
        starredLeaderboard.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><span>Loading starred users...</span></div>';
        
        const data = await apiCall('leaderboard/starred');
        if (!data) return;
        
        displayLeaderboard(data.starred, starredLeaderboard, null, true);
        
        // Update starred users stat
        const starredStat = document.getElementById('starred-users');
        if (starredStat) {
            starredStat.textContent = data.totalStarred || 0;
        }
    }

    // Display leaderboard
    function displayLeaderboard(users, container, currentUser = null, isStarred = false) {
        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="coming-soon">
                    <i class="fas fa-${isStarred ? 'star' : 'trophy'}"></i>
                    <h3>No ${isStarred ? 'starred users' : 'users'} found</h3>
                    <p>${isStarred ? 'Star some users to see them here!' : 'No users match the current filter.'}</p>
                </div>
            `;
            return;
        }

        const leaderboardHtml = users.map(user => {
            const isCurrentUser = currentUser && user.id === currentUser.id;
            const isTop3 = user.position <= 3;
            const rankClass = isTop3 ? `rank-${user.position}` : '';
            
            return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${isStarred ? 'starred-user' : ''}">
                    <div class="leaderboard-rank-display">
                        <div class="rank-badge ${rankClass}">
                            ${isTop3 ? getTrophyIcon(user.position) : `#${user.position}`}
                        </div>
                    </div>
                    <img src="${user.avatar || '/images/default-avatar.svg'}" alt="${user.username}" class="leaderboard-avatar">
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">
                            ${user.username}
                            ${isCurrentUser ? '<span class="user-badge current-user-badge">You</span>' : ''}
                            ${isStarred && !isCurrentUser ? '<span class="user-badge starred-badge">Starred</span>' : ''}
                        </div>
                        <div class="rank-label muted">${user.rank || user.rank_label}</div>
                    </div>
                    <div class="leaderboard-rating">${user.rating}</div>
                    ${isStarred && !isCurrentUser ? `
                        <div class="leaderboard-actions">
                            <button class="starred-remove-btn-direct" 
                                    data-user-id="${user.id}" 
                                    data-username="${user.username}"
                                    title="Unstar ${user.username}">
                                <i class="fas fa-star-half-alt"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = leaderboardHtml;

        // Add event listeners to remove buttons if this is starred leaderboard
        if (isStarred) {
            container.querySelectorAll('.starred-remove-btn-direct').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const userId = btn.dataset.userId;
                    const username = btn.dataset.username;
                    
                    const confirmMessage = `Unstar ${username}?\\n\\nThis will remove them from your starred users list.`;
                    if (confirm(confirmMessage)) {
                        await handleStarredAction(userId, 'remove');
                    }
                });
            });
        }
    }

    // Get trophy icon for top 3
    function getTrophyIcon(position) {
        const icons = {
            1: '<i class="fas fa-trophy" style="color: #FFD700;"></i>',
            2: '<i class="fas fa-medal" style="color: #C0C0C0;"></i>',
            3: '<i class="fas fa-award" style="color: #CD7F32;"></i>'
        };
        return icons[position] || `#${position}`;
    }

    // Update pagination
    function updatePagination(pagination) {
        const currentPageEl = document.getElementById('current-page');
        const totalPagesEl = document.getElementById('total-pages');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (pagination) {
            currentPageEl.textContent = pagination.currentPage;
            totalPagesEl.textContent = pagination.totalPages;
            
            prevBtn.disabled = pagination.currentPage <= 1;
            nextBtn.disabled = pagination.currentPage >= pagination.totalPages;
        }
    }

    let rankChart = null;

    // Load rank progression chart
    async function loadRankChart(days = 30) {
        const chartContainer = document.querySelector('.chart-container');
        chartContainer.innerHTML = '<div class="chart-loading"><i class="fas fa-spinner fa-spin"></i><span>Loading rank progression...</span></div>';
        
        const data = await apiCall(`rank-history?days=${days}`);
        if (!data) {
            chartContainer.innerHTML = '<div class="chart-loading"><i class="fas fa-exclamation-triangle"></i><span>Failed to load rank data</span></div>';
            return;
        }
        
        // Recreate canvas
        chartContainer.innerHTML = '<canvas id="rank-chart"></canvas>';
        const ctx = document.getElementById('rank-chart').getContext('2d');
        
        // Destroy existing chart
        if (rankChart) {
            rankChart.destroy();
        }
        
        // Prepare chart data
        const labels = data.history.map(record => {
            const date = new Date(record.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const rankData = data.history.map(record => record.rank);
        const ratingData = data.history.map(record => record.rating);
        
        // Create chart
        rankChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rank Position',
                        data: rankData,
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#00ff88',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        yAxisID: 'rank'
                    },
                    {
                        label: 'Rating',
                        data: ratingData,
                        borderColor: '#ff6b35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#ff6b35',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 3,
                        yAxisID: 'rating'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 12,
                                weight: 500
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#e5e7eb',
                        borderColor: '#374151',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                const record = data.history[index];
                                return new Date(record.date).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                });
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const record = data.history[index];
                                if (context.datasetIndex === 0) {
                                    return `Rank: #${record.rank} (${record.rankLabel})`;
                                } else {
                                    return `Rating: ${record.rating}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(55, 65, 81, 0.3)'
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 11
                            }
                        }
                    },
                    rank: {
                        type: 'linear',
                        position: 'left',
                        reverse: true, // Lower rank numbers (better ranks) show higher on chart
                        grid: {
                            color: 'rgba(55, 65, 81, 0.3)'
                        },
                        ticks: {
                            color: '#00ff88',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return '#' + value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Rank Position',
                            color: '#00ff88',
                            font: {
                                size: 12,
                                weight: 600
                            }
                        }
                    },
                    rating: {
                        type: 'linear',
                        position: 'right',
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#ff6b35',
                            font: {
                                size: 11
                            }
                        },
                        title: {
                            display: true,
                            text: 'Rating',
                            color: '#ff6b35',
                            font: {
                                size: 12,
                                weight: 600
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        
        // Update statistics
        updateChartStats(data.statistics);
    }

    // Update chart statistics
    function updateChartStats(stats) {
        const rankChangeEl = document.getElementById('rank-change');
        const ratingChangeEl = document.getElementById('rating-change');
        const bestRankEl = document.getElementById('best-rank');
        
        if (rankChangeEl) {
            const change = stats.rankChange || 0;
            rankChangeEl.textContent = change > 0 ? `+${change}` : change.toString();
            rankChangeEl.className = `stat-value ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`;
        }
        
        if (ratingChangeEl) {
            const change = stats.ratingChange || 0;
            ratingChangeEl.textContent = change > 0 ? `+${change}` : change.toString();
            ratingChangeEl.className = `stat-value ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`;
        }
        
        if (bestRankEl) {
            bestRankEl.textContent = stats.bestRank ? `#${stats.bestRank}` : '--';
        }
    }

    // Handle starred user actions
    async function handleStarredAction(userId, action) {
        try {
            const response = await fetch(`/api/dashboard/starred/${action}/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'X-User-ID': JSON.parse(localStorage.getItem('user')).id?.toString() || '1'
                }
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, 'success');
                
                // Refresh current tab
                const activeTab = document.querySelector('.control-tab.active');
                if (activeTab && activeTab.dataset.tab === 'starred') {
                    await loadStarredLeaderboard();
                }
            } else {
                showMessage(result.error || 'Failed to update starred status', 'error');
            }
        } catch (error) {
            console.error('Error updating starred status:', error);
            showMessage('Failed to update starred status', 'error');
        }
    }

    // Search users functionality
    async function searchUsers(query) {
        try {
            const response = await fetch(`/api/dashboard/users/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'X-User-ID': JSON.parse(localStorage.getItem('user')).id?.toString() || '1'
                }
            });

            const result = await response.json();

            if (response.ok) {
                displaySearchResults(result.users);
            } else {
                showMessage(result.error || 'Failed to search users', 'error');
            }
        } catch (error) {
            console.error('Error searching users:', error);
            showMessage('Failed to search users', 'error');
        }
    }

    // Display search results
    function displaySearchResults(users) {
        const searchResults = document.getElementById('search-results');
        
        if (users.length === 0) {
            searchResults.innerHTML = '<div class="search-placeholder">No users found</div>';
            return;
        }

        const resultsHtml = users.map(user => `
            <div class="search-result-item">
                <div class="search-user-info">
                    <img src="${user.avatar}" alt="${user.username}" class="search-user-avatar">
                    <div class="search-user-details">
                        <div class="search-user-name">${user.username}</div>
                        <div class="search-user-rating">${user.rating} • ${user.rank}</div>
                    </div>
                </div>
                <button class="starred-action-btn ${user.isStarred ? 'starred-remove-btn' : 'starred-add-btn'}" 
                        data-user-id="${user.id}" 
                        data-action="${user.isStarred ? 'remove' : 'add'}">
                    ${user.isStarred ? 'Unstar' : 'Star User'}
                </button>
            </div>
        `).join('');

        searchResults.innerHTML = resultsHtml;

        // Add event listeners
        searchResults.querySelectorAll('.starred-action-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.userId;
                const action = btn.dataset.action;
                await handleStarredAction(userId, action);
                
                // Update button state
                if (action === 'add') {
                    btn.textContent = 'Unstar';
                    btn.className = 'starred-action-btn starred-remove-btn';
                    btn.dataset.action = 'remove';
                } else {
                    btn.textContent = 'Star User';
                    btn.className = 'starred-action-btn starred-add-btn';
                    btn.dataset.action = 'add';
                }
            });
        });
    }

    // Initialize page
    function initializePage() {
        const user = checkAuth();
        if (!user) return;

        // Load initial data
        loadRankChart();
        loadGlobalLeaderboard();
        loadStarredLeaderboard();
    }

    // Event Listeners
    
    // Tab switching
    document.querySelectorAll('.control-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.control-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-content`).classList.add('active');
            
            // Load appropriate data
            if (tabName === 'global') {
                loadGlobalLeaderboard();
            } else if (tabName === 'starred') {
                loadStarredLeaderboard();
            }
        });
    });

    // Rank filter
    document.getElementById('rank-filter').addEventListener('change', (e) => {
        const activeTab = document.querySelector('.control-tab.active');
        if (activeTab && activeTab.dataset.tab === 'global') {
            loadGlobalLeaderboard(1, e.target.value);
        }
    });

    // Chart period selector
    document.getElementById('chart-period').addEventListener('change', (e) => {
        loadRankChart(parseInt(e.target.value));
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        const activeTab = document.querySelector('.control-tab.active');
        if (activeTab) {
            const tabName = activeTab.dataset.tab;
            if (tabName === 'global') {
                loadGlobalLeaderboard();
            } else if (tabName === 'starred') {
                loadStarredLeaderboard();
            }
        }
    });

    // Star user modal
    const starUserBtn = document.getElementById('star-user-btn');
    const starUserModal = document.getElementById('star-user-modal');
    const closeStarModal = document.getElementById('close-star-modal');
    const userSearchInput = document.getElementById('user-search-input');
    const searchBtn = document.getElementById('search-btn');

    starUserBtn.addEventListener('click', () => {
        starUserModal.style.display = 'block';
        userSearchInput.value = '';
        document.getElementById('search-results').innerHTML = '<div class="search-placeholder">Enter a username to search</div>';
    });

    closeStarModal.addEventListener('click', () => {
        starUserModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === starUserModal) {
            starUserModal.style.display = 'none';
        }
    });

    // Search functionality
    searchBtn.addEventListener('click', () => {
        const query = userSearchInput.value.trim();
        if (query.length >= 2) {
            searchUsers(query);
        } else {
            showMessage('Please enter at least 2 characters to search', 'info');
        }
    });

    userSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Auto-search as user types
    let searchTimeout;
    userSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = userSearchInput.value.trim();
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                searchUsers(query);
            }, 500);
        } else if (query.length === 0) {
            document.getElementById('search-results').innerHTML = '<div class="search-placeholder">Enter a username to search</div>';
        }
    });

    // Pagination
    document.getElementById('prev-btn').addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('current-page').textContent);
        if (currentPage > 1) {
            loadGlobalLeaderboard(currentPage - 1);
        }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
        const currentPage = parseInt(document.getElementById('current-page').textContent);
        const totalPages = parseInt(document.getElementById('total-pages').textContent);
        if (currentPage < totalPages) {
            loadGlobalLeaderboard(currentPage + 1);
        }
    });

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        showMessage('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    });

    // Initialize the page
    initializePage();
});
