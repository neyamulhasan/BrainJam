// Content Management JavaScript
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
            
            const response = await fetch(`/api/learning/${endpoint}`, {
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
            showMessage(`Failed to load ${endpoint}: ${error.message}`, 'error');
            return null;
        }
    }

    // Tab functionality
    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabName}-content`).classList.add('active');
            });
        });
    }

    // Load learning resources
    async function loadLearningResources() {
        const data = await apiCall('learning-resources');
        
        if (!data) {
            // Use sample data if API call fails or no data returned
            return;
        }
        
        const tableBody = document.getElementById('resources-table-body');
        tableBody.innerHTML = '';
        
        data.resources.forEach(resource => {
            const row = document.createElement('tr');
            
            // Title column
            const titleCell = document.createElement('td');
            titleCell.textContent = resource.title;
            
            // Category column
            const categoryCell = document.createElement('td');
            categoryCell.textContent = resource.category_name;
            
            // Status column
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge ${resource.status}`;
            statusBadge.textContent = resource.status.charAt(0).toUpperCase() + resource.status.slice(1);
            statusCell.appendChild(statusBadge);
            
            // Published date column
            const dateCell = document.createElement('td');
            dateCell.textContent = resource.published_at ? new Date(resource.published_at).toISOString().split('T')[0] : 'N/A';
            
            // Actions column
            const actionsCell = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.className = 'action-btn edit-btn';
            editButton.textContent = 'Edit';
            editButton.dataset.id = resource.id;
            editButton.addEventListener('click', () => {
                window.location.href = `create-resource.html?id=${resource.id}`;
            });
            actionsCell.appendChild(editButton);
            
            // Add cells to row
            row.appendChild(titleCell);
            row.appendChild(categoryCell);
            row.appendChild(statusCell);
            row.appendChild(dateCell);
            row.appendChild(actionsCell);
            
            // Add row to table
            tableBody.appendChild(row);
        });
    }

    // Resource search functionality
    function initializeResourceSearch() {
        const searchInput = document.getElementById('resource-search');
        
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = document.querySelectorAll('#resources-table-body tr');
            
            rows.forEach(row => {
                const title = row.cells[0].textContent.toLowerCase();
                const category = row.cells[1].textContent.toLowerCase();
                
                if (title.includes(searchTerm) || category.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // Resource editor modal
    function initializeResourceModal() {
        const modal = document.getElementById('resource-editor-modal');
        const closeButton = modal.querySelector('.close-modal');
        const cancelButton = modal.querySelector('.cancel-btn');
        const createButton = document.querySelector('.create-resource-btn');
        const form = document.getElementById('resource-form');
        
        // Close modal handlers
        function closeModal() {
            modal.style.display = 'none';
        }
        
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        
        // Close when clicking outside modal
        window.addEventListener('click', event => {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // Open modal for new resource
        createButton.addEventListener('click', () => {
            document.querySelector('.modal-header h3').textContent = 'Create New Resource';
            document.getElementById('resource-id').value = '';
            document.getElementById('resource-title').value = '';
            document.getElementById('resource-category').value = '';
            document.getElementById('resource-content').value = '';
            document.getElementById('resource-status').value = 'draft';
            
            modal.style.display = 'block';
        });
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const resourceId = document.getElementById('resource-id').value;
            const resourceData = {
                title: document.getElementById('resource-title').value,
                category_id: document.getElementById('resource-category').value,
                content: document.getElementById('resource-content').value,
                status: document.getElementById('resource-status').value
            };
            
            try {
                let result;
                
                if (resourceId) {
                    // Update existing resource
                    result = await apiCall(`learning-resources/${resourceId}`, {
                        method: 'PUT',
                        body: JSON.stringify(resourceData)
                    });
                    
                    if (result.success) {
                        showMessage('Resource updated successfully!');
                    }
                } else {
                    // Create new resource
                    result = await apiCall('learning-resources', {
                        method: 'POST',
                        body: JSON.stringify(resourceData)
                    });
                    
                    if (result.success) {
                        showMessage('Resource created successfully!');
                    }
                }
                
                closeModal();
                await loadLearningResources();
            } catch (error) {
                showMessage('Failed to save resource: ' + error.message, 'error');
            }
        });
    }

    // Open resource editor for existing resource
    async function openResourceEditor(resourceId) {
        try {
            document.querySelector('.modal-header h3').textContent = 'Edit Learning Resource';
            
            // Get resource data
            const data = await apiCall(`learning-resources/${resourceId}`);
            
            if (!data || !data.resource) {
                showMessage('Failed to load resource data', 'error');
                return;
            }
            
            const resource = data.resource;
            
            // Populate form fields
            document.getElementById('resource-id').value = resource.id;
            document.getElementById('resource-title').value = resource.title;
            document.getElementById('resource-category').value = resource.category_id;
            document.getElementById('resource-content').value = resource.content;
            document.getElementById('resource-status').value = resource.status;
            
            // Show modal
            document.getElementById('resource-editor-modal').style.display = 'block';
        } catch (error) {
            showMessage('Failed to load resource: ' + error.message, 'error');
        }
    }

    // Initialize page
    async function initializeContentManagement() {
        const adminUser = checkAdminAuth();
        if (!adminUser) return; // Redirect happens in checkAdminAuth
        
        try {
            // Initialize UI components
            initializeTabs();
            initializeResourceSearch();
            initializeResourceModal();
            
            // Load data
            await loadLearningResources();
        } catch (error) {
            showMessage('Error loading content management data', 'error');
        }
    }

    // Start initialization
    initializeContentManagement();
});