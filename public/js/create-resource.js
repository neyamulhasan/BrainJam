// Create Resource JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let isEditMode = false;
    let resourceId = null;
    
    // Check for resource ID in URL for edit mode
    function checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        resourceId = urlParams.get('id');
        
        if (resourceId) {
            isEditMode = true;
            document.querySelector('.page-header h1').textContent = 'Edit Learning Resource';
            document.getElementById('publish-btn').textContent = 'Update Resource';
        }
    }
    
    // Initialize rich text editor
    window.quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                ['link', 'image', 'code-block'],
                ['clean']
            ]
        },
        placeholder: 'Write your content here...'
    });
    
    // Check if user is authenticated and is admin
    function checkAdminAuth() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            window.location.href = 'login.html';
            return false;
        }
        
        const user = JSON.parse(userData);
        
        if (user.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return false;
        }
        
        return user;
    }

    // Utility function to show messages
    function showMessage(message, type = 'success') {
        const container = document.getElementById('message-container');
        if (!container) {
            alert(message);
            return;
        }
        
        container.innerHTML = `<div class="${type}-message">${message}</div>`;
    }
    
    // Helper for showing error messages
    function showErrorMessage(message) {
        showMessage(message, 'error');
        
        // Scroll to the top of the form to see the error
        window.scrollTo({
            top: document.getElementById('message-container').offsetTop - 20,
            behavior: 'smooth'
        });
    }

    // API call helper
    async function apiCall(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`/api/learning/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error in API call to ${endpoint}:`, error);
            showMessage(`Failed: ${error.message}`, 'error');
            return null;
        }
    }

    // Load categories
    async function loadCategories() {
        try {
            const data = await apiCall('learning-categories');
            const categorySelect = document.getElementById('resource-category');
            
            if (data && data.categories) {
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            } else {
                // Add fallback categories if API fails
                const fallbackCategories = [
                    { id: 1, name: 'Algorithms' },
                    { id: 2, name: 'Data Structures' },
                    { id: 3, name: 'System Design' },
                    { id: 4, name: 'Web Development' },
                    { id: 5, name: 'Mobile Development' }
                ];
                
                fallbackCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            showMessage('Failed to load categories', 'error');
        }
    }

    // Handle image upload and preview
    function setupImageUpload() {
        const imageInput = document.getElementById('resource-image');
        const imagePreview = document.getElementById('image-preview');
        
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                
                reader.readAsDataURL(file);
            } else {
                imagePreview.innerHTML = `<i class="fas fa-image"></i><span>No image selected</span>`;
            }
        });
    }

    // Handle meta description character count
    function setupMetaDescription() {
        const metaDescription = document.getElementById('resource-description');
        const charCount = document.getElementById('meta-char-count');
        
        metaDescription.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count > 150) {
                charCount.style.color = '#e53e3e';
            } else {
                charCount.style.color = 'inherit';
            }
        });
    }

    // Handle form submission
    function setupFormSubmission() {
        const form = document.getElementById('resource-form');
        
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Clear any previous messages
                const messageContainer = document.getElementById('message-container');
                if (messageContainer) {
                    messageContainer.innerHTML = '';
                }
                
                // Get content from Quill editor
                const content = window.quill.root.innerHTML;
                
                // Basic validation
                const title = document.getElementById('resource-title').value;
                const category = document.getElementById('resource-category').value;
                
                if (!title.trim()) {
                    showErrorMessage('Please enter a title for the resource');
                    return;
                }
                
                if (!category) {
                    showErrorMessage('Please select a category');
                    return;
                }
                
                if (!content.trim() || content === '<p><br></p>') {
                    showErrorMessage('Please add some content to the resource');
                    return;
                }
                
                // Create FormData object
                const formData = new FormData(form);
                
                // Remove any existing content field (we'll add it fresh below)
                if (formData.has('content')) {
                    formData.delete('content');
                }
                
                // Set the content from the editor
                formData.append('content', content);
                
                // If we have a file input but no file was selected in edit mode,
                // remove it from FormData to prevent overriding the existing image
                const fileInput = document.getElementById('resource-image');
                if (isEditMode && fileInput && fileInput.files.length === 0) {
                    formData.delete('featured_image');
                }
                
                try {
                    const token = localStorage.getItem('authToken');
                    if (!token) {
                        window.location.href = 'login.html';
                        return;
                    }
                    
                    // Validate required fields again
                    if (!title.trim() || !category || !content.trim() || content === '<p><br></p>') {
                        showErrorMessage('Please fill in all required fields');
                        return;
                    }
                    
                    // Create a new FormData object to ensure clean data
                    const formData = new FormData();
                    
                    // Add all form fields manually to ensure proper formatting
                    formData.append('title', title.trim());
                    formData.append('category_id', category);
                    formData.append('status', document.getElementById('resource-status').value);
                    formData.append('content', content);
                    
                    // Add tags if provided
                    const tagsValue = document.getElementById('resource-tags').value;
                    if (tagsValue.trim()) {
                        formData.append('tags', tagsValue.trim());
                    }
                    
                    // Always add meta description (even if empty)
                    const metaDesc = document.getElementById('resource-description')?.value || '';
                    formData.append('meta_description', metaDesc.trim());
                    
                    // Add image file if selected
                    const imageFile = document.getElementById('resource-image').files[0];
                    if (imageFile) {
                        formData.append('featured_image', imageFile);
                    }
                    
                    let url = '/api/learning/learning-resources';
                    let method = 'POST';
                    
                    // If in edit mode, use PUT request to update
                    if (isEditMode && resourceId) {
                        url = `/api/learning/learning-resources/${resourceId}`;
                        method = 'PUT';
                    }
                    
                    // Debug log of form data
                    console.log('Sending request to:', url);
                    console.log('Method:', method);
                    console.log('FormData contents:');
                    for (const [key, value] of formData.entries()) {
                        if (key === 'content') {
                            console.log(`${key}: [Content length: ${value.length}]`);
                        } else if (key === 'featured_image' && value instanceof File) {
                            console.log(`${key}: File: ${value.name} (${value.size} bytes)`);
                        } else {
                            console.log(`${key}: ${value}`);
                        }
                    }
                    for (const [key, value] of formData.entries()) {
                        if (key === 'content') {
                            console.log(`${key}: [Content length: ${value.length}]`);
                        } else if (key === 'featured_image' && value instanceof File) {
                            console.log(`${key}: File: ${value.name} (${value.size} bytes)`);
                        } else {
                            console.log(`${key}: ${value}`);
                        }
                    }
                    
                    // Send the request
                    const response = await fetch(url, {
                        method: method,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });
                    
                    // Log the raw response for debugging
                    console.log('Response status:', response.status);
                    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
                    
                    const responseText = await response.text();
                    console.log('Raw response text:', responseText);
                    
                    let result;
                    try {
                        result = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('Error parsing JSON response:', parseError);
                        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
                    }
                    
                    if (!response.ok) {
                        console.error('API error response:', result);
                        const errorMsg = result.error || `Error ${response.status}: ${response.statusText}`;
                        const errorDetails = result.details ? `\n\nDetails: ${result.details}` : '';
                        throw new Error(errorMsg + errorDetails);
                    }
                    
                    console.log('API success response:', result);
                    
                    if (result.success) {
                        // Show success message
                        const message = isEditMode ? 'Resource updated successfully!' : 'Resource created successfully!';
                        showMessage(message, 'success');
                        
                        // Redirect to content management page after a short delay
                        setTimeout(() => {
                            window.location.href = 'content-management.html';
                        }, 1500);
                    } else {
                        throw new Error(result.error || 'Unknown error occurred');
                    }
                } catch (error) {
                    console.error('Error processing resource:', error);
                    
                    // Create a more detailed error message
                    let errorMessage = isEditMode ? 'Error updating resource: ' : 'Error creating resource: ';
                    
                    if (error.message) {
                        errorMessage += error.message;
                    } else {
                        errorMessage += 'Unknown error occurred';
                    }
                    
                    // Add more debug info - using let variables defined earlier in the scope
                    console.error('Request details:', {
                        isEditMode,
                        resourceId,
                        contentLength: content ? content.length : 0
                    });
                    
                    // Show error message
                    showErrorMessage(errorMessage);
                }
            });
        }
    }

    // Load resource data for editing
    async function loadResourceData() {
        if (!isEditMode || !resourceId) return;
        
        try {
            console.log('Loading resource data for ID:', resourceId);
            
            const response = await fetch(`/api/learning/learning-resources/${resourceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Resource data received:', data);
            
            if (!data.success || !data.resource) {
                throw new Error('Failed to load resource data');
            }
            
            const resource = data.resource;
            console.log('Resource object:', resource);
            
            // Set form fields
            document.getElementById('resource-title').value = resource.title || '';
            
            if (resource.category_id) {
                document.getElementById('resource-category').value = resource.category_id;
            }
            
            if (resource.status) {
                document.getElementById('resource-status').value = resource.status;
            }
            
            // Set tags if available
            if (resource.tags && Array.isArray(resource.tags)) {
                const tagsElement = document.getElementById('resource-tags');
                if (tagsElement) {
                    tagsElement.value = resource.tags.join(', ');
                    console.log('Tags set:', resource.tags.join(', '));
                }
            }
            
            // Set content in Quill editor
            if (window.quill) {
                console.log('Setting Quill content:', resource.content ? resource.content.substring(0, 100) + '...' : 'No content');
                if (resource.content) {
                    window.quill.root.innerHTML = resource.content;
                } else {
                    window.quill.root.innerHTML = '';
                }
            } else {
                console.error('Quill editor not found');
            }
            
            // Set meta description if available
            if (resource.meta_description) {
                document.getElementById('resource-description').value = resource.meta_description;
                document.getElementById('meta-char-count').textContent = resource.meta_description.length;
            }
            
            // If there's a featured image, show it in the preview
            if (resource.featured_image) {
                const imagePreview = document.getElementById('image-preview');
                imagePreview.innerHTML = `<img src="${resource.featured_image}" alt="Featured Image">`;
            }
            
            showMessage('Resource loaded for editing', 'info');
            
        } catch (error) {
            console.error('Error loading resource:', error);
            showErrorMessage(`Failed to load resource: ${error.message}`);
        }
    }
    
    // Initialize page
    function initializePage() {
        if (!checkAdminAuth()) return;
        
        // Check if we're in edit mode
        checkEditMode();
        
        // Load categories
        loadCategories();
        
        // Setup UI interactions
        setupImageUpload();
        setupFormSubmission();
        setupMetaDescription();
        setupDeleteButton();
        
        // If in edit mode, load the resource data
        if (isEditMode) {
            loadResourceData();
        }
        
        // Setup user info
        populateUserInfo();
    }
    
    // Function to handle delete button click
    function setupDeleteButton() {
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async function() {
                if (isEditMode && resourceId) {
                    // If in edit mode with a resource ID, offer to delete the resource
                    if (confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
                        try {
                            const token = localStorage.getItem('authToken');
                            const response = await fetch(`/api/learning/learning-resources/${resourceId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
                            }
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                showMessage('Resource deleted successfully!', 'success');
                                setTimeout(() => {
                                    window.location.href = 'content-management.html';
                                }, 1500);
                            } else {
                                throw new Error(result.error || 'Unknown error occurred');
                            }
                        } catch (error) {
                            console.error('Error deleting resource:', error);
                            showErrorMessage(`Failed to delete resource: ${error.message}`);
                        }
                    }
                } else {
                    // In create mode, just confirm and redirect back
                    if (confirm('Are you sure you want to discard this draft resource? Any unsaved changes will be lost.')) {
                        window.location.href = 'content-management.html';
                    }
                }
            });
        }
    }
    
    // Function to populate user information
    async function populateUserInfo() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            // Get user data from localStorage instead of making an API call
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) return;
            
            // Update user info if elements exist
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = userData.username;
            }
            
            const avatarElement = document.getElementById('user-avatar');
            if (avatarElement && userData.avatar_url) {
                avatarElement.src = userData.avatar_url;
            }
            
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    }
    
    // Start initialization
    initializePage();
    
    // Set up back/cancel button if it exists
    const cancelBtn = document.querySelector('.secondary-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') return; // If it's already a link, let it work normally
            e.preventDefault();
            window.location.href = 'content-management.html';
        });
    }
});