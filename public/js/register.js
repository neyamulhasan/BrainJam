// Registration functionality for register.html
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const registerBtn = document.getElementById('register-btn');

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
        const buttonText = document.getElementById('register-btn-text');
        
        if (isLoading) {
            registerBtn.disabled = true;
            buttonText.innerHTML = '<span class="loading"></span>Creating Account...';
        } else {
            registerBtn.disabled = false;
            buttonText.innerHTML = 'Register';
        }
    }

    // Real-time validation
    const usernameField = document.getElementById('username');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');

    // Username validation (allow digits but not all digits)
    usernameField.addEventListener('blur', function() {
        const username = this.value.trim();
        if (username && username.length < 3) {
            showFieldError('username', 'Username must be at least 3 characters');
        } else if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
            showFieldError('username', 'Username can only contain letters, numbers, and underscores');
        } else if (username && /^[0-9]+$/.test(username)) {
            showFieldError('username', 'Username cannot be only numbers');
        }
    });

    // Email validation (must be lowercase)
    emailField.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('email', 'Please enter a valid email address');
        } else if (email && email !== email.toLowerCase()) {
            showFieldError('email', 'Email must be lowercase');
        }
    });

    // Password validation
    passwordField.addEventListener('input', function() {
        const password = this.value;
        if (password && password.length < 6) {
            showFieldError('password', 'Password must be at least 6 characters');
        }
        
        // Check confirm password if it has a value
        if (confirmPasswordField.value && password !== confirmPasswordField.value) {
            showFieldError('confirmPassword', 'Passwords do not match');
        } else if (confirmPasswordField.value && password === confirmPasswordField.value) {
            document.getElementById('confirmPassword').classList.remove('error');
            document.getElementById('confirmPassword-error').textContent = '';
        }
    });

    // Confirm password validation
    confirmPasswordField.addEventListener('input', function() {
        const password = passwordField.value;
        const confirmPassword = this.value;
        
        if (confirmPassword && password !== confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match');
        }
    });

    // Form submission
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

        // Client-side validation
        let hasErrors = false;

        if (!data.username.trim()) {
            showFieldError('username', 'Username is required');
            hasErrors = true;
        } else if (data.username.length < 3) {
            showFieldError('username', 'Username must be at least 3 characters');
            hasErrors = true;
        } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            showFieldError('username', 'Username can only contain letters, numbers, and underscores');
            hasErrors = true;
        } else if (/^[0-9]+$/.test(data.username)) {
            showFieldError('username', 'Username cannot be only numbers');
            hasErrors = true;
        }

        if (!data.email.trim()) {
            showFieldError('email', 'Email is required');
            hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            showFieldError('email', 'Please enter a valid email address');
            hasErrors = true;
        } else if (data.email !== data.email.toLowerCase()) {
            showFieldError('email', 'Email must be lowercase');
            hasErrors = true;
        }

        if (!data.password.trim()) {
            showFieldError('password', 'Password is required');
            hasErrors = true;
        } else if (data.password.length < 6) {
            showFieldError('password', 'Password must be at least 6 characters');
            hasErrors = true;
        }

        if (!data.confirmPassword.trim()) {
            showFieldError('confirmPassword', 'Please confirm your password');
            hasErrors = true;
        } else if (data.password !== data.confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match');
            hasErrors = true;
        }

        if (!document.getElementById('terms').checked) {
            showMessage('You must agree to the Terms of Service');
            hasErrors = true;
        }

        if (hasErrors) return;

        setLoading(true);

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
                
                showMessage('Registration successful! Welcome to BrainJam Arena!', 'success');
                
                // Redirect to appropriate dashboard based on role
                setTimeout(() => {
                    const user = result.user;
                    window.location.href = user && user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard.html';
                }, 1500);
            } else {
                if (result.errors) {
                    // Handle validation errors from server
                    result.errors.forEach(error => {
                        const fieldId = error.path || error.param;
                        if (fieldId && document.getElementById(fieldId)) {
                            showFieldError(fieldId, error.msg);
                        } else {
                            showMessage(error.msg);
                        }
                    });
                } else {
                    showMessage(result.error || 'Registration failed. Please try again.');
                }
            }
        } catch (error) {
            showMessage('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    });

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
        const user = JSON.parse(storedUser);
        window.location.href = user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard.html';
    }
});
