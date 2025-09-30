// Enhanced AuctionHub JavaScript with Backend Integration

// Global variables
let currentAuctions = [];
let categories = [];
let userAuthenticated = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 AuctionHub Frontend Loading...');
    
    // Check authentication status
    checkAuthStatus();
    
    // Load initial data
    await loadCategories();
    await loadAuctions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start countdown timers
    startCountdownTimers();
    
    console.log('✅ AuctionHub Frontend Ready!');
});

// Check if user is authenticated
function checkAuthStatus() {
    if (api.isLoggedIn()) {
        userAuthenticated = true;
        updateUIForLoggedInUser();
    } else {
        userAuthenticated = false;
        updateUIForGuestUser();
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const userActions = document.querySelector('.user-actions');
    if (userActions && api.currentUser) {
        // Show sell button only for admin users
        const sellButton = api.currentUser.is_admin ? 
            '<a href="sell.html" class="btn-primary">Sell Item</a>' : '';
        
        userActions.innerHTML = `
            <span class="user-welcome">Welcome, ${api.currentUser.username}!</span>
            ${sellButton}
            <button onclick="logout()" class="btn-secondary">Logout</button>
        `;
    }
    
    // Update navigation and other selling-related UI elements
    updateSellingUI();
}

// Update selling-related UI elements based on admin status
function updateSellingUI() {
    const isAdmin = api.currentUser && api.currentUser.is_admin;
    
    // Hide/show selling link in navigation
    const navSellLink = document.querySelector('nav a[href="sell.html"]');
    if (navSellLink) {
        navSellLink.style.display = isAdmin ? 'block' : 'none';
    }
    
    // Hide/show "Start Selling" button in hero section
    const heroSellButton = document.querySelector('.hero-buttons a[href="sell.html"]');
    if (heroSellButton) {
        heroSellButton.style.display = isAdmin ? 'inline-block' : 'none';
    }
    
    // Update any "Start the first auction!" buttons
    const startAuctionButtons = document.querySelectorAll('a[href="sell.html"]');
    startAuctionButtons.forEach(button => {
        if (button !== navSellLink && button !== heroSellButton) {
            button.style.display = isAdmin ? 'inline-block' : 'none';
        }
    });
}

// Update UI for guest user
function updateUIForGuestUser() {
    const userActions = document.querySelector('.user-actions');
    if (userActions) {
        userActions.innerHTML = `
            <a href="login.html" class="btn-secondary">Login</a>
            <a href="signup.html" class="btn-primary">Sign Up</a>
        `;
    }
    
    // Hide selling UI elements for guest users
    updateSellingUI();
}

// Load categories from backend
async function loadCategories() {
    try {
        console.log('📂 Loading categories...');
        categories = await api.get('/categories');
        displayCategories();
        console.log(`✅ Loaded ${categories.length} categories`);
    } catch (error) {
        console.error('❌ Failed to load categories:', error);
        showNotification('Failed to load categories', 'error');
    }
}

// Display categories in the UI
function displayCategories() {
    const categoriesSection = document.getElementById('categories');
    if (!categoriesSection || categories.length === 0) return;
    
    const categoriesHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory(${category.id})">
            <i class="${category.icon || 'fas fa-tag'}"></i>
            <h3>${category.name}</h3>
            <p>${category.description}</p>
        </div>
    `).join('');
    
    categoriesSection.innerHTML = `
        <div class="container">
            <h2>Browse by Category</h2>
            <div class="categories-grid">
                ${categoriesHTML}
            </div>
        </div>
    `;
}

// Load auctions from backend
async function loadAuctions(page = 1, filters = {}) {
    try {
        console.log('🔨 Loading auctions...');
        const queryParams = new URLSearchParams({
            page: page,
            per_page: 12,
            ...filters
        });
        
        const response = await api.get(`/auctions?${queryParams}`);
        currentAuctions = response.auctions;
        
        displayAuctions();
        updatePagination(response.current_page, response.pages);
        
        console.log(`✅ Loaded ${currentAuctions.length} auctions`);
    } catch (error) {
        console.error('❌ Failed to load auctions:', error);
        showNotification('Failed to load auctions', 'error');
        displayFallbackAuctions();
    }
}

// Display auctions in the UI
function displayAuctions() {
    const auctionsSection = document.getElementById('auctions');
    if (!auctionsSection) return;
    
    if (currentAuctions.length === 0) {
        auctionsSection.innerHTML = `
            <div class="container">
                <h2>Live Auctions</h2>
                <div class="no-auctions">
                    <p>No active auctions at the moment.</p>
                    <a href="sell.html" class="btn-primary">Start the first auction!</a>
                </div>
            </div>
        `;
        return;
    }
    
    const auctionsHTML = currentAuctions.map(auction => `
        <div class="auction-card" data-auction-id="${auction.id}">
            <div class="auction-image">
                <img src="${getAuctionImage(auction)}" alt="${auction.title}" loading="lazy">
                <div class="auction-status ${auction.is_active ? 'live' : 'ended'}">
                    ${auction.is_active ? 'LIVE' : 'ENDED'}
                </div>
            </div>
            <div class="auction-info">
                <h3>${auction.title}</h3>
                <p class="auction-description">${truncateText(auction.description, 100)}</p>
                <div class="price-info">
                    <div class="current-bid">
                        <span class="label">Current Bid:</span>
                        <span class="amount">$${auction.current_price.toLocaleString()}</span>
                    </div>
                    <div class="bid-count">${auction.bid_count} bids</div>
                </div>
                <div class="auction-timer">
                    <i class="fas fa-clock"></i>
                    <span class="time-remaining" data-end-time="${auction.end_time}">
                        ${auction.time_remaining}
                    </span>
                </div>
                <button class="btn-primary bid-now" onclick="showBidModal(${auction.id})">Bid Now</button>
            </div>
        </div>`).join('');
    
    auctionsSection.innerHTML = `
        <div class="container">
            <div class="auctions-header">
                <h2>Live Auctions</h2>
                <div class="auctions-controls">
                    <select onchange="sortAuctions(this.value)" class="sort-select">
                        <option value="ending_soon">Ending Soon</option>
                        <option value="newest">Newest First</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="most_bids">Most Bids</option>
                    </select>
                </div>
            </div>
            <div class="auction-grid">
                ${auctionsHTML}
            </div>
        </div>
    `;
}

// Get auction image with fallback
function getAuctionImage(auction) {
    // Check if auction has images
    if (auction.images && auction.images.length > 0) {
        return auction.images[0].url;
    }
    
    // Fallback based on category or title
    const title = auction.title.toLowerCase();
    if (title.includes('watch') || title.includes('rolex')) {
        return 'RolexSubmariner.jpg';
    } else if (title.includes('laptop') || title.includes('rtx')) {
        return 'Rtx4070.jpg';
    } else if (title.includes('vase') || title.includes('ming')) {
        return 'mingvases.jpeg';
    } else if (title.includes('ring') || title.includes('diamond')) {
        return 'Ring2C.jpg';
    } else if (title.includes('mustang') || title.includes('car')) {
        return 'Mustang.jpg';
    } else if (title.includes('painting') || title.includes('art')) {
        return 'oilpaint.jpg';
    }
    
    return 'https://via.placeholder.com/300x200?text=Auction+Item';
}

// Truncate text for display
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Start countdown timers for auctions
function startCountdownTimers() {
    const timeElements = document.querySelectorAll('.time-remaining[data-end-time]');
    
    if (timeElements.length === 0) return;
    
    setInterval(() => {
        timeElements.forEach(element => {
            const endTime = new Date(element.dataset.endTime);
            const now = new Date();
            const timeLeft = endTime - now;
            
            if (timeLeft <= 0) {
                element.textContent = 'Auction Ended';
                element.classList.add('ended');
            } else {
                element.textContent = formatTimeRemaining(timeLeft);
            }
        });
    }, 1000);
}

// Format time remaining
function formatTimeRemaining(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

// Show bid modal
async function showBidModal(auctionId) {
    try {
        const auction = await api.get(`/auctions/${auctionId}`);
        
        const modal = document.getElementById('bidModal') || createBidModal();
        const modalContent = modal.querySelector('.modal-content');
        
        // Get current user name if logged in
        const currentUserName = api.currentUser ? api.currentUser.username : '';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Place Your Bid</h3>
                <button onclick="closeBidModal()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="auction-summary">
                    <h4>${auction.auction.title}</h4>
                    <img src="${getAuctionImage(auction.auction)}" alt="${auction.auction.title}" style="width: 100%; max-width: 200px; height: auto; margin: 10px 0;">
                    <p><strong>Current Bid:</strong> $${auction.auction.current_price.toLocaleString()}</p>
                    <p><strong>Number of Bids:</strong> ${auction.auction.bid_count}</p>
                </div>
                <div class="bid-form">
                    <label for="bidderName">Your Name:</label>
                    <input type="text" id="bidderName" placeholder="Enter your name" value="${currentUserName}" required>
                    
                    <label for="bidAmount">Your Bid Amount ($):</label>
                    <input type="number" id="bidAmount" min="${auction.auction.current_price + 1}" step="0.01" placeholder="${auction.auction.current_price + 1}" required>
                    
                    <div class="bid-info">
                        <p><i class="fas fa-info-circle"></i> Minimum bid: $${(auction.auction.current_price + 1).toLocaleString()}</p>
                        ${!api.currentUser ? '<p><i class="fas fa-user-plus"></i> No account needed! Just enter your name to bid.</p>' : ''}
                    </div>
                    
                    <div class="bid-actions">
                        <button onclick="placeBid(${auctionId})" class="btn-primary">Place Bid</button>
                        <button onclick="closeBidModal()" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Focus on name field if empty, otherwise focus on bid amount
        setTimeout(() => {
            if (!currentUserName) {
                document.getElementById('bidderName').focus();
            } else {
                document.getElementById('bidAmount').focus();
            }
        }, 100);
        
    } catch (error) {
        console.error('Failed to load auction details:', error);
        showNotification('Failed to load auction details', 'error');
    }
}

// Create bid modal if it doesn't exist
function createBidModal() {
    const modal = document.createElement('div');
    modal.id = 'bidModal';
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content"></div>';
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBidModal();
        }
    });
    
    return modal;
}

// Close bid modal
function closeBidModal() {
    const modal = document.getElementById('bidModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Place a bid
async function placeBid(auctionId) {
    const bidAmountInput = document.getElementById('bidAmount');
    const bidderNameInput = document.getElementById('bidderName');
    const bidAmount = parseFloat(bidAmountInput.value);
    const bidderName = bidderNameInput.value.trim();
    
    // Validate inputs
    if (!bidderName) {
        showNotification('Please enter your name', 'warning');
        bidderNameInput.focus();
        return;
    }
    
    if (bidderName.length < 2) {
        showNotification('Name must be at least 2 characters long', 'warning');
        bidderNameInput.focus();
        return;
    }
    
    if (!bidAmount || bidAmount <= 0) {
        showNotification('Please enter a valid bid amount', 'warning');
        bidAmountInput.focus();
        return;
    }
    
    try {
        const response = await api.post('/bids', {
            auctionId: auctionId,
            amount: bidAmount,
            bidderName: bidderName
        });
        
        showNotification(`Bid placed successfully by ${bidderName}!`, 'success');
        closeBidModal();
        
        // Refresh auctions to show updated data
        await loadAuctions();
        
    } catch (error) {
        console.error('Failed to place bid:', error);
        showNotification(error.message || 'Failed to place bid', 'error');
    }
}

// View auction details
function viewAuction(auctionId) {
    window.location.href = `product.html?id=${auctionId}`;
}

// Filter auctions by category
async function filterByCategory(categoryId) {
    await loadAuctions(1, { category_id: categoryId });
}

// Sort auctions
async function sortAuctions(sortBy) {
    await loadAuctions(1, { sort: sortBy });
}

// Logout function
async function logout() {
    try {
        await api.post('/logout');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        api.clearAuth();
        userAuthenticated = false;
        updateUIForGuestUser();
        showNotification('Logged out successfully', 'info');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchForm = document.querySelector('.search-bar form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBidModal();
        }
    });
}

// Handle search
async function handleSearch(e) {
    e.preventDefault();
    const searchInput = e.target.querySelector('input[type="text"]');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        await loadAuctions(1, { search: searchTerm });
    } else {
        await loadAuctions();
    }
}

// Fallback auction data for when backend is not available
function displayFallbackAuctions() {
    const fallbackAuctions = [
        {
            id: 1,
            title: "Vintage Rolex Submariner",
            description: "Authentic vintage Rolex Submariner in excellent condition",
            current_price: 8500,
            bid_count: 23,
            end_time: "2025-10-01T15:30:00",
            is_active: true
        },
        {
            id: 2,
            title: "Gaming Laptop RTX 4080",
            description: "High-performance gaming laptop with RTX 4080",
            current_price: 1850,
            bid_count: 15,
            end_time: "2025-10-01T18:45:00",
            is_active: true
        }
    ];
    
    currentAuctions = fallbackAuctions;
    displayAuctions();
}

// Update pagination
function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer || totalPages <= 1) return;
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="loadAuctions(${currentPage - 1})" class="pagination-btn">Previous</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        paginationHTML += `<button onclick="loadAuctions(${i})" class="pagination-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="loadAuctions(${currentPage + 1})" class="pagination-btn">Next</button>`;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

// Export functions for global use
window.showBidModal = showBidModal;
window.closeBidModal = closeBidModal;
window.placeBid = placeBid;
window.viewAuction = viewAuction;
window.filterByCategory = filterByCategory;
window.sortAuctions = sortAuctions;
window.logout = logout;