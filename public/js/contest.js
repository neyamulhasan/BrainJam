// Contest page functionality
let currentContest = null;
let currentProblem = null;

document.addEventListener('DOMContentLoaded', function() {
    // Get contest ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const contestId = urlParams.get('id');
    
    if (!contestId) {
        showNotification('Invalid contest ID', 'error');
        setTimeout(() => window.location.href = '/compete.html', 2000);
        return;
    }
    
    // Check authentication
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        showNotification('Please login to access contests', 'error');
        setTimeout(() => window.location.href = '/login.html', 2000);
        return;
    }
    
    // Initialize contest page
    initializeContest(contestId);
    
    // Set up event listeners
    setupEventListeners();
    
    // Start time update interval
    setInterval(updateTimeRemaining, 1000);
});

async function initializeContest(contestId) {
    try {
        // Load contest details
        await loadContestDetails(contestId);
        
        // Load contest problems
        await loadContestProblems(contestId);
        
        // Load leaderboard
        await loadLeaderboard(contestId);
        
    } catch (error) {
        console.error('Error initializing contest:', error);
        showNotification('Failed to load contest. Please refresh the page.', 'error');
    }
}

async function loadContestDetails(contestId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/contests/${contestId}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch contest details');
        }
        
        const data = await response.json();
        currentContest = data.contest;
        
        // Update contest header
        document.getElementById('contest-title').textContent = currentContest.title;
        document.getElementById('contest-description').textContent = currentContest.description || 'No description available';
        
        // Update contest meta
        const startTime = formatDateTime(currentContest.start_time);
        const endTime = formatDateTime(currentContest.end_time);
        document.getElementById('contest-time').innerHTML = `<i class="fas fa-clock"></i> ${startTime} - ${endTime}`;
        
        // Update participant count
        const participantCount = currentContest.participant_count || 0;
        document.getElementById('contest-participants').innerHTML = `<i class="fas fa-users"></i> ${participantCount} participants`;
        
        // Update contest status
        updateContestStatus();
        
    } catch (error) {
        console.error('Error loading contest details:', error);
        throw error;
    }
}

