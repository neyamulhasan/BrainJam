// Leaderboard Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    function checkAuth() {
        try {
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('user');
            
            // Always return a demo user for testing - we want to show the leaderboard
            // even if there's no auth data
            if (!token || !userData) {
                console.log('No auth token or user data found, using demo user');
                // Instead of redirecting, use a demo account
                return { id: 1, username: 'Demo User' };
            }
            
            try {
                return JSON.parse(userData);
            } catch (e) {
                console.error('Failed to parse user data:', e);
                return { id: 1, username: 'Demo User' };
            }
        } catch (error) {
            console.error('Auth check error:', error);
            return { id: 1, username: 'Demo User' };
        }
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
            console.log(`Making API call to ${endpoint}`);
            const token = localStorage.getItem('authToken');
            let user;
            
            try {
                const userData = localStorage.getItem('user');
                user = userData ? JSON.parse(userData) : { id: 1 };
            } catch (e) {
                console.error('Error parsing user data:', e);
                user = { id: 1 };
            }
            
            console.log('Using user ID:', user.id);
            
            const response = await fetch(`/api/dashboard/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token || 'dummy-token'}`,
                    'X-User-ID': user.id?.toString() || '1',
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                console.error(`API response not OK: ${response.status} ${response.statusText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response data:', data);
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            showMessage(`Failed to load data: ${error.message}`, 'error');
            return null;
        }
    }

    // Load global leaderboard
    async function loadGlobalLeaderboard(page = 1, rankFilter = 'all') {
        console.log('Loading global leaderboard...');
        const globalLeaderboard = document.getElementById('global-leaderboard');
        globalLeaderboard.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><span>Loading global leaderboard...</span></div>';
        
        try {
            console.log(`Calling API: leaderboard/global?page=${page}&rank=${rankFilter}`);
            const data = await apiCall(`leaderboard/global?page=${page}&rank=${rankFilter}`);
            console.log('API response:', data);
            
            if (!data || !data.leaderboard) {
                console.error('No leaderboard data in response:', data);
                globalLeaderboard.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-circle"></i><span>Failed to load leaderboard data. Please refresh and try again.</span></div>';
                return;
            }
            
            displayLeaderboard(data.leaderboard, globalLeaderboard, data.currentUser);
            updatePagination(data.pagination);
            updateStats(data.stats, data.currentUser);
        } catch (error) {
            console.error('Error in loadGlobalLeaderboard:', error);
            globalLeaderboard.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-circle"></i><span>Error loading leaderboard: ' + error.message + '</span></div>';
        }
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
    async function initializePage() {
        console.log('Initializing leaderboard page...');
        try {
            // Always get a user (even if it's a demo user)
            const user = checkAuth();
            console.log('Authentication check result:', user);
            
            // Set up event listeners
            setupEventListeners();
            
            // Load data in parallel
            try {
                await Promise.all([
                    loadRankChart().catch(err => console.error('Error loading rank chart:', err)),
                    loadGlobalLeaderboard().catch(err => console.error('Error loading global leaderboard:', err)),
                    loadStarredLeaderboard().catch(err => console.error('Error loading starred leaderboard:', err))
                ]);
            } catch (loadError) {
                console.error('Error loading data:', loadError);
                // Individual error handling in each load function, so we don't need to do anything else here
            }
        } catch (error) {
            console.error('Error initializing page:', error);
            showMessage('Error initializing page: ' + error.message, 'error');
        }
    }

    // Set up all event listeners
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
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
        const rankFilter = document.getElementById('rank-filter');
        if (rankFilter) {
            rankFilter.addEventListener('change', () => {
                const selectedRank = rankFilter.value;
                loadGlobalLeaderboard(1, selectedRank);
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const currentPage = parseInt(document.getElementById('current-page').textContent);
                if (currentPage > 1) {
                    const rankFilter = document.getElementById('rank-filter').value;
                    loadGlobalLeaderboard(currentPage - 1, rankFilter);
                }
            });
        }

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const currentPage = parseInt(document.getElementById('current-page').textContent);
                const totalPages = parseInt(document.getElementById('total-pages').textContent);
                if (currentPage < totalPages) {
                    const rankFilter = document.getElementById('rank-filter').value;
                    loadGlobalLeaderboard(currentPage + 1, rankFilter);
                }
            });
        }

        // Chart period
        const chartPeriod = document.getElementById('chart-period');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', () => {
                const days = parseInt(chartPeriod.value);
                loadRankChart(days);
            });
        }

        // Star User
        const starUserBtn = document.getElementById('star-user-btn');
        if (starUserBtn) {
            starUserBtn.addEventListener('click', () => {
                document.getElementById('star-user-modal').style.display = 'block';
            });
        }

        // Close star modal
        const closeStarModal = document.getElementById('close-star-modal');
        if (closeStarModal) {
            closeStarModal.addEventListener('click', () => {
                document.getElementById('star-user-modal').style.display = 'none';
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const activeTab = document.querySelector('.control-tab.active').dataset.tab;
                if (activeTab === 'global') {
                    const currentPage = parseInt(document.getElementById('current-page').textContent);
                    const rankFilter = document.getElementById('rank-filter').value;
                    loadGlobalLeaderboard(currentPage, rankFilter);
                } else if (activeTab === 'starred') {
                    loadStarredLeaderboard();
                }
            });
        }

        // Window click for modals
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('star-user-modal');
            if (modal && e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const userSearchInput = document.getElementById('user-search-input');
        
        if (searchBtn && userSearchInput) {
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
        }

        console.log('Event listeners set up successfully');
    }

    // Initialize the page
    initializePage();
});