// Sell Page JavaScript Functionality

let uploadedImages = [];
let auctionType = '';

// Initialize the sell page
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    loadDraftIfExists();
    updateFeeBreakdown();
});

// Initialize form elements
function initializeForm() {
    // Set minimum date for scheduled start to today
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;
        startDateInput.value = today;
    }

    // Set default start time to current time + 1 hour
    const startTimeInput = document.getElementById('startTimeInput');
    if (startTimeInput) {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const timeString = now.toTimeString().slice(0, 5);
        startTimeInput.value = timeString;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Character counters
    const titleInput = document.getElementById('itemTitle');
    const descriptionInput = document.getElementById('itemDescription');
    
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            updateCharacterCount(this, 80);
        });
    }
    
    if (descriptionInput) {
        descriptionInput.addEventListener('input', function() {
            updateCharacterCount(this, 2000);
        });
    }

    // Price inputs for fee calculation
    const priceInputs = ['startingBid', 'reservePrice', 'buyNowPrice'];
    priceInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updateFeeBreakdown);
        }
    });

    // Start time selector
    const startTimeSelect = document.getElementById('startTime');
    if (startTimeSelect) {
        startTimeSelect.addEventListener('change', function() {
            const scheduledGroup = document.getElementById('scheduledTimeGroup');
            if (this.value === 'scheduled') {
                scheduledGroup.style.display = 'block';
            } else {
                scheduledGroup.style.display = 'none';
            }
        });
    }

    // Form submission
    const sellForm = document.getElementById('sellForm');
    if (sellForm) {
        sellForm.addEventListener('submit', handleFormSubmission);
    }

    // Auto-save form data
    setupAutoSave();

    // Drag and drop for images
    setupImageDragAndDrop();
}

// Update character count display
function updateCharacterCount(input, maxLength) {
    const currentLength = input.value.length;
    const counterElement = input.parentNode.querySelector('.character-count');
    
    if (counterElement) {
        counterElement.textContent = `${currentLength}/${maxLength} characters`;
        
        if (currentLength > maxLength * 0.9) {
            counterElement.style.color = '#dc3545';
        } else if (currentLength > maxLength * 0.8) {
            counterElement.style.color = '#ffc107';
        } else {
            counterElement.style.color = '#666';
        }
    }
}