async function loadContestProblems(contestId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/contests/${contestId}/problems`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch contest problems');
        }
        
        const data = await response.json();
        const problems = data.problems || [];
        
        const container = document.getElementById('problems-container');
        
        if (problems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <h3>No Problems Available</h3>
                    <p>This contest doesn't have any problems yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = problems.map(problem => `
            <div class="problem-card" onclick="openProblem(${problem.id})">
                <div class="problem-header">
                    <h3 class="problem-title">${escapeHtml(problem.title)}</h3>
                    <span class="problem-difficulty difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                </div>
                <div class="problem-stats">
                    <span class="problem-status status-not-attempted">
                        <i class="fas fa-circle"></i>
                        Not Attempted
                    </span>
                    <span><i class="fas fa-clock"></i> No time limit</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading contest problems:', error);
        document.getElementById('problems-container').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Problems</h3>
                <p>Failed to load contest problems. Please refresh the page.</p>
            </div>
        `;
    }
}

async function loadLeaderboard(contestId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/contests/${contestId}/leaderboard`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        const container = document.getElementById('leaderboard-container');
        
        if (!response.ok) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>Leaderboard Unavailable</h3>
                    <p>Leaderboard will be available during the contest.</p>
                </div>
            `;
            return;
        }
        
        const data = await response.json();
        const leaderboard = data.leaderboard || [];
        
        if (leaderboard.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Submissions Yet</h3>
                    <p>Be the first to solve a problem and appear on the leaderboard!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Score</th>
                        <th>Problems Solved</th>
                        <th>Last Submission</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboard.map((entry, index) => `
                        <tr>
                            <td><span class="rank rank-${index + 1}">#${index + 1}</span></td>
                            <td>${escapeHtml(entry.username)}</td>
                            <td>${entry.score}</td>
                            <td>${entry.problems_solved}</td>
                            <td>${entry.last_submission ? formatDateTime(entry.last_submission) : 'No submissions'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboard-container').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Leaderboard</h3>
                <p>Failed to load leaderboard. Please refresh the page.</p>
            </div>
        `;
    }
}

async function openProblem(problemId) {
    try {
        // Check if contest is active
        if (!isContestActive()) {
            if (isContestUpcoming()) {
                showNotification('Contest has not started yet', 'warning');
            } else {
                showNotification('Contest has ended', 'warning');
            }
            return;
        }
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/problems/${problemId}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch problem details');
        }
        
        const data = await response.json();
        currentProblem = data.problem;
        
        // Update modal content
        document.getElementById('problem-modal-title').textContent = currentProblem.title;
        document.getElementById('problem-description-content').innerHTML = `
            <h3>${escapeHtml(currentProblem.title)}</h3>
            <div class="problem-body">${currentProblem.body_md || currentProblem.description || 'No description available'}</div>
        `;
        
        // Clear code editor
        document.getElementById('code-editor').value = '';
        document.getElementById('code-output').textContent = '';
        
        // Show modal
        document.getElementById('problem-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error opening problem:', error);
        showNotification('Failed to load problem details', 'error');
    }
}

function closeProblemModal() {
    document.getElementById('problem-modal').style.display = 'none';
}

async function runCode() {
    const code = document.getElementById('code-editor').value.trim();
    const language = document.getElementById('language-select').value;
    
    if (!code) {
        showNotification('Please write some code first', 'warning');
        return;
    }
    
    try {
        document.getElementById('code-output').textContent = 'Running code...';
        
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch('/api/code/run', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                language: language,
                problem_id: currentProblem.id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('code-output').textContent = data.output || 'Code executed successfully (no output)';
        } else {
            document.getElementById('code-output').textContent = `Error: ${data.error || 'Failed to run code'}`;
        }
        
    } catch (error) {
        console.error('Error running code:', error);
        document.getElementById('code-output').textContent = 'Failed to run code. Please try again.';
    }
}

async function submitCode() {
    const code = document.getElementById('code-editor').value.trim();
    const language = document.getElementById('language-select').value;
    
    if (!code) {
        showNotification('Please write some code first', 'warning');
        return;
    }
    
    if (!currentProblem) {
        showNotification('No problem selected', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch('/api/code/submit', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                language: language,
                problem_id: currentProblem.id,
                contest_id: currentContest.id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Code submitted successfully!', 'success');
            // Refresh leaderboard
            await loadLeaderboard(currentContest.id);
            // Close modal
            closeProblemModal();
        } else {
            showNotification(data.error || 'Failed to submit code', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting code:', error);
        showNotification('Failed to submit code. Please try again.', 'error');
    }
}

function updateContestStatus() {
    if (!currentContest) return;
    
    const statusBadge = document.getElementById('contest-status-badge');
    const now = new Date();
    const startTime = new Date(currentContest.start_time);
    const endTime = new Date(currentContest.end_time);
    
    if (now < startTime) {
        statusBadge.textContent = 'Upcoming';
        statusBadge.className = 'status-badge upcoming';
    } else if (now >= startTime && now <= endTime) {
        statusBadge.textContent = 'Active';
        statusBadge.className = 'status-badge active';
    } else {
        statusBadge.textContent = 'Ended';
        statusBadge.className = 'status-badge ended';
    }
}

function updateTimeRemaining() {
    if (!currentContest) return;
    
    const timeRemainingElement = document.getElementById('time-remaining');
    const now = new Date();
    const startTime = new Date(currentContest.start_time);
    const endTime = new Date(currentContest.end_time);
    
    if (now < startTime) {
        const diff = startTime - now;
        const timeString = formatTimeDifference(diff);
        timeRemainingElement.innerHTML = `<i class="fas fa-hourglass-start"></i> <span>Starts in ${timeString}</span>`;
    } else if (now >= startTime && now <= endTime) {
        const diff = endTime - now;
        const timeString = formatTimeDifference(diff);
        timeRemainingElement.innerHTML = `<i class="fas fa-hourglass-half"></i> <span>${timeString} remaining</span>`;
    } else {
        timeRemainingElement.innerHTML = `<i class="fas fa-hourglass"></i> <span>Contest ended</span>`;
    }
    
    // Update contest status
    updateContestStatus();
}

function isContestActive() {
    if (!currentContest) return false;
    const now = new Date();
    const startTime = new Date(currentContest.start_time);
    const endTime = new Date(currentContest.end_time);
    return now >= startTime && now <= endTime;
}

function isContestUpcoming() {
    if (!currentContest) return false;
    const now = new Date();
    const startTime = new Date(currentContest.start_time);
    return now < startTime;
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    });
    
    // Code editor buttons
    document.getElementById('run-code-btn').addEventListener('click', runCode);
    document.getElementById('submit-code-btn').addEventListener('click', submitCode);
    
    // Modal close events
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('problem-modal');
        if (event.target === modal) {
            closeProblemModal();
        }
    });
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

function formatTimeDifference(diff) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
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
    
    // Add to container
    const container = document.getElementById('notification-container');
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}