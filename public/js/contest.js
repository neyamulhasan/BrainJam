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
    
    // Show loading state
    showLoadingState();
    
    // Initialize contest page
    initializeContest(contestId);
    
    // Set up event listeners
    setupEventListeners();
    
    // Start time update interval
    setInterval(updateTimeRemaining, 1000);
});

function showLoadingState() {
    document.getElementById('contest-title').textContent = 'Loading Contest...';
    document.getElementById('contest-description').textContent = 'Please wait while we load the contest details.';
    document.getElementById('contest-time').innerHTML = '<i class="fas fa-clock"></i> Loading...';
    document.getElementById('contest-participants').innerHTML = '<i class="fas fa-users"></i> Loading...';
    document.getElementById('contest-status-badge').textContent = 'Loading...';
    document.getElementById('time-remaining').innerHTML = '<i class="fas fa-hourglass-half"></i> <span>Loading...</span>';
}

async function initializeContest(contestId) {
    try {
        // Load contest details
        await loadContestDetails(contestId);
        
        // Load contest problems
        await loadContestProblems(contestId);
        
        // Load leaderboard
        await loadLeaderboard(contestId);
        
    } catch (error) {
        showNotification('Failed to load contest. Please refresh the page.', 'error');
    }
}

async function loadContestDetails(contestId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        // First check if user is registered for this contest
        const statusResponse = await fetch(`/api/contests/${contestId}/status`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!statusResponse.ok) {
            throw new Error('Contest not found or access denied');
        }
        
        const statusData = await statusResponse.json();
        
        if (!statusData.is_registered) {
            // Show registration required message
            document.getElementById('contest-title').textContent = 'Registration Required';
            document.getElementById('contest-description').textContent = 'You must register for this contest before you can access it.';
            document.getElementById('contest-time').innerHTML = '<i class="fas fa-lock"></i> Access Restricted';
            document.getElementById('contest-participants').innerHTML = '<i class="fas fa-users"></i> Registration Required';
            
            showNotification('You must register for this contest before entering', 'error');
            setTimeout(() => window.location.href = '/compete.html', 3000);
            return;
        }
        
        // Load detailed contest info
        const response = await fetch(`/api/contests/${contestId}/info`, {
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
            throw new Error(data.error || 'Failed to load contest details');
        }
        
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
        // Show user-friendly error message
        document.getElementById('contest-title').textContent = 'Error Loading Contest';
        document.getElementById('contest-description').textContent = error.message;
        document.getElementById('contest-time').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Unable to load contest information';
        document.getElementById('contest-participants').innerHTML = '<i class="fas fa-users"></i> --';
        
        showNotification(error.message, 'error');
        
        // Redirect back to compete page after a delay
        setTimeout(() => {
            if (confirm('Would you like to go back to the compete page?')) {
                window.location.href = '/compete.html';
            }
        }, 3000);
        
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
        const problemsHtml = problems.map((problem, index) => `
            <div class="problem-card" onclick="openProblem(${problem.id}, '${escapeHtml(problem.title)}')" style="cursor: pointer; transition: all 0.3s ease;">
                <div class="problem-header">
                    <h3 class="problem-title">
                        <span class="problem-number">${String.fromCharCode(65 + index)}.</span>
                        ${escapeHtml(problem.title)}
                    </h3>
                    <span class="problem-difficulty difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                </div>
                <div class="problem-stats">
                    <span class="problem-status status-not-attempted" id="problem-status-${problem.id}">
                        <i class="fas fa-circle"></i>
                        Not Attempted
                    </span>
                    <span class="problem-points">
                        <i class="fas fa-star"></i>
                        ${getDifficultyPoints(problem.difficulty)} points
                    </span>
                </div>
                <div class="problem-description-preview">
                    ${escapeHtml((problem.description || problem.body_md || '').substring(0, 100))}...
                </div>
                <div class="problem-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openProblem(${problem.id}, '${escapeHtml(problem.title)}')">
                        <i class="fas fa-code"></i> Solve
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = problemsHtml;
    } catch (error) {
        document.getElementById('problems-container').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Problems</h3>
                <p>Failed to load contest problems. Please refresh the page.</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Refresh Page
                </button>
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
        timeRemainingElement.style.color = '#ffd700';
    } else if (now >= startTime && now <= endTime) {
        const diff = endTime - now;
        const timeString = formatTimeDifference(diff);
        
        // Add urgency styling
        if (diff < 30 * 60 * 1000) { // Less than 30 minutes
            timeRemainingElement.innerHTML = `<i class="fas fa-hourglass-half"></i> <span style="color: #ff4757; font-weight: bold; animation: pulse 2s infinite;">${timeString} remaining</span>`;
        } else if (diff < 60 * 60 * 1000) { // Less than 1 hour
            timeRemainingElement.innerHTML = `<i class="fas fa-hourglass-half"></i> <span style="color: #ff6b6b; font-weight: bold;">${timeString} remaining</span>`;
        } else {
            timeRemainingElement.innerHTML = `<i class="fas fa-hourglass-half"></i> <span style="color: #00ff88;">${timeString} remaining</span>`;
        }
    } else {
        timeRemainingElement.innerHTML = `<i class="fas fa-flag-checkered"></i> <span style="color: #888;">Contest ended</span>`;
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

// Problem solving functions
async function openProblem(problemId, problemTitle) {
    try {
        currentProblem = { id: problemId, title: problemTitle };
        
        // Show modal
        const modal = document.getElementById('problem-modal');
        const modalTitle = document.getElementById('problem-modal-title');
        modalTitle.textContent = problemTitle;
        
        // Show loading state
        document.getElementById('problem-description-content').innerHTML = '<div class="loading">Loading problem...</div>';
        
        modal.style.display = 'block';
        
        // Load problem details
        await loadProblemDetails(problemId);
        
    } catch (error) {
        showNotification('Failed to load problem', 'error');
    }
}

async function loadProblemDetails(problemId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/practice/problems/${problemId}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch problem details');
        }
        
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error('Invalid problem data received');
        }
        
        const problem = result.data;
        
        // Update problem description
        const descriptionContent = document.getElementById('problem-description-content');
        descriptionContent.innerHTML = `
            <div class="problem-details">
                <div class="problem-info">
                    <span class="difficulty-badge difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
                    <span class="points-badge">${getDifficultyPoints(problem.difficulty)} points</span>
                </div>
                <div class="problem-description">
                    ${problem.body_md || 'No description available'}
                </div>
                ${problem.input_format ? `
                    <div class="problem-section">
                        <h4><i class="fas fa-download"></i> Input Format</h4>
                        <p>${escapeHtml(problem.input_format)}</p>
                    </div>
                ` : ''}
                ${problem.output_format ? `
                    <div class="problem-section">
                        <h4><i class="fas fa-upload"></i> Output Format</h4>
                        <p>${escapeHtml(problem.output_format)}</p>
                    </div>
                ` : ''}
                ${problem.constraints_md ? `
                    <div class="problem-section">
                        <h4><i class="fas fa-exclamation-triangle"></i> Constraints</h4>
                        <div>${problem.constraints_md}</div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Load examples separately if needed
        await loadProblemExamples(problemId);
        // Load saved code if any
        const savedCode = localStorage.getItem(`contest-${currentContest.id}-problem-${problemId}-code`);
        const savedLanguage = localStorage.getItem(`contest-${currentContest.id}-problem-${problemId}-language`);
        
        if (savedCode) {
            document.getElementById('code-editor').value = savedCode;
        } else {
            // Set default template based on language
            setDefaultCodeTemplate();
        }
        
        if (savedLanguage) {
            document.getElementById('language-select').value = savedLanguage;
        }
        
    } catch (error) {
        document.getElementById('problem-description-content').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Problem</h3>
                <p>Failed to load problem details. Please try again.</p>
            </div>
        `;
    }
}

// Function to load problem examples
async function loadProblemExamples(problemId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const response = await fetch(`/api/practice/problems/${problemId}/examples`, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                // Add examples to the problem description
                const descriptionContent = document.getElementById('problem-description-content');
                const examplesHtml = `
                    <div class="problem-section">
                        <h4><i class="fas fa-code"></i> Examples</h4>
                        ${result.data.map((example, idx) => `
                            <div class="example">
                                <div class="example-header">Example ${idx + 1}</div>
                                <div class="example-content">
                                    <div class="example-input">
                                        <strong>Input:</strong>
                                        <pre>${escapeHtml(example.input_text || '')}</pre>
                                    </div>
                                    <div class="example-output">
                                        <strong>Output:</strong>
                                        <pre>${escapeHtml(example.output_text || '')}</pre>
                                    </div>
                                    ${example.explanation ? `
                                        <div class="example-explanation">
                                            <strong>Explanation:</strong>
                                            <p>${escapeHtml(example.explanation)}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                descriptionContent.innerHTML += examplesHtml;
            }
        }
    } catch (error) {
        // Examples are optional, so don't show error to user
    }
}

function closeProblemModal() {
    const modal = document.getElementById('problem-modal');
    modal.style.display = 'none';
    
    // Save current code
    if (currentProblem && currentContest) {
        const code = document.getElementById('code-editor').value;
        const language = document.getElementById('language-select').value;
        localStorage.setItem(`contest-${currentContest.id}-problem-${currentProblem.id}-code`, code);
        localStorage.setItem(`contest-${currentContest.id}-problem-${currentProblem.id}-language`, language);
    }
}

function setDefaultCodeTemplate() {
    const language = document.getElementById('language-select').value;
    const editor = document.getElementById('code-editor');
    
    const templates = {
        javascript: `function solve() {
    // Your solution here
    const input = readline();
}

solve();`,
        python: `def solve():
    # Your solution here
    line = input().strip()
    
    print("Hello World")

solve()`,
        java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Your solution here
        System.out.println("Hello World");
        
        scanner.close();
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Your solution here
    
    cout << "Hello World" << endl;
    return 0;
}`
    };
    
    editor.value = templates[language] || '// Your solution here';
}

async function runCode() {
    if (!isContestActive()) {
        showNotification('Contest is not active. You can only run code during active contests.', 'warning');
        return;
    }
    
    const code = document.getElementById('code-editor').value;
    const language = document.getElementById('language-select').value;
    
    if (!code.trim()) {
        showNotification('Please write some code first', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const urlParams = new URLSearchParams(window.location.search);
        const contestId = urlParams.get('id');
        
        document.getElementById('code-output').innerHTML = '<div class="loading">Running code...</div>';
        
        const response = await fetch('/api/practice/test-solution', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problemId: currentProblem.id,
                code: code,
                language: language
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            displayTestResults(result.data);
        } else {
            document.getElementById('code-output').innerHTML = `
                <div class="error-output">
                    <strong>Error:</strong> ${result.error || 'Failed to run code'}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('code-output').innerHTML = `
            <div class="error-output">
                <strong>Network Error:</strong> ${error.message}
            </div>
        `;
    }
}

async function submitCode() {
    if (!isContestActive()) {
        showNotification('Contest is not active. You can only submit during active contests.', 'warning');
        return;
    }
    
    const code = document.getElementById('code-editor').value;
    const language = document.getElementById('language-select').value;
    
    if (!code.trim()) {
        showNotification('Please write some code first', 'warning');
        return;
    }
    
    if (!confirm('Are you sure you want to submit this solution?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        document.getElementById('code-output').innerHTML = '<div class="loading">Submitting solution...</div>';
        
        // First, submit to the practice API for evaluation
        const response = await fetch('/api/practice/submit-solution', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                problemId: currentProblem.id,
                code: code,
                language: language
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const submission = result.data;
            
            // Track the submission in contest system
            try {
                const contestSubmissionResponse = await fetch(`/api/contests/${currentContest.id}/submit/${currentProblem.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: submission.status,
                        score: submission.score || 0
                    })
                });
                
                const contestResult = await contestSubmissionResponse.json();
                
                if (submission.status === 'Accepted') {
                    let message = `🎉 Solution Accepted! Score: ${submission.score}%`;
                    
                    // Check if user completed all problems
                    if (contestResult.allProblemsCompleted) {
                        message += '\n\n🏆 Congratulations! You have solved all problems in this contest!';
                        
                        // Check for achievements
                        setTimeout(async () => {
                            await checkContestAchievements();
                        }, 1000);
                    }
                    
                    showNotification(message, 'success');
                    
                    // Update problem status in UI
                    const statusElement = document.getElementById(`problem-status-${currentProblem.id}`);
                    if (statusElement) {
                        statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Solved';
                        statusElement.className = 'problem-status status-solved';
                    }
                    
                    // Close modal after a delay
                    setTimeout(() => {
                        closeProblemModal();
                        // Reload leaderboard
                        loadLeaderboard(currentContest.id);
                    }, 2000);
                    
                } else {
                    showNotification(`❌ ${submission.status || 'Wrong Answer'}. Try again!`, 'error');
                }
            } catch (contestError) {
                // Continue with regular submission flow even if contest tracking fails
                if (submission.status === 'Accepted') {
                    showNotification(`🎉 Solution Accepted! Score: ${submission.score}%`, 'success');
                } else {
                    showNotification(`❌ ${submission.status || 'Wrong Answer'}. Try again!`, 'error');
                }
            }
            
            // Display detailed results
            displaySubmissionResults(submission);
            
        } else {
            document.getElementById('code-output').innerHTML = `
                <div class="error-output">
                    <strong>Error:</strong> ${result.error || 'Failed to submit code'}
                </div>
            `;
            showNotification(result.error || 'Failed to submit code', 'error');
        }
        
    } catch (error) {
        document.getElementById('code-output').innerHTML = `
            <div class="error-output">
                <strong>Network Error:</strong> ${error.message}
            </div>
        `;
        showNotification('Failed to submit code. Please try again.', 'error');
    }
}

