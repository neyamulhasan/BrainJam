// Discussion Room JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let messagePollingInterval = null;
    let lastMessageCount = 0;
    
    // Initialize
    init();
    
    function init() {
        checkAuth();
        setupEventListeners();
        loadChatRoom();
        
        // Poll for new messages every 10 seconds to reduce server load
        messagePollingInterval = setInterval(pollMessages, 10000);
        
        // Leave chat room when page unloads
        window.addEventListener('beforeunload', leaveChatRoom);
    }
    
    function checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            window.location.href = '/login.html';
            return;
        }
        
        currentUser = JSON.parse(user);
    }
    
    async function loadChatRoom() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/discussion/room', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                currentUser = result.data.currentUser;
                
                // Update UI with current user info
                updateCurrentUserUI();
                
                // Load existing messages
                loadMessages(result.data.messages);
                
                // Load active users
                updateActiveUsers(result.data.activeUsers);
            } else {
                showMessage('Failed to load chat room', 'error');
            }
        } catch (error) {
            showMessage('Failed to connect to chat room', 'error');
        }
    }

    function updateCurrentUserUI() {
        if (currentUser) {
            const currentUserName = document.getElementById('current-user-name');
            const currentUserAvatar = document.getElementById('current-user-avatar');
            
            if (currentUserName) {
                currentUserName.textContent = currentUser.name || 'You';
            }
            
            if (currentUserAvatar) {
                currentUserAvatar.src = currentUser.avatar || '/images/default-avatar.svg';
            }
        }
    }
    
    function setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const charCount = document.getElementById('char-count');
        
        if (messageInput) {
            messageInput.addEventListener('keypress', handleKeyPress);
            messageInput.addEventListener('input', updateCharCount);
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }
        
        // Clear chat button only
        const clearChatBtn = document.getElementById('clear-chat');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', clearChat);
        }
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.emoji-picker') && !e.target.closest('.emoji-btn')) {
                closeEmojiPicker();
            }
        });
    }
    
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    }
    
    function updateCharCount() {
        const messageInput = document.getElementById('message-input');
        const charCount = document.getElementById('char-count');
        
        if (messageInput && charCount) {
            const currentLength = messageInput.value.length;
            const maxLength = 500;
            charCount.textContent = `${currentLength}/${maxLength}`;
            
            if (currentLength > maxLength * 0.8) {
                charCount.style.color = '#ff6b6b';
            } else {
                charCount.style.color = '#666';
            }
        }
    }
    
    function handleTyping() {
        // Show typing indicator for other users
        const typingIndicator = document.getElementById('typing-indicator');
        
        clearTimeout(typingTimeout);
        
        // In a real implementation, you would emit typing events to other users
        // For demo purposes, we'll just show a local typing indicator occasionally
        
        typingTimeout = setTimeout(() => {
            // Stop typing
        }, 2000);
    }
    
    async function sendMessage() {
        const messageInput = document.getElementById('message-input');
        const messageText = messageInput.value.trim();
        
        if (!messageText) return;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/discussion/message', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: messageText })
            });

            const result = await response.json();
            if (result.success) {
                // Clear input
                messageInput.value = '';
                updateCharCount();
                
                // Message will appear when polling picks it up
            } else {
                showMessage(result.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            showMessage('Failed to send message', 'error');
        }
    }
    
    function loadMessages(messages) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        // Clear existing messages except welcome
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }

        // Add all messages
        messages.forEach(message => {
            const messageElement = createMessageElement({
                id: message.id,
                username: message.username,
                avatar: message.avatar,
                text: message.message,
                timestamp: new Date(message.timestamp),
                isOwn: message.userId === currentUser.id
            });
            chatMessages.appendChild(messageElement);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Remove welcome message if there are real messages
        if (messages.length > 0 && welcomeMessage) {
            welcomeMessage.remove();
        }
    }

    function addMessageToChat(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageElement = createMessageElement(message);
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Remove welcome message if it exists
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        if (welcomeMessage && chatMessages.children.length > 2) {
            welcomeMessage.remove();
        }
    }
    
    function createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-item ${message.isOwn ? 'own' : ''}`;
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="${message.avatar}" alt="${message.username}">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username">${message.username}</span>
                    <span class="message-time">${formatTime(message.timestamp)}</span>
                </div>
                <div class="message-text">${escapeHtml(message.text)}</div>
            </div>
        `;
        return messageDiv;
    }
    
    async function pollMessages() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/discussion/messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                // Only update if message count changed to reduce DOM manipulation
                if (result.data.messages.length !== lastMessageCount) {
                    loadMessages(result.data.messages);
                    lastMessageCount = result.data.messages.length;
                }
                updateActiveUsers(result.data.activeUsers);
            }
        } catch (error) {
            // If there's an error, reduce polling frequency
            if (messagePollingInterval) {
                clearInterval(messagePollingInterval);
                messagePollingInterval = setInterval(pollMessages, 15000); // Slow down to 15 seconds on error
            }
        }
    }

    async function leaveChatRoom() {
        try {
            const token = localStorage.getItem('authToken');
            await fetch('/api/discussion/leave', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Clear polling interval
            if (messagePollingInterval) {
                clearInterval(messagePollingInterval);
            }
        } catch (error) {
        }
    }
    
    function updateActiveUsers(users) {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;

        // Keep current user element
        const currentUserElement = usersList.querySelector('.current-user');
        usersList.innerHTML = '';
        if (currentUserElement) {
            usersList.appendChild(currentUserElement);
        }

        // Add other active users
        users.forEach(user => {
            if (user.id !== currentUser.id) {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.innerHTML = `
                    <div class="user-avatar">
                        <img src="${user.avatar}" alt="${user.name}">
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-status online">Online</div>
                    </div>
                `;
                usersList.appendChild(userDiv);
            }
        });

        updateOnlineCount();
    }
    
    function addSystemMessage(text) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${text}</span>
        `;
        
        chatMessages.appendChild(systemDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateOnlineCount() {
        const onlineCountElement = document.getElementById('online-count');
        const usersList = document.getElementById('users-list');
        
        if (onlineCountElement && usersList) {
            const userCount = usersList.querySelectorAll('.user-item').length;
            onlineCountElement.textContent = `${userCount} user${userCount !== 1 ? 's' : ''} online`;
        }
    }
    
    function showTypingIndicator(username) {
        const typingIndicator = document.getElementById('typing-indicator');
        const typingText = typingIndicator.querySelector('.typing-text');
        
        if (typingIndicator && typingText) {
            typingText.textContent = `${username} is typing...`;
            typingIndicator.classList.add('active');
        }
    }
    
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('active');
        }
    }

    async function clearChat() {
        if (confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/discussion/clear', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const result = await response.json();
                if (result.success) {
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        chatMessages.innerHTML = `
                            <div class="welcome-message">
                                <div class="system-message">
                                    <i class="fas fa-broom"></i>
                                    <span>Chat cleared. Start a new conversation!</span>
                                </div>
                            </div>
                        `;
                    }
                    showMessage('Chat cleared successfully', 'success');
                    lastMessageCount = 0; // Reset message count
                } else {
                    showMessage('Failed to clear chat: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Failed to clear chat', 'error');
            }
        }
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = message;
            messageContainer.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }
    
    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Leave chat room before logout
            leaveChatRoom();
            
            // Clear intervals
            if (messagePollingInterval) {
                clearInterval(messagePollingInterval);
            }
            
            // Remove auth data and redirect
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    }
});