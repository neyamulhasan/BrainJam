// Create Contest Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadProblems();
});

let allProblems = [];
let selectedProblems = [];

// DOM elements
const createContestForm = document.getElementById('createContestForm');
const addProblemBtn = document.querySelector('.btn-add-problem');
const problemsTableBody = document.getElementById('problemsTableBody');

function initializePage() {
    // Initialize form validation
    setupFormValidation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Set default datetime to current time + 1 hour
    const startTimeInput = document.getElementById('start-time');
    const now = new Date();
    now.setHours(now.getHours() + 1);
    startTimeInput.value = now.toISOString().slice(0, 16);
}

function setupEventListeners() {
    // Form submission
    if (createContestForm) {
        createContestForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Add problem button
    if (addProblemBtn) {
        addProblemBtn.addEventListener('click', showProblemSelectionModal);
    }
}

function setupFormValidation() {
    const inputs = document.querySelectorAll('input[required], textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    clearFieldError(event);
    
    if (!value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Additional validation based on field type
    switch (field.type) {
        case 'number':
            const num = parseInt(value);
            if (isNaN(num) || num < 1) {
                showFieldError(field, 'Please enter a valid number greater than 0');
                return false;
            }
            break;
        case 'datetime-local':
            const selectedDate = new Date(value);
            const now = new Date();
            if (selectedDate <= now) {
                showFieldError(field, 'Start time must be in the future');
                return false;
            }
            break;
    }
    
    return true;
}

function showFieldError(field, message) {
    field.classList.add('invalid');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('invalid');
    
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

async function loadProblems() {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        const response = await fetch('/api/contests/problems', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            allProblems = data.problems || [];
        } else {
            allProblems = [];
        }
    } catch (error) {
        allProblems = [];
    }
}

function showProblemSelectionModal() {
    const modal = createProblemModal();
    document.body.appendChild(modal);
    
    // Populate with problems
    populateProblemList(allProblems);
}

function createProblemModal() {
    const modal = document.createElement('div');
    modal.className = 'problem-modal';
    modal.innerHTML = `
        <div class="problem-modal-content">
            <div class="problem-modal-header">
                <h3>Select Problems</h3>
                <button type="button" class="close-btn">&times;</button>
            </div>
            <div class="problem-modal-body">
                <div class="form-group">
                    <input type="text" id="problemSearch" placeholder="Search problems..." />
                </div>
                <div class="problem-selection-list" id="problemList">
                    <!-- Problems will be populated here -->
                </div>
            </div>
            <div class="problem-modal-footer">
                <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="addSelectedProblems">Add Selected</button>
            </div>
        </div>
    `;
    
    // Setup modal event listeners
    setupModalEventListeners(modal);
    
    return modal;
}

function setupModalEventListeners(modal) {
    // Close modal handlers
    const closeBtns = modal.querySelectorAll('.close-btn, .close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Search functionality
    const searchInput = modal.querySelector('#problemSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredProblems = allProblems.filter(problem => 
                problem.title.toLowerCase().includes(searchTerm) ||
                problem.description.toLowerCase().includes(searchTerm)
            );
            populateProblemList(filteredProblems);
        });
    }
    
    // Add selected problems
    const addBtn = modal.querySelector('#addSelectedProblems');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addSelectedProblems();
            modal.remove();
        });
    }
}

function populateProblemList(problems) {
    const problemList = document.getElementById('problemList');
    if (!problemList) return;
    
    problemList.innerHTML = '';
    
    if (problems.length === 0) {
        problemList.innerHTML = '<p class="text-center" style="color: var(--text-secondary); padding: 2rem;">No problems found</p>';
        return;
    }
    
    problems.forEach(problem => {
        const isSelected = selectedProblems.some(p => p.id === problem.id);
        const problemItem = document.createElement('div');
        problemItem.className = `problem-selection-item ${isSelected ? 'selected' : ''}`;
        problemItem.innerHTML = `
            <div class="problem-info">
                <div class="problem-title">${escapeHtml(problem.title)}</div>
                <div class="problem-description">${escapeHtml(problem.description || 'No description available')}</div>
            </div>
            <div class="problem-meta">
                <span class="difficulty-badge difficulty-${(problem.difficulty || 'medium').toLowerCase()}">${problem.difficulty || 'Medium'}</span>
                <span style="color: var(--text-secondary); font-size: 0.875rem;">${problem.points || 100} pts</span>
            </div>
        `;
        
        problemItem.addEventListener('click', () => {
            problemItem.classList.toggle('selected');
        });
        
        problemList.appendChild(problemItem);
    });
}

function addSelectedProblems() {
    const selectedItems = document.querySelectorAll('.problem-selection-item.selected');
    
    selectedItems.forEach(item => {
        const title = item.querySelector('.problem-title').textContent;
        const problem = allProblems.find(p => p.title === title);
        
        if (problem && !selectedProblems.some(p => p.id === problem.id)) {
            selectedProblems.push(problem);
        }
    });
    
    renderProblemsTable();
}

function renderProblemsTable() {
    if (!problemsTableBody) return;
    
    problemsTableBody.innerHTML = '';
    
    if (selectedProblems.length === 0) {
        problemsTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4" class="text-center">Nothing Selected yet</td>
            </tr>
        `;
        return;
    }
    
    selectedProblems.forEach((problem, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div>
                    <strong>${escapeHtml(problem.title)}</strong>
                    <br>
                    <small style="color: var(--text-secondary);">${escapeHtml(problem.description || '')}</small>
                </div>
            </td>
            <td>
                <span class="difficulty-badge difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
            </td>
            <td>${problem.points || 100}</td>
            <td class="text-right">
                <div class="problem-actions">
                    <button type="button" class="btn-icon btn-danger" onclick="removeProblem(${index})" title="Remove problem">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        problemsTableBody.appendChild(row);
    });
}

function removeProblem(index) {
    selectedProblems.splice(index, 1);
    renderProblemsTable();
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form
    const formData = new FormData(createContestForm);
    const contestData = {
        name: formData.get('contestName'),
        description: formData.get('contestDescription') || '',
        start_time: formData.get('startTime'),
        duration_hours: parseInt(formData.get('duration')),
        problem_ids: selectedProblems.map(p => p.id)
    };
    // Validate required fields
    if (!contestData.name || !contestData.start_time || !contestData.duration_hours) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (selectedProblems.length === 0) {
        showMessage('Please select at least one problem', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = createContestForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating...';
    submitBtn.disabled = true;
    
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        const response = await fetch('/api/contests/create-contest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(contestData)
        });
        
        const result = await response.json();
        if (response.ok && result.success) {
            showMessage('Contest created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'admin-contest-managment.html';
            }, 2000);
        } else {
            throw new Error(result.error || 'Failed to create contest');
        }
    } catch (error) {
        showMessage('Failed to create contest: ' + error.message, 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message-box');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message-box';
    messageDiv.textContent = message;
    
    // Insert at top of content
    const content = document.querySelector('.content');
    content.insertBefore(messageDiv, content.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make removeProblem function globally accessible
window.removeProblem = removeProblem;