// Select auction type
function selectAuctionType(type) {
    // Remove previous selection
    document.querySelectorAll('.auction-type-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Select new option
    const selectedOption = document.querySelector(`[onclick="selectAuctionType('${type}')"]`);
    selectedOption.classList.add('selected');
    
    // Update radio button
    const radioButton = document.getElementById(type);
    radioButton.checked = true;
    
    auctionType = type;
    
    // Show/hide relevant price fields
    const reservePriceGroup = document.getElementById('reservePriceGroup');
    const buyNowPriceGroup = document.getElementById('buyNowPriceGroup');
    
    reservePriceGroup.style.display = (type === 'reserve' || type === 'buynow') ? 'block' : 'none';
    buyNowPriceGroup.style.display = (type === 'buynow') ? 'block' : 'none';
    
    // Update required attributes
    const reservePriceInput = document.getElementById('reservePrice');
    const buyNowPriceInput = document.getElementById('buyNowPrice');
    
    if (type === 'reserve') {
        reservePriceInput.required = true;
        buyNowPriceInput.required = false;
    } else if (type === 'buynow') {
        reservePriceInput.required = false;
        buyNowPriceInput.required = true;
    } else {
        reservePriceInput.required = false;
        buyNowPriceInput.required = false;
    }
    
    updateFeeBreakdown();
}

// Handle image upload
function handleImageUpload(input) {
    const files = Array.from(input.files);
    
    files.forEach(file => {
        if (uploadedImages.length >= 10) {
            showMessage('Maximum 10 images allowed', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showMessage(`File ${file.name} is too large (max 10MB)`, 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showMessage(`File ${file.name} is not an image`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = {
                file: file,
                url: e.target.result,
                name: file.name
            };
            
            uploadedImages.push(imageData);
            displayImagePreview(imageData, uploadedImages.length - 1);
        };
        reader.readAsDataURL(file);
    });
    
    // Clear input so same file can be selected again
    input.value = '';
}

// Display image preview
function displayImagePreview(imageData, index) {
    const previewContainer = document.getElementById('imagePreview');
    
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.innerHTML = `
        <img src="${imageData.url}" alt="${imageData.name}">
        <button type="button" class="remove-image" onclick="removeImage(${index})">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    previewContainer.appendChild(previewItem);
}

// Remove image
function removeImage(index) {
    uploadedImages.splice(index, 1);
    
    // Rebuild preview
    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';
    
    uploadedImages.forEach((imageData, i) => {
        displayImagePreview(imageData, i);
    });
}

// Setup drag and drop for images
function setupImageDragAndDrop() {
    const uploadArea = document.querySelector('.image-upload');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        const input = document.getElementById('imageInput');
        input.files = files;
        handleImageUpload(input);
    }
}

// Update fee breakdown
function updateFeeBreakdown() {
    const startingBid = parseFloat(document.getElementById('startingBid').value) || 0;
    const reservePrice = parseFloat(document.getElementById('reservePrice').value) || 0;
    const buyNowPrice = parseFloat(document.getElementById('buyNowPrice').value) || 0;
    
    // Use the highest potential selling price for calculation
    let estimatedSalePrice = startingBid;
    if (auctionType === 'reserve' && reservePrice > estimatedSalePrice) {
        estimatedSalePrice = reservePrice;
    }
    if (auctionType === 'buynow' && buyNowPrice > estimatedSalePrice) {
        estimatedSalePrice = buyNowPrice;
    }
    
    // Calculate fees
    const finalValueFee = estimatedSalePrice * 0.10; // 10%
    const paymentFee = estimatedSalePrice * 0.03; // 3%
    const totalFees = finalValueFee + paymentFee;
    const youReceive = estimatedSalePrice - totalFees;
    
    // Update display
    document.getElementById('finalValueFee').textContent = `$${finalValueFee.toFixed(2)}`;
    document.getElementById('paymentFee').textContent = `$${paymentFee.toFixed(2)}`;
    document.getElementById('totalFees').textContent = `$${totalFees.toFixed(2)}`;
    document.getElementById('youReceive').textContent = `$${youReceive.toFixed(2)}`;
}

// Handle form submission
function handleFormSubmission(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Listing...';
    submitBtn.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
        // Clear draft from localStorage
        localStorage.removeItem('auctionDraft');
        
        // Show success message and redirect
        showMessage('Your item has been successfully listed for auction!', 'success');
        
        setTimeout(() => {
            // Offer user options for next steps
            const redirectChoice = confirm('Your item has been listed! Would you like to view all auctions (OK) or list another item (Cancel)?');
            if (redirectChoice) {
                window.location.href = 'index.html#auctions';
            } else {
                // Reset form for another listing
                document.getElementById('sellForm').reset();
                uploadedImages = [];
                document.getElementById('imagePreview').innerHTML = '';
                auctionType = '';
                document.querySelectorAll('.auction-type-option').forEach(option => {
                    option.classList.remove('selected');
                });
                updateFeeBreakdown();
                window.scrollTo(0, 0);
            }
        }, 2000);
        
    }, 3000);
}

// Validate form
function validateForm() {
    // Check required fields
    const requiredFields = document.querySelectorAll('[required]');
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            showMessage(`Please fill in the ${field.labels[0].textContent.replace(' *', '')} field.`, 'error');
            return false;
        }
    }
    
    // Check images
    if (uploadedImages.length === 0) {
        showMessage('Please upload at least one image of your item.', 'error');
        return false;
    }
    
    // Check auction type
    if (!auctionType) {
        showMessage('Please select an auction type.', 'error');
        return false;
    }
    
    // Check payment methods
    const paymentMethods = document.querySelectorAll('input[name="paymentMethods"]:checked');
    if (paymentMethods.length === 0) {
        showMessage('Please select at least one payment method.', 'error');
        return false;
    }
    
    // Validate price relationships
    const startingBid = parseFloat(document.getElementById('startingBid').value);
    const reservePrice = parseFloat(document.getElementById('reservePrice').value);
    const buyNowPrice = parseFloat(document.getElementById('buyNowPrice').value);
    
    if (auctionType === 'reserve' && reservePrice <= startingBid) {
        showMessage('Reserve price must be higher than starting bid.', 'error');
        return false;
    }
    
    if (auctionType === 'buynow' && buyNowPrice <= startingBid) {
        showMessage('Buy It Now price must be higher than starting bid.', 'error');
        return false;
    }
    
    return true;
}

// Save draft
function saveDraft() {
    const formData = getFormData();
    localStorage.setItem('auctionDraft', JSON.stringify(formData));
    showMessage('Draft saved successfully!', 'success');
}

// Get form data
function getFormData() {
    const form = document.getElementById('sellForm');
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    data.auctionType = auctionType;
    data.uploadedImages = uploadedImages.length;
    
    return data;
}

// Load draft if exists
function loadDraftIfExists() {
    const draft = localStorage.getItem('auctionDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            populateFormWithData(data);
            showMessage('Draft loaded. Continue editing your listing.', 'success');
        } catch (e) {
            console.error('Error loading draft:', e);
        }
    }
}

// Populate form with data
function populateFormWithData(data) {
    // Populate text inputs
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (element && typeof data[key] === 'string') {
            element.value = data[key];
        }
    });
    
    // Set auction type
    if (data.auctionType) {
        selectAuctionType(data.auctionType);
    }
    
    // Trigger character count updates
    const titleInput = document.getElementById('itemTitle');
    const descriptionInput = document.getElementById('itemDescription');
    if (titleInput) updateCharacterCount(titleInput, 80);
    if (descriptionInput) updateCharacterCount(descriptionInput, 2000);
    
    // Update fee breakdown
    updateFeeBreakdown();
}

// Setup auto-save
function setupAutoSave() {
    let autoSaveTimeout;
    
    const form = document.getElementById('sellForm');
    form.addEventListener('input', function() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const formData = getFormData();
            localStorage.setItem('auctionDraft', JSON.stringify(formData));
        }, 2000); // Auto-save after 2 seconds of inactivity
    });
}

// Show message
function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        ${text}
    `;
    
    // Insert after header
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', message);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
            message.remove();
        }, 300);
    }, 5000);
}

