// Problem Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is admin
    checkAdminAuth();
    
    // DOM Elements
    const problemsList = document.getElementById('problemsList');
    const problemSearch = document.getElementById('problemSearch');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const tagsFilter = document.getElementById('tagsFilter');
    const newProblemBtn = document.getElementById('newProblemBtn');
    const problemModal = document.getElementById('problemModal');
    const problemForm = document.getElementById('problemForm');
    const modalTitle = document.getElementById('modalTitle');
    const addTestCaseBtn = document.getElementById('addTestCaseBtn');
    const testCasesList = document.getElementById('testCasesList');
    const confirmModal = document.getElementById('confirmModal');
    const alertModal = document.getElementById('alertModal');
    const alertMessage = document.getElementById('alertMessage');
    const alertTitle = document.getElementById('alertTitle');
    const confirmYes = document.getElementById('confirmYes');
    const addTagBtn = document.getElementById('addTagBtn');
    const addTagInput = document.getElementById('addTagInput');
    const tagContainer = document.getElementById('tagContainer');

    // State variables
    let allProblems = [];
    let currentProblem = null;
    let problemTags = [];
    let testCaseCounter = 0;
    let deleteCallback = null;

    // Initialize
    loadProblems();
    loadAllTags();

    // Event listeners
    problemSearch.addEventListener('input', filterProblems);
    difficultyFilter.addEventListener('change', filterProblems);
    tagsFilter.addEventListener('change', filterProblems);
    newProblemBtn.addEventListener('click', showNewProblemModal);
    problemForm.addEventListener('submit', saveProblem);
    addTestCaseBtn.addEventListener('click', addTestCaseForm);
    addTagBtn.addEventListener('click', addTag);
    
    // Add event listener for Enter key on tag input
    addTagInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    });

    // Close modals when clicking on X or outside modal
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            closeModal(problemModal);
            closeModal(confirmModal);
            closeModal(alertModal);
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target === problemModal) closeModal(problemModal);
        if (event.target === confirmModal) closeModal(confirmModal);
        if (event.target === alertModal) closeModal(alertModal);
    });
    
    // Function to close modal with animation
    function closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match the transition duration
    }
    
    // Function to open modal with animation
    function openModal(modal) {
        modal.style.display = 'block';
        // Force a reflow to ensure the transition applies
        modal.offsetHeight;
        modal.classList.add('show');
    }

    // Authentication check
    function checkAdminAuth() {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }
        
        // Display admin info
        const adminName = document.querySelector('.admin-name');
        if (adminName) {
            adminName.textContent = user.username;
        }
        
        // Setup logout if logout-btn exists
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            });
        }
    }

    // Load all problems
    async function loadProblems() {
        try {
            problemsList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading problems...</div>';
            
            const token = localStorage.getItem('authToken');
            
            const response = await fetch('/api/problems', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(fetchError => {
                showAlert('Network Error', `Could not connect to server: ${fetchError.message}`);
                throw fetchError; // re-throw to exit the function
            });
            
            if (!response) return; // Exit if fetch failed
            
            if (!response.ok) {
                showAlert('Error', `HTTP error: ${response.status} ${response.statusText}`);
                return;
            }
            
            const result = await response.json();
            
            if (result.success) {
                allProblems = result.data;
                displayProblems(allProblems);
            } else {
                showAlert('Error', result.error || 'Failed to load problems');
            }
        } catch (error) {
            showAlert('Error', `Failed to load problems: ${error.message}`);
            problemsList.innerHTML = '<div class="error-message">Failed to load problems. Please try again.</div>';
        }
    }

    // Load all tags for filter
    async function loadAllTags() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/problems/tags', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Load available tags for the dropdown filter
                const availableTags = result.data;
                populateTagsFilter(availableTags);
            }
        } catch (error) {
        }
    }

    // Populate tags filter dropdown
    function populateTagsFilter(tags) {
        tagsFilter.innerHTML = '<option value="">All Tags</option>';
        
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            option.textContent = tag.name;
            tagsFilter.appendChild(option);
        });
    }

    // Display problems in the list
    function displayProblems(problems) {
        if (problems.length === 0) {
            problemsList.innerHTML = '<div class="no-problems">No problems found. Create your first problem!</div>';
            return;
        }
        
        let html = '';
        
        problems.forEach(problem => {
            const difficultyClass = `difficulty-${problem.difficulty.toLowerCase()}`;
            
            html += `
                <div class="problem-card" data-id="${problem.id}">
                    <div class="problem-header">
                        <h3 class="problem-title">${problem.title}</h3>
                        <span class="problem-difficulty ${difficultyClass}">${problem.difficulty}</span>
                    </div>
                    <p>${problem.description.substring(0, 150)}${problem.description.length > 150 ? '...' : ''}</p>
                    <div class="problem-tags">
                        ${problem.tags && problem.tags.length ? problem.tags.map(tag => `<span class="tag">${tag.name}</span>`).join('') : '<span class="no-tags">No tags</span>'}
                    </div>
                    <div class="problem-stats">
                        <span><i class="fas fa-stopwatch"></i> ${(problem.time_limit / 1000).toFixed(1)}s</span>
                        <span><i class="fas fa-memory"></i> ${Math.round(problem.memory_limit / 1024)}MB</span>
                        <span><i class="fas fa-vial"></i> ${problem.test_cases_count || 0} test cases</span>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn edit-problem" data-id="${problem.id}" title="Edit Problem">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn delete-problem" data-id="${problem.id}" title="Delete Problem">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        problemsList.innerHTML = html;
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-problem').forEach(button => {
            button.addEventListener('click', function() {
                const problemId = this.getAttribute('data-id');
                editProblem(problemId);
            });
        });
        
        document.querySelectorAll('.delete-problem').forEach(button => {
            button.addEventListener('click', function() {
                const problemId = this.getAttribute('data-id');
                confirmDeleteProblem(problemId);
            });
        });
    }

    // Filter problems based on search and filters
    function filterProblems() {
        const searchText = problemSearch.value.toLowerCase();
        const difficulty = difficultyFilter.value.toLowerCase();
        const tagId = tagsFilter.value;
        
        const filtered = allProblems.filter(problem => {
            // Filter by search text
            const matchesSearch = 
                problem.title.toLowerCase().includes(searchText) || 
                problem.description.toLowerCase().includes(searchText);
            
            // Filter by difficulty
            const matchesDifficulty = difficulty === '' || problem.difficulty.toLowerCase() === difficulty;
            
            // Filter by tag
            let matchesTag = true;
            if (tagId !== '') {
                matchesTag = problem.tags.some(tag => tag.id.toString() === tagId);
            }
            
            return matchesSearch && matchesDifficulty && matchesTag;
        });
        
        displayProblems(filtered);
    }

    // Show modal for new problem
    function showNewProblemModal() {
        modalTitle.textContent = 'Add New Problem';
        problemForm.reset();
        document.getElementById('problemId').value = '';
        testCasesList.innerHTML = '';
        tagContainer.innerHTML = '';
        testCaseCounter = 0;
        currentProblem = null;
        
        // Add at least one test case form
        addTestCaseForm();
        
        openModal(problemModal);
    }

    // Edit existing problem
    async function editProblem(problemId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/problems/${problemId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                currentProblem = result.data;
                fillProblemForm(currentProblem);
                modalTitle.textContent = 'Edit Problem';
                openModal(problemModal);
            } else {
                showAlert('Error', result.error || 'Failed to load problem details');
            }
        } catch (error) {
            showAlert('Error', 'Failed to load problem details');
        }
    }

    // This function was replaced by editProblem
    // View functionality has been removed

    // Fill form with problem data
    function fillProblemForm(problem) {
        document.getElementById('problemId').value = problem.id;
        document.getElementById('title').value = problem.title;
        document.getElementById('difficulty').value = problem.difficulty.toLowerCase();
        document.getElementById('description').value = problem.description;
        // Convert milliseconds to seconds
        document.getElementById('timeLimit').value = (problem.time_limit / 1000).toFixed(1);
        // Convert KB to MB
        document.getElementById('memoryLimit').value = Math.round(problem.memory_limit / 1024);
        
        // Clear existing test cases and add from problem
        testCasesList.innerHTML = '';
        testCaseCounter = 0;
        
        if (problem.test_cases && problem.test_cases.length > 0) {
            problem.test_cases.forEach(testCase => {
                addTestCaseForm(testCase);
            });
        } else {
            addTestCaseForm();
        }
        
        // Add tags
        tagContainer.innerHTML = '';
        if (problem.tags && problem.tags.length > 0) {
            problem.tags.forEach(tag => {
                addTagToContainer(tag.name);
            });
        }
    }

    // Add a new test case form
    function addTestCaseForm(testCase = null) {
        const testCaseId = testCaseCounter++;
        
        const testCaseHtml = `
            <div class="test-case-form" id="testCase${testCaseId}">
                <div class="test-case-header">
                    <h4><i class="fas fa-vial"></i> Test Case #${testCaseId + 1}</h4>
                    <div class="action-buttons">
                        ${testCaseId > 0 ? `<button type="button" class="btn-icon remove-test-case" data-id="${testCaseId}" title="Remove test case">
                            <i class="fas fa-trash-alt"></i>
                        </button>` : ''}
                    </div>
                </div>
                <div class="form-group">
                    <label for="testCaseInput${testCaseId}"><i class="fas fa-sign-in-alt"></i> Input</label>
                    <textarea id="testCaseInput${testCaseId}" name="testCaseInput${testCaseId}" 
                        class="form-input code" placeholder="Enter test case input here...">${testCase ? testCase.input : ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="testCaseOutput${testCaseId}"><i class="fas fa-sign-out-alt"></i> Expected Output</label>
                    <textarea id="testCaseOutput${testCaseId}" name="testCaseOutput${testCaseId}" 
                        class="form-input code" placeholder="Enter expected output here...">${testCase ? testCase.output : ''}</textarea>
                </div>
                ${testCase ? `<input type="hidden" name="testCaseId${testCaseId}" value="${testCase.id}">` : ''}
            </div>
        `;
        
        testCasesList.insertAdjacentHTML('beforeend', testCaseHtml);
        
        // Add event listener to remove button
        const removeBtn = document.querySelector(`#testCase${testCaseId} .remove-test-case`);
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                document.getElementById(`testCase${testCaseId}`).remove();
            });
        }
    }

    // Add tag to container
    function addTagToContainer(tagName) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tagName}
            <span class="remove-tag"><i class="fas fa-times"></i></span>
            <input type="hidden" name="tags[]" value="${tagName}">
        `;
        
        const removeBtn = tagElement.querySelector('.remove-tag');
        removeBtn.addEventListener('click', function() {
            tagElement.remove();
        });
        
        tagContainer.appendChild(tagElement);
        addTagInput.value = '';
    }

    // Add tag from input
    function addTag() {
        const tagName = addTagInput.value.trim();
        
        if (!tagName) return;
        
        // Check for duplicates
        const existingTags = Array.from(tagContainer.querySelectorAll('input[name="tags[]"]')).map(input => input.value);
        
        if (existingTags.includes(tagName)) {
            showAlert('Duplicate Tag', 'This tag has already been added');
            return;
        }
        
        addTagToContainer(tagName);
    }

    // Save problem (create or update)
    async function saveProblem(e) {
        e.preventDefault();
        
        try {
            // Collect form data
            const problemId = document.getElementById('problemId').value;
            
            // Collect tags from the tag container
            const tagElements = tagContainer.querySelectorAll('input[name="tags[]"]');
            const tags = Array.from(tagElements).map(input => input.value);
            
            const formData = {
                title: document.getElementById('title').value,
                difficulty: document.getElementById('difficulty').value.toLowerCase(),
                description: document.getElementById('description').value,
                // Convert seconds to milliseconds
                time_limit: Math.round(parseFloat(document.getElementById('timeLimit').value) * 1000),
                // Convert MB to KB
                memory_limit: parseInt(document.getElementById('memoryLimit').value) * 1024,
                tags: tags, // Use the collected tags from the form
                test_cases: []
            };
            
            // Collect all test cases
            for (let i = 0; i < testCaseCounter; i++) {
                const testCaseElement = document.getElementById(`testCase${i}`);
                if (!testCaseElement) continue;
                
                const inputElement = document.getElementById(`testCaseInput${i}`);
                const outputElement = document.getElementById(`testCaseOutput${i}`);
                const testCaseIdElement = document.querySelector(`input[name="testCaseId${i}"]`);
                
                if (!inputElement || !outputElement) continue;
                
                const testCase = {
                    input: inputElement.value,
                    output: outputElement.value,
                    is_hidden: false // Default value for is_hidden
                };
                
                if (testCaseIdElement) {
                    testCase.id = testCaseIdElement.value;
                }
                
                formData.test_cases.push(testCase);
            }
            
            // Validate form
            if (!formData.title.trim()) {
                showAlert('Validation Error', 'Problem title is required');
                return;
            }
            
            if (!formData.description.trim()) {
                showAlert('Validation Error', 'Problem description is required');
                return;
            }
            
            if (formData.test_cases.length === 0) {
                showAlert('Validation Error', 'At least one test case is required');
                return;
            }
            
            for (const testCase of formData.test_cases) {
                if (!testCase.input.trim() || !testCase.output.trim()) {
                    showAlert('Validation Error', 'All test cases must have both input and output');
                    return;
                }
            }
            
            // API call
            const token = localStorage.getItem('authToken');
            const url = problemId ? `/api/problems/${problemId}` : '/api/problems';
            const method = problemId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                showAlert('Success', `Problem ${problemId ? 'updated' : 'created'} successfully`);
                problemModal.style.display = 'none';
                loadProblems();
            } else {
                showAlert('Error', result.error || `Failed to ${problemId ? 'update' : 'create'} problem`);
            }
        } catch (error) {
            showAlert('Error', `Failed to ${document.getElementById('problemId').value ? 'update' : 'create'} problem`);
        }
    }

    // Confirm delete problem
    function confirmDeleteProblem(problemId) {
        document.getElementById('confirmMessage').textContent = 'Are you sure you want to delete this problem? This action cannot be undone.';
        
        deleteCallback = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`/api/problems/${problemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showAlert('Success', 'Problem deleted successfully');
                    loadProblems();
                } else {
                    showAlert('Error', result.error || 'Failed to delete problem');
                }
            } catch (error) {
                showAlert('Error', 'Failed to delete problem');
            }
        };
        
        openModal(confirmModal);
    }

    // Confirm Yes button handler
    confirmYes.addEventListener('click', function() {
        if (typeof deleteCallback === 'function') {
            deleteCallback();
            deleteCallback = null;
        }
        confirmModal.style.display = 'none';
    });

    // Show alert modal
    function showAlert(title, message) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        openModal(alertModal);
    }
});