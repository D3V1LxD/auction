// Authentication JavaScript for Login and Signup Pages

// Check if user is already logged in and redirect
document.addEventListener('DOMContentLoaded', function() {
    if (api.isLoggedIn() && (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html'))) {
        window.location.href = 'index.html';
    }
    
    setupAuthForms();
});

function setupAuthForms() {
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Setup signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Add real-time validation
    addFormValidation();
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    // Validate form
    if (!loginData.username || !loginData.password) {
        showFormError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
    try {
        const response = await api.post('/login', loginData);
        
        // Save authentication data
        api.saveAuth(response.token, response.user);
        
        // Show success message
        showFormSuccess('Login successful! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
            const redirect = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
            window.location.href = redirect;
        }, 1500);
        
    } catch (error) {
        console.error('Login failed:', error);
        showFormError(error.message || 'Login failed. Please try again.');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const signupData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone') || '',
        address: formData.get('address') || ''
    };
    
    // Validate form
    const validationError = validateSignupForm(signupData);
    if (validationError) {
        showFormError(validationError);
        return;
    }
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;
    
    try {
        const response = await api.post('/register', signupData);
        
        // Save authentication data
        api.saveAuth(response.token, response.user);
        
        // Show success message
        showFormSuccess('Account created successfully! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup failed:', error);
        showFormError(error.message || 'Registration failed. Please try again.');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Validate signup form data
function validateSignupForm(data) {
    if (!data.username || data.username.length < 3) {
        return 'Username must be at least 3 characters long';
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        return 'Please enter a valid email address';
    }
    
    if (!data.password || data.password.length < 6) {
        return 'Password must be at least 6 characters long';
    }
    
    if (!data.firstName || !data.lastName) {
        return 'First name and last name are required';
    }
    
    // Check password confirmation if field exists
    const confirmPassword = document.querySelector('input[name="confirmPassword"]');
    if (confirmPassword && confirmPassword.value !== data.password) {
        return 'Passwords do not match';
    }
    
    return null; // No validation errors
}

// Check if email is valid
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Add real-time form validation
function addFormValidation() {
    // Username validation
    const usernameInput = document.querySelector('input[name="username"]');
    if (usernameInput) {
        usernameInput.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value.length < 3) {
                setFieldError(this, 'Username must be at least 3 characters long');
            } else {
                clearFieldError(this);
            }
        });
    }
    
    // Email validation
    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value.length > 0 && !isValidEmail(this.value)) {
                setFieldError(this, 'Please enter a valid email address');
            } else {
                clearFieldError(this);
            }
        });
    }
    
    // Password validation
    const passwordInput = document.querySelector('input[name="password"]');
    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value.length < 6) {
                setFieldError(this, 'Password must be at least 6 characters long');
            } else {
                clearFieldError(this);
            }
        });
    }
    
    // Confirm password validation
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value !== passwordInput.value) {
                setFieldError(this, 'Passwords do not match');
            } else {
                clearFieldError(this);
            }
        });
    }
}

// Set field error
function setFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.classList.add('error');
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('error');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Show form error message
function showFormError(message) {
    showFormMessage(message, 'error');
}

// Show form success message
function showFormSuccess(message) {
    showFormMessage(message, 'success');
}

// Show form message (error or success)
function showFormMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message form-message-${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Insert at top of form
    const form = document.querySelector('form');
    if (form) {
        form.insertBefore(messageDiv, form.firstChild);
        
        // Auto-remove after 5 seconds for error messages
        if (type === 'error') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }
}

// Show/hide password functionality
function togglePassword(button) {
    const passwordInput = button.parentNode.querySelector('input[type="password"], input[type="text"]');
    const icon = button.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
        button.title = 'Hide password';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
        button.title = 'Show password';
    }
}

// Social login handlers (placeholder for future implementation)
function loginWithGoogle() {
    showFormError('Google login not yet implemented');
}

function loginWithFacebook() {
    showFormError('Facebook login not yet implemented');
}

// Export functions for global use
window.togglePassword = togglePassword;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;