// Estimate shipping cost based on item category
function estimateShipping() {
    const category = document.getElementById('itemCategory').value;
    const shippingInput = document.getElementById('shippingCost');
    
    const shippingEstimates = {
        'electronics': 15.00,
        'jewelry': 8.00,
        'books': 5.00,
        'fashion': 10.00,
        'home': 25.00,
        'vehicles': 0.00, // Local pickup typically
        'art': 20.00,
        'antiques': 30.00,
        'sports': 15.00,
        'other': 12.00
    };
    
    if (category && shippingEstimates[category] !== undefined) {
        shippingInput.value = shippingEstimates[category].toFixed(2);
        showMessage(`Suggested shipping cost for ${category}: $${shippingEstimates[category].toFixed(2)}`, 'success');
    }
}

// Add event listener for category change to suggest shipping
document.getElementById('itemCategory')?.addEventListener('change', function() {
    if (this.value && !document.getElementById('shippingCost').value) {
        setTimeout(estimateShipping, 500);
    }
});

// Preview listing (optional feature)
function previewListing() {
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    
    // Create preview modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Listing Preview</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3>${formData.itemTitle}</h3>
                    <p><strong>Category:</strong> ${formData.itemCategory}</p>
                    <p><strong>Condition:</strong> ${formData.itemCondition}</p>
                    <p><strong>Starting Bid:</strong> $${formData.startingBid}</p>
                    ${auctionType === 'reserve' ? `<p><strong>Reserve:</strong> $${formData.reservePrice}</p>` : ''}
                    ${auctionType === 'buynow' ? `<p><strong>Buy Now:</strong> $${formData.buyNowPrice}</p>` : ''}
                    <p><strong>Shipping:</strong> $${formData.shippingCost}</p>
                </div>
                <div>
                    <h4>Description</h4>
                    <p style="font-size: 0.9rem; line-height: 1.6;">${formData.itemDescription}</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">Close Preview</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Add preview button (optional)
document.addEventListener('DOMContentLoaded', function() {
    const submitButtons = document.querySelector('.submit-buttons');
    if (submitButtons) {
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'btn-secondary';
        previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview Listing';
        previewBtn.onclick = previewListing;
        submitButtons.insertBefore(previewBtn, submitButtons.firstChild);
    }
});