function displayTestResults(results) {
    const outputDiv = document.getElementById('code-output');
    
    if (!results || results.length === 0) {
        outputDiv.innerHTML = '<div class="error-output">No test results available</div>';
        return;
    }
    
    let html = '<div class="test-results">';
    let passedCount = 0;
    
    results.forEach((result, index) => {
        const status = result.status_id === 3 ? 'passed' : 'failed';
        if (status === 'passed') passedCount++;
        
        html += `
            <div class="test-case ${status}">
                <h4>Test Case ${index + 1}: ${status.toUpperCase()}</h4>
                <div class="test-details">
                    <div><strong>Expected:</strong> ${result.expected_output || 'N/A'}</div>
                    <div><strong>Your Output:</strong> ${result.stdout || result.stderr || 'No output'}</div>
                    ${result.stderr ? `<div class="error"><strong>Error:</strong> ${result.stderr}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="test-summary">
            <strong>Summary:</strong> ${passedCount}/${results.length} test cases passed
        </div>
    `;
    
    outputDiv.innerHTML = html;
}

function displaySubmissionResults(submission) {
    const outputDiv = document.getElementById('code-output');
    
    let html = `
        <div class="submission-result ${submission.status === 'Accepted' ? 'success' : 'error'}">
            <h3>Submission Result</h3>
            <div class="result-details">
                <div><strong>Status:</strong> ${submission.status}</div>
                <div><strong>Score:</strong> ${submission.score || 0}%</div>
                ${submission.message ? `<div><strong>Message:</strong> ${submission.message}</div>` : ''}
                ${submission.passedTests !== undefined ? `<div><strong>Test Cases:</strong> ${submission.passedTests}/${submission.totalTests} passed</div>` : ''}
                ${submission.executionTime ? `<div><strong>Execution Time:</strong> ${submission.executionTime}ms</div>` : ''}
                ${submission.memoryUsage ? `<div><strong>Memory Usage:</strong> ${submission.memoryUsage}KB</div>` : ''}
            </div>
        </div>
    `;
    
    // If there are detailed test results, show them too
    if (submission.testResults && submission.testResults.length > 0) {
        html += '<div class="detailed-results">';
        submission.testResults.forEach((result, index) => {
            const status = result.passed ? 'passed' : 'failed';
            html += `
                <div class="test-case ${status}">
                    <h4>Test Case ${index + 1}: ${status.toUpperCase()}</h4>
                    <div class="test-details">
                        ${result.input ? `<div><strong>Input:</strong> ${result.input}</div>` : ''}
                        ${result.expected ? `<div><strong>Expected:</strong> ${result.expected}</div>` : ''}
                        ${result.output ? `<div><strong>Your Output:</strong> ${result.output}</div>` : ''}
                        ${result.error ? `<div class="error"><strong>Error:</strong> ${result.error}</div>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    outputDiv.innerHTML = html;
}

async function checkContestAchievements() {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        const response = await fetch(`/api/contests/${currentContest.id}/achievements`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.achievements && result.achievements.length > 0) {
            let achievementMessage = '🏆 New Achievements Unlocked!\n\n';
            
            result.achievements.forEach(achievement => {
                if (achievement.achievement_type === 'first_solver') {
                    achievementMessage += `🥇 First to solve "${achievement.problem_title}"!\n`;
                } else if (achievement.achievement_type === 'contest_winner') {
                    achievementMessage += `👑 Contest Winner - You solved all problems first!\n`;
                }
            });
            
            showNotification(achievementMessage, 'success');
        }
    } catch (error) {
    }
}

function getDifficultyPoints(difficulty) {
    const points = {
        'Easy': 10,
        'Medium': 20,
        'Hard': 35
    };
    return points[difficulty] || 10;
}

// Language change handler
document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            if (!document.getElementById('code-editor').value.trim()) {
                setDefaultCodeTemplate();
            }
        });
    }
});

function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    });
    
    // Language select change
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            updateFileNameAndTemplate();
            updateLineNumbers();
        });
    }
    
    // Code editor input and scroll
    const codeEditor = document.getElementById('code-editor');
    if (codeEditor) {
        codeEditor.addEventListener('input', updateLineNumbers);
        codeEditor.addEventListener('scroll', syncLineNumbers);
        
        // Initialize line numbers on load
        setTimeout(() => {
            updateFileNameAndTemplate();
            updateLineNumbers();
        }, 100);
    }
    
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

// Update line numbers in code editor
function updateLineNumbers() {
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    
    if (!codeEditor || !lineNumbers) return;
    
    const lines = codeEditor.value.split('\n').length;
    let numbersHtml = '';
    
    for (let i = 1; i <= lines; i++) {
        numbersHtml += i + '\n';
    }
    
    lineNumbers.textContent = numbersHtml;
}

// Sync line numbers scroll with code editor
function syncLineNumbers() {
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    
    if (!codeEditor || !lineNumbers) return;
    
    lineNumbers.scrollTop = codeEditor.scrollTop;
}

// Update file name and code template based on selected language
function updateFileNameAndTemplate() {
    const languageSelect = document.getElementById('language-select');
    const fileNameElement = document.getElementById('code-file-name');
    const codeEditor = document.getElementById('code-editor');
    
    if (!languageSelect || !fileNameElement || !codeEditor) return;
    
    const language = languageSelect.value;
    const templates = {
        'cpp': {
            filename: 'solution.cpp',
            template: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Your solution here
    
    return 0;
}`
        },
        'java': {
            filename: 'Solution.java',
            template: `public class Solution {
    public static void main(String[] args) {
        // Your solution here
        
    }
}`
        },
        'python': {
            filename: 'solution.py',
            template: `# Your solution here
def main():
    pass

if __name__ == "__main__":
    main()`
        },
        'javascript': {
            filename: 'solution.js',
            template: `// Your solution here
function main() {
    
}

main();`
        }
    };
    
    const config = templates[language] || templates['cpp'];
    fileNameElement.textContent = config.filename;
    
    // Only set template if editor is empty or has default content
    if (!codeEditor.value.trim() || codeEditor.value.includes('Write your solution here...')) {
        codeEditor.value = config.template;
        updateLineNumbers();
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