// API Configuration for AuctionHub
// This file handles switching between development and production environments

class ApiConfig {
    constructor() {
        // Detect environment
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        // Set base URL based on environment
        if (this.isDevelopment) {
            this.baseURL = 'http://localhost:5000/api';
        } else {
            // Replace 'yourusername' with actual PythonAnywhere username
            this.baseURL = 'https://yourusername.pythonanywhere.com/api';
        }
        
        // Authentication token storage
        this.authToken = localStorage.getItem('auctionhub_token');
        this.currentUser = JSON.parse(localStorage.getItem('auctionhub_user') || 'null');
    }
    
    // Get API endpoint URL
    getEndpoint(path) {
        return `${this.baseURL}${path}`;
    }
    
    // Get authentication headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.authToken) {
            headers['Authorization'] = this.authToken;
        }
        
        return headers;
    }
    
    // Save authentication data
    saveAuth(token, user) {
        this.authToken = token;
        this.currentUser = user;
        localStorage.setItem('auctionhub_token', token);
        localStorage.setItem('auctionhub_user', JSON.stringify(user));
    }
    
    // Clear authentication data
    clearAuth() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('auctionhub_token');
        localStorage.removeItem('auctionhub_user');
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return this.authToken && this.currentUser;
    }
    
    // Make API request with error handling
    async makeRequest(endpoint, options = {}) {
        try {
            const url = this.getEndpoint(endpoint);
            const defaultOptions = {
                headers: this.getAuthHeaders()
            };
            
            const requestOptions = { ...defaultOptions, ...options };
            
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    // Convenience methods for common HTTP methods
    async get(endpoint) {
        return this.makeRequest(endpoint, { method: 'GET' });
    }
    
    async post(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.makeRequest(endpoint, { method: 'DELETE' });
    }
    
    // File upload method
    async uploadFile(file, additionalData = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Add any additional data
            Object.keys(additionalData).forEach(key => {
                formData.append(key, additionalData[key]);
            });
            
            const response = await fetch(this.getEndpoint('/upload'), {
                method: 'POST',
                headers: {
                    'Authorization': this.authToken
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }
            
            return data;
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }
}

// Create global API instance
const api = new ApiConfig();

// Export for modules (if using)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiConfig;
}