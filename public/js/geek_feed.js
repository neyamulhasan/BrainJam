/**
 * Geek Feed functionality
 * Handles posts creation, loading, and interactions
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const postsContainer = document.getElementById('posts-container');
    const postContentInput = document.getElementById('post-content');
    const submitPostButton = document.getElementById('submit-post');
    const sortSelect = document.getElementById('sort-select');
    const messageContainer = document.getElementById('message-container');
    const logoutBtn = document.getElementById('logout-btn');
    const userAvatarNav = document.getElementById('user-avatar-nav');
    
    // Check authentication - try both token storage methods
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // User data
    let userData = null;
    
    // Initialize
    init();
    
    // Event listeners
    submitPostButton.addEventListener('click', createPost);
    sortSelect.addEventListener('change', () => {
        loadPosts(sortSelect.value);
    });
    logoutBtn.addEventListener('click', logout);
    userAvatarNav.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });
    
    // Functions
    async function init() {
        try {
            // Load user data
            const userStr = localStorage.getItem('user');
            userData = userStr ? JSON.parse(userStr) : null;
            
            // Load posts with default sorting (latest)
            await loadPosts('latest');
        } catch (error) {
            console.error('Error initializing:', error);
            showMessage('Error loading geek feed', 'error');
        }
    }
    
    async function loadPosts(sortBy = 'latest') {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`/api/geek-feed/posts?sort=${sortBy}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to load posts');
            }
            
            displayPosts(result.data);
        } catch (error) {
            console.error('Error loading posts:', error);
            showMessage('Error loading posts', 'error');
        }
    }
    
    function displayPosts(posts) {
        postsContainer.innerHTML = '';
        
        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = `<p style="color: #7d7e8c; text-align: center; padding: 30px;">No posts yet. Be the first to post something!</p>`;
            return;
        }
        
        posts.forEach(post => {
            // Format the date
            const postDate = new Date(post.created_at);
            const formattedDate = formatPostDate(postDate);
            
            // Determine reaction classes
            const likeClass = post.user_reaction === 'like' ? 'active-like' : '';
            const dislikeClass = post.user_reaction === 'dislike' ? 'active-dislike' : '';
            
            // Create post element
            const postElement = document.createElement('div');
            postElement.classList.add('post-card');
            postElement.dataset.postId = post.id;
            
            // Always use default avatar since profile_picture doesn't exist in DB
            const avatarSrc = 'images/default-avatar.svg';
            
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${avatarSrc}" alt="User Avatar" class="user-avatar">
                    <div class="post-user-info">
                        <h4 class="post-username">${post.username}</h4>
                        <p class="post-time">${formattedDate}</p>
                    </div>
                </div>
                <div class="post-content">
                    ${escapeHTML(post.content)}
                </div>
                <div class="post-actions">
                    <div class="post-action ${likeClass}" data-action="like" data-post-id="${post.id}">
                        <i class="fas fa-thumbs-up"></i>
                        <span class="like-count">${post.likes || 0}</span>
                    </div>
                    <div class="post-action ${dislikeClass}" data-action="dislike" data-post-id="${post.id}">
                        <i class="fas fa-thumbs-down"></i>
                        <span class="dislike-count">${post.dislikes || 0}</span>
                    </div>
                </div>
            `;
            
            // Add event listeners to the like and dislike buttons
            const likeButton = postElement.querySelector('[data-action="like"]');
            const dislikeButton = postElement.querySelector('[data-action="dislike"]');
            
            likeButton.addEventListener('click', () => reactToPost(post.id, 'like'));
            dislikeButton.addEventListener('click', () => reactToPost(post.id, 'dislike'));
            
            postsContainer.appendChild(postElement);
        });
    }
    
    async function createPost() {
        const content = postContentInput.value.trim();
        
        if (!content) {
            showMessage('Post cannot be empty', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch('/api/geek-feed/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to create post');
            }
            
            // Clear the input
            postContentInput.value = '';
            
            // Reload posts to see the new one
            await loadPosts(sortSelect.value);
            showMessage('Post created successfully', 'success');
            
            // Force the form to reset
            document.activeElement.blur();
        } catch (error) {
            console.error('Error creating post:', error);
            showMessage('Error creating post', 'error');
        }
    }
    
    async function reactToPost(postId, reaction) {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            const response = await fetch(`/api/geek-feed/posts/${postId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reaction })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to react to post');
            }
            
            // Update the UI to reflect the reaction
            updatePostReaction(postId, result.data);
        } catch (error) {
            console.error('Error reacting to post:', error);
            showMessage('Error processing reaction', 'error');
        }
    }
    
    function updatePostReaction(postId, data) {
        const postElement = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (!postElement) return;
        
        const likeButton = postElement.querySelector('[data-action="like"]');
        const dislikeButton = postElement.querySelector('[data-action="dislike"]');
        const likeCount = postElement.querySelector('.like-count');
        const dislikeCount = postElement.querySelector('.dislike-count');
        
        // Update counts
        likeCount.textContent = data.likes || 0;
        dislikeCount.textContent = data.dislikes || 0;
        
        // Update classes based on user reaction
        likeButton.classList.toggle('active-like', data.user_reaction === 'like');
        dislikeButton.classList.toggle('active-dislike', data.user_reaction === 'dislike');
    }
    
    function formatPostDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        } else {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
    }
    
    function showMessage(message, type = 'info') {
        // Create message element if it doesn't exist
        if (!messageContainer.querySelector('.message')) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', type);
            messageElement.textContent = message;
            messageContainer.appendChild(messageElement);
            messageContainer.style.display = 'block';
        } else {
            // Update existing message
            const messageElement = messageContainer.querySelector('.message');
            messageElement.className = `message ${type}`;
            messageElement.textContent = message;
        }
        
        // Add style if not already present
        if (!document.getElementById('message-style')) {
            const style = document.createElement('style');
            style.id = 'message-style';
            style.textContent = `
                #message-container {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    width: auto;
                    max-width: 80%;
                }
                .message {
                    padding: 12px 24px;
                    border-radius: 6px;
                    color: white;
                    font-weight: 500;
                    text-align: center;
                }
                .message.success { background-color: #28a745; }
                .message.error { background-color: #dc3545; }
                .message.info { background-color: #17a2b8; }
            `;
            document.head.appendChild(style);
        }
        
        // Hide after delay
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
    
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }
    
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
});
