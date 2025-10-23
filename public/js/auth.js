// Authentication functionality for login.html
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');

    // Utility functions
    function showMessage(containerId, message, type = 'error') {
        const container = document.getElementById(containerId);
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

    function setLoading(button, textElement, isLoading) {
        if (isLoading) {
            button.disabled = true;
            textElement.innerHTML = '<span class="loading"></span>Processing...';
        } else {
            button.disabled = false;
            textElement.innerHTML = button.id === 'login-btn' ? 'Login' : 'Register';
        }
    }

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearFieldErrors();

            const formData = new FormData(loginForm);
            const data = {
                identifier: formData.get('identifier'),
                password: formData.get('password')
            };

            // Basic validation
            if (!data.identifier.trim()) {
                showFieldError('identifier', 'Username or email is required');
                return;
            }

            if (!data.password.trim()) {
                showFieldError('password', 'Password is required');
                return;
            }

            const loginBtnText = document.getElementById('login-btn-text');
            setLoading(loginBtn, loginBtnText, true);

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
                    
                    showMessage('message-container', 'Login successful! Redirecting...', 'success');
                    
                    // Redirect to dashboard or home page
                    setTimeout(() => {
                        window.location.href = '/';
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
                        showMessage('message-container', result.error || 'Login failed');
                    }
                }
            } catch (error) {
                showMessage('message-container', 'Network error. Please try again.');
            } finally {
                setLoading(loginBtn, loginBtnText, false);
            }
        });
    }

    // Register form handler (for combined login.html page)
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearFieldErrors();

            const formData = new FormData(registerForm);
            const data = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            // Basic validation
            let hasErrors = false;

            if (!data.username.trim()) {
                showFieldError('reg-username', 'Username is required');
                hasErrors = true;
            } else if (data.username.length < 3) {
                showFieldError('reg-username', 'Username must be at least 3 characters');
                hasErrors = true;
            }

            if (!data.email.trim()) {
                showFieldError('reg-email', 'Email is required');
                hasErrors = true;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                showFieldError('reg-email', 'Please enter a valid email');
                hasErrors = true;
            }

            if (!data.password.trim()) {
                showFieldError('reg-password', 'Password is required');
                hasErrors = true;
            } else if (data.password.length < 6) {
                showFieldError('reg-password', 'Password must be at least 6 characters');
                hasErrors = true;
            }

            if (data.password !== data.confirmPassword) {
                showFieldError('reg-confirm-password', 'Passwords do not match');
                hasErrors = true;
            }

            if (!document.getElementById('terms').checked) {
                showMessage('register-message-container', 'You must agree to the Terms of Service');
                hasErrors = true;
            }

            if (hasErrors) return;

            const registerBtnText = document.getElementById('register-btn-text');
            setLoading(registerBtn, registerBtnText, true);

            try {
                const response = await fetch('/api/auth/register', {
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
                    
                    showMessage('register-message-container', 'Registration successful! Welcome to BrainJam Arena!', 'success');
                    
                    // Redirect to dashboard or home page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    if (result.errors) {
                        // Handle validation errors
                        result.errors.forEach(error => {
                            const fieldMap = {
                                'username': 'reg-username',
                                'email': 'reg-email',
                                'password': 'reg-password',
                                'confirmPassword': 'reg-confirm-password'
                            };
                            
                            const fieldId = fieldMap[error.path];
                            if (fieldId) {
                                showFieldError(fieldId, error.msg);
                            }
                        });
                    } else {
                        showMessage('register-message-container', result.error || 'Registration failed');
                    }
                }
            } catch (error) {
                showMessage('register-message-container', 'Network error. Please try again.');
            } finally {
                setLoading(registerBtn, registerBtnText, false);
            }
        });
    }

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // Redirect to home if already logged in
        window.location.href = '/';
    }
});
