// File Upload and Sell Page JavaScript Integration

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!api.isLoggedIn()) {
        window.location.href = 'login.html?redirect=sell.html';
        return;
    }
    
    // Check if user is admin
    if (!api.currentUser.is_admin) {
        alert('Access denied: Only administrators can create auctions.');
        window.location.href = 'index.html';
        return;
    }
    
    initializeSellPage();
});

async function initializeSellPage() {
    // Load categories for dropdown
    await loadCategoriesForSell();
    
    // Setup form handlers
    setupSellForm();
    setupImageUpload();
    
    // Setup preview functionality
    setupPreview();
    
    console.log('✅ Sell page initialized');
}

// Load categories for the sell form
async function loadCategoriesForSell() {
    try {
        const categories = await api.get('/categories');
        const categorySelect = document.getElementById('category');
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select a category</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
        showSellNotification('Failed to load categories', 'error');
    }
}

// Setup sell form submission
function setupSellForm() {
    const sellForm = document.getElementById('sellForm');
    if (sellForm) {
        sellForm.addEventListener('submit', handleSellFormSubmission);
    }
}

// Handle sell form submission
async function handleSellFormSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Validate form
    const validationError = validateSellForm(formData);
    if (validationError) {
        showSellNotification(validationError, 'error');
        return;
    }
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Creating Auction...';
    submitButton.disabled = true;
    
    try {
        // Prepare auction data
        const auctionData = {
            title: formData.get('title'),
            description: formData.get('description'),
            startingPrice: parseFloat(formData.get('startingPrice')),
            reservePrice: formData.get('reservePrice') ? parseFloat(formData.get('reservePrice')) : null,
            buyoutPrice: formData.get('buyoutPrice') ? parseFloat(formData.get('buyoutPrice')) : null,
            endTime: calculateEndTime(formData.get('duration')),
            categoryId: parseInt(formData.get('category')),
            condition: formData.get('condition'),
            shippingCost: parseFloat(formData.get('shippingCost') || 0),
            location: formData.get('location') || ''
        };
        
        // Create auction
        const response = await api.post('/auctions', auctionData);
        
        // Upload images if any
        const uploadedImages = await uploadAuctionImages(response.auction.id);
        
        // Show success message
        showSellNotification('Auction created successfully!', 'success');
        
        // Redirect to auction page after delay
        setTimeout(() => {
            window.location.href = `product.html?id=${response.auction.id}`;
        }, 2000);
        
    } catch (error) {
        console.error('Failed to create auction:', error);
        showSellNotification(error.message || 'Failed to create auction', 'error');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Validate sell form
function validateSellForm(formData) {
    if (!formData.get('title') || formData.get('title').trim().length < 5) {
        return 'Title must be at least 5 characters long';
    }
    
    if (!formData.get('description') || formData.get('description').trim().length < 20) {
        return 'Description must be at least 20 characters long';
    }
    
    const startingPrice = parseFloat(formData.get('startingPrice'));
    if (!startingPrice || startingPrice <= 0) {
        return 'Starting price must be greater than 0';
    }
    
    if (startingPrice > 1000000) {
        return 'Starting price must be less than $1,000,000';
    }
    
    const reservePrice = formData.get('reservePrice') ? parseFloat(formData.get('reservePrice')) : null;
    if (reservePrice && reservePrice < startingPrice) {
        return 'Reserve price must be greater than or equal to starting price';
    }
    
    if (!formData.get('category')) {
        return 'Please select a category';
    }
    
    if (!formData.get('condition')) {
        return 'Please select item condition';
    }
    
    if (!formData.get('duration')) {
        return 'Please select auction duration';
    }
    
    return null; // No validation errors
}

// Calculate end time based on duration
function calculateEndTime(duration) {
    const now = new Date();
    const durationHours = parseInt(duration);
    
    const endTime = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));
    return endTime.toISOString();
}

// Setup image upload functionality
function setupImageUpload() {
    const imageInput = document.getElementById('images');
    const dropZone = document.querySelector('.image-upload-area');
    const imagePreview = document.getElementById('imagePreview');
    
    if (!imageInput || !dropZone) return;
    
    // File input change handler
    imageInput.addEventListener('change', handleImageSelection);
    
    // Drag and drop handlers
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleImageDrop);
    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
    
    // Click to upload
    dropZone.addEventListener('click', () => {
        imageInput.click();
    });
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

// Handle image drop
function handleImageDrop(event) {
    event.preventDefault();
    const dropZone = event.currentTarget;
    dropZone.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    processSelectedImages(files);
}

// Handle image selection from input
function handleImageSelection(event) {
    const files = Array.from(event.target.files);
    processSelectedImages(files);
}

