// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    let chart = null;
    
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
            window.location.href = '/login.html';
            return false;
        }
        
        return JSON.parse(user);
    }

    // API call helper
    async function apiCall(endpoint) {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        try {
            const response = await fetch(`/api/dashboard/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-User-ID': user.id?.toString() || '1',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            showMessage(`Failed to load ${endpoint}`, 'error');
            return null;
        }
    }

    // Load user profile
    async function loadProfile() {
        const profile = await apiCall('profile');
        if (!profile) return;

        // Update profile elements
        const profileName = document.getElementById('profile-name');
        const profileRole = document.getElementById('profile-role');
        const profileRankLabel = document.getElementById('profile-rank-label');
        const profileRating = document.getElementById('profile-rating');
        const profileAvatar = document.getElementById('profile-avatar');
        const globalRank = document.getElementById('global-rank');
        const nextRank = document.getElementById('next-rank');
        const currentPoints = document.getElementById('current-points');
        const nextRankPoints = document.getElementById('next-rank-points');
        const progressFill = document.getElementById('progress-fill');

        if (profileName) profileName.textContent = profile.name;
        if (profileRole) profileRole.textContent = 'Senior Code';
        if (profileRankLabel) profileRankLabel.textContent = `Rank: ${profile.rank}`;
        if (profileRating) profileRating.textContent = profile.rating;
        if (profileAvatar) profileAvatar.src = profile.avatar;
        
        // Enhanced global rank display with additional context
        if (globalRank) {
            let rankText = profile.globalRank;
            if (profile.usersSameRating > 1) {
                rankText += ` (tied with ${profile.usersSameRating - 1} others)`;
            }
            if (profile.totalUsers) {
                rankText += ` / ${profile.totalUsers}`;
            }
            globalRank.textContent = rankText;
        }
        
        if (nextRank) nextRank.textContent = profile.nextRank;
        if (currentPoints) currentPoints.textContent = profile.currentPoints;
        if (nextRankPoints) nextRankPoints.textContent = profile.nextRankPoints;
        
        // Update progress bar
        if (progressFill) {
            const progressPercent = profile.progressPercent || 0;
            progressFill.style.width = `${progressPercent}%`;
        }
    }

    // Load match history
    async function loadMatches() {
        const matches = await apiCall('matches');
        if (!matches) return;

        const tbody = document.getElementById('match-history-body');
        if (!tbody) return;

        if (matches.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-cell">No matches found</td></tr>';
            return;
        }

        tbody.innerHTML = matches.map(match => {
            const resultClass = match.result === 'Win' ? 'result-win' : 
                               match.result === 'Loss' ? 'result-loss' : 'result-draw';
            const ratingClass = match.ratingChange.startsWith('+') ? 'rating-positive' : 'rating-negative';
            
            return `
                <tr>
                    <td>${match.date}</td>
                    <td>${match.opponent}</td>
                    <td class="${resultClass}">${match.result}</td>
                    <td class="${ratingClass}">${match.ratingChange}</td>
                </tr>
            `;
        }).join('');
    }

    // Load statistics
    async function loadStats() {
        const stats = await apiCall('stats');
        if (!stats) return;

        const problemsSolved = document.getElementById('problems-solved');
        const languagesUsed = document.getElementById('languages-used');
        const avgSolveTime = document.getElementById('avg-solve-time');
        const contestCount = document.getElementById('contest-count');
        const winCount = document.getElementById('win-count');
        const streakDays = document.getElementById('streak-days');

        if (problemsSolved) problemsSolved.textContent = stats.problemsSolved;
        if (languagesUsed) languagesUsed.textContent = stats.languagesUsed;
        if (avgSolveTime) avgSolveTime.textContent = stats.avgSolveTime;
        if (contestCount) contestCount.textContent = stats.contestCount;
        if (winCount) winCount.textContent = stats.winCount;
        if (streakDays) streakDays.textContent = stats.streakDays;

        // Load language chart
        loadLanguageChart(stats.solvedByLanguage);
    }

    // Load language chart
    function loadLanguageChart(languageData) {
        const canvas = document.getElementById('languageChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (chart) {
            chart.destroy();
        }

        const languages = Object.keys(languageData);
        const counts = Object.values(languageData);
        const colors = ['#00d4ff', '#ff6b35', '#00ff88', '#ffaa00', '#ff4757', '#9c88ff'];

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: languages,
                datasets: [{
                    data: counts,
                    backgroundColor: colors.slice(0, languages.length),
                    borderColor: colors.slice(0, languages.length),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1a1a25',
                        titleColor: '#ffffff',
                        bodyColor: '#b8c5d1',
                        borderColor: '#2a2d3a',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Problems solved: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#b8c5d1',
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: '#2a2d3a',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#b8c5d1',
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Load achievements
    async function loadAchievements() {
        const achievements = await apiCall('achievements');
        if (!achievements) return;

        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        if (achievements.length === 0) {
            grid.innerHTML = '<div class="achievement-placeholder">No achievements earned yet</div>';
            return;
        }

        // Achievement icons mapping
        const achievementIcons = {
            'first_solve': '<i class="fas fa-bullseye"></i>',
            'speed_demon': '<i class="fas fa-bolt"></i>',
            'multi_lang': '<i class="fas fa-globe"></i>',
            'contest_warrior': '<i class="fas fa-sword"></i>',
            'problem_crusher': '<i class="fas fa-fist-raised"></i>',
            'default': '<i class="fas fa-trophy"></i>'
        };

        grid.innerHTML = achievements.map(achievement => `
            <div class="achievement-item" title="${achievement.description}">
                <div class="achievement-icon">${achievementIcons[achievement.code] || achievementIcons.default}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `).join('');
    }

    // Load recent activity
    async function loadActivity() {
        const activity = await apiCall('activity');
        if (!activity) return;

        const list = document.getElementById('activity-list');
        if (!list) return;

        let activityHtml = '';

        // Add recent submissions
        if (activity.submissions && activity.submissions.length > 0) {
            activity.submissions.slice(0, 5).forEach(submission => {
                const timeAgo = getTimeAgo(new Date(submission.created_at));
                const statusClass = submission.status === 'Accepted' ? 'accepted' : 'wrong';
                activityHtml += `
                    <div class="activity-item">
                        <div class="activity-header">
                            <div class="activity-title">${submission.problem_title}</div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                        <div class="activity-details">
                            <span class="activity-status ${statusClass}">${submission.status}</span>
                            ${submission.language_name} • ${submission.difficulty}
                            ${submission.execution_time_ms ? ` • ${submission.execution_time_ms}ms` : ''}
                        </div>
                    </div>
                `;
            });
        }

        // Add recent contest participations
        if (activity.contests && activity.contests.length > 0) {
            activity.contests.slice(0, 2).forEach(contest => {
                const timeAgo = getTimeAgo(new Date(contest.joined_at));
                activityHtml += `
                    <div class="activity-item">
                        <div class="activity-header">
                            <div class="activity-title">Joined ${contest.title}</div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                        <div class="activity-details">
                            ${contest.rank ? `Ranked #${contest.rank}` : 'Participated'}
                            ${contest.score ? ` • Score: ${contest.score}` : ''}
                        </div>
                    </div>
                `;
            });
        }

        // Add recent badge earnings
        if (activity.badges && activity.badges.length > 0) {
            activity.badges.forEach(badge => {
                const timeAgo = getTimeAgo(new Date(badge.earned_at));
                activityHtml += `
                    <div class="activity-item">
                        <div class="activity-header">
                            <div class="activity-title"><i class="fas fa-trophy"></i> Earned ${badge.name}</div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                        <div class="activity-details">${badge.description}</div>
                    </div>
                `;
            });
        }

        if (activityHtml === '') {
            list.innerHTML = '<div class="activity-placeholder">No recent activity</div>';
        } else {
            list.innerHTML = activityHtml;
        }
    }

    // Load global leaderboard
    async function loadGlobalLeaderboard() {
        const leaderboard = await apiCall('leaderboard');
        if (!leaderboard) return;

        const list = document.getElementById('global-leaderboard-list');
        if (!list) return;

        let leaderboardHtml = '';

        // Add top users
        if (leaderboard.topUsers && leaderboard.topUsers.length > 0) {
            // Show top 10 users
            const topTen = leaderboard.topUsers.slice(0, 10);
            topTen.forEach(user => {
                const isCurrentUser = leaderboard.currentUser && user.username === leaderboard.currentUser.username;
                leaderboardHtml += `
                    <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                        <div class="leaderboard-rank">#${user.position}</div>
                        <img src="${user.avatar}" alt="${user.username}" class="leaderboard-avatar">
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">${user.username} ${isCurrentUser ? '(You)' : ''}</div>
                            <div class="leaderboard-rank-label">${user.rank}</div>
                        </div>
                        <div class="leaderboard-rating">${user.rating}</div>
                    </div>
                `;
            });
        }

        // Add separator if current user is not in top 10
        if (leaderboard.currentUser && leaderboard.currentUser.position > 10) {
            leaderboardHtml += `
                <div class="leaderboard-separator">
                    <div class="separator-line"></div>
                    <div class="separator-text">...</div>
                    <div class="separator-line"></div>
                </div>
            `;
            
            // Show context users around current user's rank
            if (leaderboard.contextUsers && leaderboard.contextUsers.length > 0) {
                leaderboard.contextUsers.forEach(user => {
                    const isCurrentUser = user.username === leaderboard.currentUser.username;
                    leaderboardHtml += `
                        <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                            <div class="leaderboard-rank">#${user.position}</div>
                            <img src="${user.avatar}" alt="${user.username}" class="leaderboard-avatar">
                            <div class="leaderboard-info">
                                <div class="leaderboard-name">${user.username} ${isCurrentUser ? '(You)' : ''}</div>
                                <div class="leaderboard-rank-label">${user.rank}</div>
                            </div>
                            <div class="leaderboard-rating">${user.rating}</div>
                        </div>
                    `;
                });
            } else {
                // Fallback: show just current user
                leaderboardHtml += `
                    <div class="leaderboard-item current-user">
                        <div class="leaderboard-rank">#${leaderboard.currentUser.position}</div>
                        <img src="${leaderboard.currentUser.avatar_url || '/images/default-avatar.svg'}" alt="${leaderboard.currentUser.username}" class="leaderboard-avatar">
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">${leaderboard.currentUser.username} (You)</div>
                            <div class="leaderboard-rank-label">${leaderboard.currentUser.rank_label}</div>
                        </div>
                        <div class="leaderboard-rating">${leaderboard.currentUser.rating}</div>
                    </div>
                `;
            }
        }

        list.innerHTML = leaderboardHtml || '<div class="leaderboard-placeholder">No leaderboard data available</div>';
    }

    // Load starred users leaderboard
    async function loadStarredLeaderboard() {
        const starredData = await apiCall('leaderboard/starred');
        if (!starredData) return;

        const list = document.getElementById('starred-leaderboard-list');
        const starredCount = document.getElementById('starred-count');
        
        if (!list) return;

        // Update starred count
        if (starredCount) {
            const count = starredData.totalStarred;
            starredCount.textContent = `${count} starred user${count !== 1 ? 's' : ''}`;
        }

        let leaderboardHtml = '';

        if (starredData.starred && starredData.starred.length > 0) {
            starredData.starred.forEach(user => {
                const isCurrentUser = user.isCurrentUser;
                leaderboardHtml += `
                    <div class="leaderboard-item ${isCurrentUser ? 'current-user' : 'starred-user'}">
                        <div class="leaderboard-rank">#${user.position}</div>
                        <img src="${user.avatar}" alt="${user.username}" class="leaderboard-avatar">
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">
                                ${user.username} 
                                ${isCurrentUser ? '(You)' : ''}
                            </div>
                            <div class="leaderboard-rank-label">${user.rank}</div>
                            <div class="user-badges">
                                ${isCurrentUser ? '<span class="user-badge current-user-badge">You</span>' : '<span class="user-badge starred-badge">Starred</span>'}
                            </div>
                        </div>
                        <div class="leaderboard-rating">${user.rating}</div>
                    </div>
                `;
            });
        } else {
            leaderboardHtml = `
                <div class="leaderboard-placeholder">
                    <div style="text-align: center; padding: 40px 20px;">
                        <i class="fas fa-star" style="font-size: 48px; color: var(--text-muted); margin-bottom: 15px;"></i>
                        <p style="color: var(--text-muted); margin-bottom: 15px;">No starred users yet</p>
                        <button class="btn-primary" onclick="document.getElementById('add-starred-btn').click()">
                            <i class="fas fa-star"></i> Star Your First User
                        </button>
                    </div>
                </div>
            `;
        }

        list.innerHTML = leaderboardHtml;
    }

    // Legacy function for compatibility
    async function loadLeaderboard() {
        await loadGlobalLeaderboard();
        await loadStarredLeaderboard();
    }

    // Helper function to calculate time ago
    function getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Logout functionality
    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        showMessage('Logged out successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    }

    // Event listeners
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Edit Profile Modal functionality
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelEdit = document.getElementById('cancel-edit');
    const editProfileForm = document.getElementById('edit-profile-form');
    const profileEmailInput = document.getElementById('profile-email');
    const profileAvatarUrlInput = document.getElementById('profile-avatar-url');
    const avatarPreview = document.getElementById('avatar-preview');

    // Open edit profile modal
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', async () => {
            try {
                // Fetch current user data
                const response = await fetch('/api/dashboard/profile/email', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'X-User-ID': JSON.parse(localStorage.getItem('user')).id?.toString() || '1'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    profileEmailInput.value = userData.email || '';
                    profileAvatarUrlInput.value = userData.avatar_url || '';
                    avatarPreview.src = userData.avatar_url || '/images/default-avatar.svg';
                }

                editProfileModal.style.display = 'block';
            } catch (error) {
                console.error('Error loading profile data:', error);
                showMessage('Failed to load profile data', 'error');
            }
        });
    }

    // Close modal handlers
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            editProfileModal.style.display = 'none';
        });
    }

    if (cancelEdit) {
        cancelEdit.addEventListener('click', () => {
            editProfileModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
    });

    // Avatar URL preview
    if (profileAvatarUrlInput && avatarPreview) {
        profileAvatarUrlInput.addEventListener('input', () => {
            const url = profileAvatarUrlInput.value.trim();
            if (url === '') {
                avatarPreview.src = '/images/default-avatar.svg';
            } else {
                // Check if it's a valid image URL
                const img = new Image();
                img.onload = () => {
                    avatarPreview.src = url;
                };
                img.onerror = () => {
                    avatarPreview.src = '/images/default-avatar.svg';
                };
                img.src = url;
            }
        });
    }

    // Submit profile update
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                email: profileEmailInput.value.trim(),
                avatar_url: profileAvatarUrlInput.value.trim()
            };

            try {
                const response = await fetch('/api/dashboard/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'X-User-ID': JSON.parse(localStorage.getItem('user')).id?.toString() || '1'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage('Profile updated successfully!', 'success');
                    editProfileModal.style.display = 'none';
                    
                    // Refresh profile data
                    await loadProfile();
                } else {
                    showMessage(result.error || 'Failed to update profile', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showMessage('Failed to update profile', 'error');
            }
        });
    }

    // Test Solve Problem functionality (for demonstrating ranking system)
    const testSolveBtn = document.getElementById('test-solve-btn');
    if (testSolveBtn) {
        testSolveBtn.addEventListener('click', async () => {
            try {
                const ratingIncrease = Math.floor(Math.random() * 100) + 25; // Random 25-125 points
                
                const response = await fetch('/api/dashboard/simulate-solve', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'X-User-ID': JSON.parse(localStorage.getItem('user')).id?.toString() || '1'
                    },
                    body: JSON.stringify({ ratingIncrease })
                });

                const result = await response.json();

                if (response.ok) {
                    const { username, oldRating, newRating, ratingIncrease, oldRank, newRank, promoted, message } = result;
                    
                    showMessage(message, promoted ? 'success' : 'info');
                    
                    // Show detailed info in console for debugging
                    console.log(`Problem solved by ${username}!`);
                    console.log(`Rating: ${oldRating} → ${newRating} (+${ratingIncrease})`);
                    console.log(`Rank: ${oldRank} → ${newRank}`);
                    
                    // Refresh profile data to show updated rating and rank
                    await loadProfile();
                } else {
                    showMessage(result.error || 'Failed to solve problem', 'error');
                }
            } catch (error) {
                console.error('Error solving problem:', error);
                showMessage('Failed to solve problem', 'error');
            }
        });
    }

    // Leaderboard tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Load appropriate data
            if (tabName === 'starred') {
                loadStarredLeaderboard();
            } else {
                loadGlobalLeaderboard();
            }
        });
    });

    // Star User Modal functionality
    const addStarredBtn = document.getElementById('add-starred-btn');
    const addStarredModal = document.getElementById('add-starred-modal');
    const closeStarredModal = document.getElementById('close-starred-modal');
    const starredSearch = document.getElementById('starred-search');
    const searchUsersBtn = document.getElementById('search-users-btn');
    const searchResults = document.getElementById('search-results');

    // Open star user modal
    if (addStarredBtn) {
        addStarredBtn.addEventListener('click', () => {
            addStarredModal.style.display = 'block';
            starredSearch.value = '';
            searchResults.innerHTML = '<div class="search-placeholder">Enter a username to search</div>';
        });
    }

    // Close modal handlers
    if (closeStarredModal) {
        closeStarredModal.addEventListener('click', () => {
            addStarredModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === addStarredModal) {
            addStarredModal.style.display = 'none';
        }
    });

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

        // Add event listeners to starred action buttons
        searchResults.querySelectorAll('.starred-action-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.userId;
                const action = btn.dataset.action;
                await handleStarredAction(userId, action, btn);
            });
        });
    }

    // Handle starred add/remove
    async function handleStarredAction(userId, action, button) {
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
                
                // Update button state
                if (action === 'add') {
                    button.textContent = 'Unstar';
                    button.className = 'starred-action-btn starred-remove-btn';
                    button.dataset.action = 'remove';
                } else {
                    button.textContent = 'Star User';
                    button.className = 'starred-action-btn starred-add-btn';
                    button.dataset.action = 'add';
                }

                // Refresh starred leaderboard if on starred tab
                const starredTab = document.getElementById('starred-tab');
                if (starredTab && starredTab.classList.contains('active')) {
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

    // Search on button click
    if (searchUsersBtn) {
        searchUsersBtn.addEventListener('click', () => {
            const query = starredSearch.value.trim();
            if (query.length >= 2) {
                searchUsers(query);
            } else {
                showMessage('Please enter at least 2 characters to search', 'info');
            }
        });
    }

    // Search on Enter key
    if (starredSearch) {
        starredSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchUsersBtn.click();
            }
        });

        // Auto-search as user types (with debounce)
        let searchTimeout;
        starredSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = starredSearch.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    searchUsers(query);
                }, 500);
            } else if (query.length === 0) {
                searchResults.innerHTML = '<div class="search-placeholder">Enter a username to search</div>';
            }
        });
    }

    // Initialize dashboard
    async function initializeDashboard() {
        const user = checkAuth();
        if (!user) return;

        showMessage('Loading dashboard...', 'info');

        try {
            await Promise.all([
                loadProfile(),
                loadMatches(),
                loadStats(),
                loadAchievements(),
                loadActivity(),
                loadLeaderboard()
            ]);
            
            showMessage('Dashboard loaded successfully!', 'success');
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            showMessage('Failed to load dashboard data', 'error');
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            logout();
        }
        
        if (e.key === 'Escape') {
            const messageContainer = document.getElementById('message-container');
            messageContainer.innerHTML = '';
        }
    });

    // Handle page visibility change
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('Dashboard paused (tab not visible)');
        } else {
            console.log('Dashboard resumed (tab visible)');
        }
    });

    // Start the dashboard
    initializeDashboard();

    // Periodic data refresh (every 5 minutes)
    setInterval(() => {
        console.log('Refreshing dashboard data...');
        loadProfile();
        loadMatches();
        loadStats();
        loadActivity();
        loadLeaderboard();
    }, 5 * 60 * 1000);
});
