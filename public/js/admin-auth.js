// Admin authentication functions
// This is a modified version of auth.js for admin pages that doesn't include the automatic redirect

// Utility functions
function showMessage(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="message ${type}">${message}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + '-error');
    
    if (field && errorElement) {
        field.classList.add('error');
        errorElement.textContent = message;
        
        // Clear error on input
        field.addEventListener('input', function() {
            field.classList.remove('error');
            errorElement.textContent = '';
        }, { once: true });
    }
}

// Set button to loading state
function setLoading(button, textElement, isLoading) {
    if (button && textElement) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            textElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            textElement.textContent = textElement.dataset.originalText;
        }
    }
}

// Logout functionality that can be used by admin pages
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}