// Process selected images
function processSelectedImages(files) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 16 * 1024 * 1024; // 16MB
    const maxFiles = 10;
    
    // Filter valid images
    const validImages = files.filter(file => {
        if (!allowedTypes.includes(file.type)) {
            showSellNotification(`${file.name} is not a supported image format`, 'warning');
            return false;
        }
        
        if (file.size > maxFileSize) {
            showSellNotification(`${file.name} is too large. Maximum size is 16MB`, 'warning');
            return false;
        }
        
        return true;
    });
    
    if (validImages.length > maxFiles) {
        showSellNotification(`Maximum ${maxFiles} images allowed`, 'warning');
        validImages.splice(maxFiles);
    }
    
    // Store files for upload
    window.selectedImages = validImages;
    
    // Show preview
    displayImagePreviews(validImages);
}

// Display image previews
function displayImagePreviews(images) {
    const previewContainer = document.getElementById('imagePreview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    images.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview-item';
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <div class="image-preview-overlay">
                    <button type="button" onclick="removeImage(${index})" class="remove-image-btn">
                        <i class="fas fa-times"></i>
                    </button>
                    <button type="button" onclick="setPrimaryImage(${index})" class="primary-image-btn ${index === 0 ? 'active' : ''}">
                        ${index === 0 ? 'Primary' : 'Set as Primary'}
                    </button>
                </div>
            `;
            previewContainer.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
    });
    
    // Update upload area text
    const uploadText = document.querySelector('.upload-text');
    if (uploadText) {
        uploadText.innerHTML = `
            <i class="fas fa-check-circle" style="color: green;"></i>
            ${images.length} image(s) selected
        `;
    }
}

// Remove image from selection
function removeImage(index) {
    if (window.selectedImages) {
        window.selectedImages.splice(index, 1);
        displayImagePreviews(window.selectedImages);
        
        if (window.selectedImages.length === 0) {
            const uploadText = document.querySelector('.upload-text');
            if (uploadText) {
                uploadText.innerHTML = `
                    <i class="fas fa-cloud-upload-alt"></i>
                    Drag and drop images here or click to browse
                `;
            }
        }
    }
}

// Set primary image
function setPrimaryImage(index) {
    if (window.selectedImages && index < window.selectedImages.length) {
        // Move selected image to first position
        const primaryImage = window.selectedImages.splice(index, 1)[0];
        window.selectedImages.unshift(primaryImage);
        
        // Refresh preview
        displayImagePreviews(window.selectedImages);
    }
}

// Upload auction images
async function uploadAuctionImages(auctionId) {
    if (!window.selectedImages || window.selectedImages.length === 0) {
        return [];
    }
    
    const uploadedImages = [];
    
    for (let i = 0; i < window.selectedImages.length; i++) {
        try {
            const response = await api.uploadFile(window.selectedImages[i], {
                auction_id: auctionId,
                is_primary: i === 0
            });
            uploadedImages.push(response);
        } catch (error) {
            console.error(`Failed to upload image ${i + 1}:`, error);
        }
    }
    
    return uploadedImages;
}

// Setup preview functionality
function setupPreview() {
    const previewButton = document.getElementById('previewButton');
    if (previewButton) {
        previewButton.addEventListener('click', showAuctionPreview);
    }
}

// Show auction preview
function showAuctionPreview() {
    const form = document.getElementById('sellForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    const previewData = {
        title: formData.get('title') || 'Untitled Auction',
        description: formData.get('description') || 'No description provided',
        startingPrice: parseFloat(formData.get('startingPrice')) || 0,
        reservePrice: formData.get('reservePrice') ? parseFloat(formData.get('reservePrice')) : null,
        condition: formData.get('condition') || 'Unknown',
        shippingCost: parseFloat(formData.get('shippingCost')) || 0,
        duration: formData.get('duration') || '168'
    };
    
    // Create preview modal
    const modal = createPreviewModal(previewData);
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Create preview modal
function createPreviewModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal preview-modal';
    modal.innerHTML = `
        <div class="modal-content preview-content">
            <div class="modal-header">
                <h3>Auction Preview</h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="preview-auction">
                    <h2>${data.title}</h2>
                    <div class="preview-images">
                        ${window.selectedImages && window.selectedImages.length > 0 ? 
                            '<div class="preview-image-placeholder">Images will be displayed here</div>' : 
                            '<div class="no-image-placeholder">No images selected</div>'
                        }
                    </div>
                    <div class="preview-details">
                        <p><strong>Description:</strong> ${data.description}</p>
                        <p><strong>Starting Price:</strong> $${data.startingPrice.toLocaleString()}</p>
                        ${data.reservePrice ? `<p><strong>Reserve Price:</strong> $${data.reservePrice.toLocaleString()}</p>` : ''}
                        <p><strong>Condition:</strong> ${data.condition}</p>
                        <p><strong>Shipping Cost:</strong> $${data.shippingCost.toLocaleString()}</p>
                        <p><strong>Duration:</strong> ${data.duration} hours</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="this.closest('.modal').remove()" class="btn-secondary">Close Preview</button>
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    return modal;
}

// Show sell notification
function showSellNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.sell-notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `sell-notification sell-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : 
                           type === 'success' ? 'fa-check-circle' : 
                           type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
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

// Export functions for global use
window.removeImage = removeImage;
window.setPrimaryImage = setPrimaryImage;