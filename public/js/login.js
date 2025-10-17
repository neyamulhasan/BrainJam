// Login functionality for login.html
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');

    // Utility functions
    function showMessage(message, type = 'error') {
        const container = document.getElementById('message-container');
        container.innerHTML = `<div class="message ${type}">${message}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + '-error');
        
        field.classList.add('error');
        errorElement.textContent = message;
        
        // Clear error on input
        field.addEventListener('input', function() {
            field.classList.remove('error');
            errorElement.textContent = '';
        }, { once: true });
    }

    function clearFieldErrors() {
        document.querySelectorAll('.form-input.error').forEach(field => {
            field.classList.remove('error');
        });
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
    }

    function setLoading(isLoading) {
        const buttonText = document.getElementById('login-btn-text');
        
        if (isLoading) {
            loginBtn.disabled = true;
            buttonText.innerHTML = '<span class="loading"></span>Signing In...';
        } else {
            loginBtn.disabled = false;
            buttonText.innerHTML = 'Login';
        }
    }

    // Login form handler
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearFieldErrors();

        const formData = new FormData(loginForm);
        const data = {
            identifier: formData.get('identifier'),
            password: formData.get('password')
        };

        // Basic validation
        let hasErrors = false;

        if (!data.identifier.trim()) {
            showFieldError('identifier', 'Username or email is required');
            hasErrors = true;
        }

        if (!data.password.trim()) {
            showFieldError('password', 'Password is required');
            hasErrors = true;
        }

        if (hasErrors) return;

        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Store auth token
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                showMessage('Login successful! Welcome back to BrainJam Arena!', 'success');
                
                // Redirect based on user role
                setTimeout(() => {
                    // Check if user is admin
                    if (result.user.role === 'admin') {
                        window.location.href = '/admin-dashboard.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                }, 1500);
            } else {
                if (result.errors) {
                    // Handle validation errors
                    result.errors.forEach(error => {
                        if (error.path === 'identifier') {
                            showFieldError('identifier', error.msg);
                        } else if (error.path === 'password') {
                            showFieldError('password', error.msg);
                        }
                    });
                } else {
                    showMessage(result.error || 'Login failed. Please check your credentials.');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    });

    // Real-time validation
    const identifierField = document.getElementById('identifier');
    const passwordField = document.getElementById('password');

    identifierField.addEventListener('blur', function() {
        if (!this.value.trim()) {
            showFieldError('identifier', 'Username or email is required');
        }
    });

    passwordField.addEventListener('blur', function() {
        if (!this.value.trim()) {
            showFieldError('password', 'Password is required');
        }
    });

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
        const user = JSON.parse(storedUser);
        // Redirect to appropriate dashboard
        window.location.href = user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard.html';
    }
});
