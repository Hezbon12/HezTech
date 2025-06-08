/**
 * HezTech E-commerce - Wishlist Functionality
 * Handles all wishlist operations, UI updates, and local storage persistence
 * Version: 1.0
 */

// Wishlist Module using IIFE pattern to avoid global namespace pollution
const Wishlist = (function() {
    // Private variables
    let wishlistItems = [];
    let wishlistElement = null;
    let wishlistListElement = null;
    let wishlistCountElement = null;
    
    // Configuration
    const config = {
        storageKey: 'heztech_wishlist',
        animationDuration: 800,
        maxItems: 50, // Maximum items in wishlist
        currencySymbol: 'KES',
        decimalPlaces: 2,
        autoSaveDelay: 300, // ms delay before saving to storage after changes
    };
    
    // Save timeout ID for debouncing
    let saveTimeout = null;
    
    /**
     * Initializes the wishlist
     * @param {Object} options - Configuration options
     */
    function init(options = {}) {
        // Merge options with default config
        Object.assign(config, options);
        
        // Cache DOM elements
        wishlistElement = document.querySelector('.wishlist-dropdown');
        wishlistListElement = document.querySelector('.wishlist-list');
        wishlistCountElement = document.querySelector('.header-ctn .wishlist-qty');
        
        // Load wishlist from storage
        loadWishlist();
        
        // Render initial wishlist
        renderWishlist();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Wishlist initialized');
    }
    
    /**
     * Sets up event listeners for wishlist interactions
     */
    function setupEventListeners() {
        // Delegate events to handle wishlist item interactions
        if (wishlistListElement) {
            wishlistListElement.addEventListener('click', handleWishlistItemInteractions);
        }
        
        // Listen for "Add to Wishlist" buttons throughout the site
        document.addEventListener('click', function(e) {
            if (e.target && (
                e.target.classList.contains('add-to-wishlist') || 
                e.target.closest('.add-to-wishlist')
            )) {
                const button = e.target.classList.contains('add-to-wishlist') ? 
                    e.target : e.target.closest('.add-to-wishlist');
                
                e.preventDefault();
                
                const productId = button.dataset.productId;
                const productName = button.dataset.productName || 'Product';
                const productPrice = parseFloat(button.dataset.productPrice) || 0;
                const productImg = button.dataset.productImg || 'img/product01.png';
                
                // Add item to wishlist with animation
                addToWishlist({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImg
                }, button);
            }
        });
        
        // Toggle wishlist dropdown
        const wishlistToggle = document.querySelector('.header-ctn .wishlist-dropdown-toggle');
        if (wishlistToggle) {
            wishlistToggle.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.closest('.dropdown');
                dropdown.classList.toggle('open');
                
                // Close other dropdowns
                document.querySelectorAll('.header-ctn .dropdown').forEach(el => {
                    if (el !== dropdown) el.classList.remove('open');
                });
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.header-ctn .dropdown').forEach(el => {
                    el.classList.remove('open');
                });
            }
        });
        
        // Prevent dropdown from closing when clicking inside
        if (wishlistElement) {
            wishlistElement.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // Handle heart icon clicks on product cards
        document.addEventListener('click', function(e) {
            if (e.target && (
                e.target.classList.contains('product-wishlist-btn') || 
                e.target.closest('.product-wishlist-btn')
            )) {
                const button = e.target.classList.contains('product-wishlist-btn') ? 
                    e.target : e.target.closest('.product-wishlist-btn');
                
                e.preventDefault();
                
                const productCard = button.closest('.product');
                if (!productCard) return;
                
                const productId = button.dataset.productId || productCard.dataset.productId;
                const productName = button.dataset.productName || productCard.querySelector('.product-name a').textContent;
                const productPriceElement = productCard.querySelector('.product-price');
                const productPrice = productPriceElement ? 
                    parseFloat(productPriceElement.textContent.replace(/[^0-9.]/g, '')) : 0;
                const productImgElement = productCard.querySelector('.product-img img');
                const productImg = productImgElement ? productImgElement.src : 'img/product01.png';
                
                // Toggle wishlist status
                if (isInWishlist(productId)) {
                    removeFromWishlist(productId);
                    button.classList.remove('active');
                    button.title = 'Add to Wishlist';
                } else {
                    addToWishlist({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImg
                    }, button);
                    button.classList.add('active');
                    button.title = 'Remove from Wishlist';
                }
            }
        });
    }
    
    /**
     * Handles interactions within wishlist items
     * @param {Event} e - The click event
     */
    function handleWishlistItemInteractions(e) {
        const target = e.target;
        
        // Handle item removal
        if (target.classList.contains('delete') || target.closest('.delete')) {
            const item = target.closest('.wishlist-item');
            const productId = item.dataset.productId;
            removeFromWishlist(productId);
        }
        
        // Handle add to cart
        else if (target.classList.contains('add-to-cart-btn') || target.closest('.add-to-cart-btn')) {
            e.preventDefault();
            const item = target.closest('.wishlist-item');
            const productId = item.dataset.productId;
            moveToCart(productId);
        }
    }
    
    /**
     * Loads wishlist data from local storage
     */
    function loadWishlist() {
        try {
            const storedWishlist = localStorage.getItem(config.storageKey);
            if (storedWishlist) {
                wishlistItems = JSON.parse(storedWishlist);
                
                // Validate loaded items
                wishlistItems = wishlistItems.filter(item => 
                    item && item.id && item.name && !isNaN(item.price)
                );
            }
        } catch (error) {
            console.error('Error loading wishlist from storage:', error);
            wishlistItems = [];
        }
    }
    
    /**
     * Saves wishlist data to local storage
     */
    function saveWishlist() {
        // Clear any pending save
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Debounce save operation
        saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem(config.storageKey, JSON.stringify(wishlistItems));
            } catch (error) {
                console.error('Error saving wishlist to storage:', error);
            }
        }, config.autoSaveDelay);
    }
    
    /**
     * Renders the wishlist UI
     */
    function renderWishlist() {
        if (!wishlistListElement) return;
        
        // Clear current wishlist display
        wishlistListElement.innerHTML = '';
        
        if (wishlistItems.length === 0) {
            // Show empty wishlist message
            wishlistListElement.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-heart-o"></i>
                    <p>Your wishlist is empty</p>
                    <a href="store.html" class="primary-btn">Discover Products</a>
                </div>
            `;
        } else {
            // Render each wishlist item
            wishlistItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'wishlist-item';
                itemElement.dataset.productId = item.id;
                
                itemElement.innerHTML = `
                    <div class="product-img">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="product-body">
                        <h3 class="product-name"><a href="product.html?id=${item.id}">${item.name}</a></h3>
                        <h4 class="product-price">${formatCurrency(item.price)}</h4>
                        <button class="add-to-cart-btn"><i class="fa fa-shopping-cart"></i> Add to Cart</button>
                    </div>
                    <button class="delete"><i class="fa fa-close"></i></button>
                `;
                
                wishlistListElement.appendChild(itemElement);
                
                // Add entrance animation
                setTimeout(() => {
                    itemElement.classList.add('wishlist-item-enter');
                }, 10);
            });
        }
        
        // Update wishlist count
        updateWishlistCount();
    }
    
    /**
     * Updates the wishlist count badge
     */
    function updateWishlistCount() {
        const count = wishlistItems.length;
        
        // Update count badge
        if (wishlistCountElement) {
            wishlistCountElement.textContent = count;
            
            // Toggle visibility based on count
            if (count > 0) {
                wishlistCountElement.style.display = 'block';
                
                // Add pulse animation
                wishlistCountElement.classList.add('pulse');
                setTimeout(() => {
                    wishlistCountElement.classList.remove('pulse');
                }, 1000);
            } else {
                wishlistCountElement.style.display = 'none';
            }
        }
        
        // Update all wishlist buttons on the page
        document.querySelectorAll('.product-wishlist-btn').forEach(button => {
            const productId = button.dataset.productId;
            if (productId && isInWishlist(productId)) {
                button.classList.add('active');
                button.title = 'Remove from Wishlist';
            } else {
                button.classList.remove('active');
                button.title = 'Add to Wishlist';
            }
        });
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('wishlist:updated', { 
            detail: { wishlist: getWishlistData() } 
        }));
    }
    
    /**
     * Adds an item to the wishlist
     * @param {Object} item - The item to add
     * @param {Element} sourceElement - The element that triggered the add (for animation)
     */
    function addToWishlist(item, sourceElement = null) {
        // Check if item already exists in wishlist
        if (isInWishlist(item.id)) {
            // Item already in wishlist, show notification
            showNotification('This item is already in your wishlist!', 'info');
            return;
        }
        
        // Check if wishlist is full
        if (wishlistItems.length >= config.maxItems) {
            showNotification(`Your wishlist is full (max ${config.maxItems} items)`, 'error');
            return;
        }
        
        // Add new item
        wishlistItems.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            addedAt: new Date().toISOString()
        });
        
        // Save and render wishlist
        saveWishlist();
        renderWishlist();
        
        // Show animation if source element provided
        if (sourceElement) {
            animateAddToWishlist(sourceElement);
        }
        
        // Show success notification
        showNotification('Item added to your wishlist!', 'success');
    }
    
    /**
     * Removes an item from the wishlist
     * @param {string} productId - The product ID to remove
     */
    function removeFromWishlist(productId) {
        // Find item index
        const itemIndex = wishlistItems.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return;
        
        // Get item element for animation
        const itemElement = document.querySelector(`.wishlist-item[data-product-id="${productId}"]`);
        
        if (itemElement) {
            // Animate removal
            itemElement.classList.add('wishlist-item-exit');
            
            // Wait for animation to complete
            setTimeout(() => {
                // Remove from array
                wishlistItems.splice(itemIndex, 1);
                
                // Save and render wishlist
                saveWishlist();
                renderWishlist();
                
                // Show notification
                showNotification('Item removed from your wishlist', 'info');
                
                // Update wishlist buttons
                const wishlistButton = document.querySelector(`.product-wishlist-btn[data-product-id="${productId}"]`);
                if (wishlistButton) {
                    wishlistButton.classList.remove('active');
                    wishlistButton.title = 'Add to Wishlist';
                }
            }, 300); // Match animation duration
        } else {
            // No animation, just remove
            wishlistItems.splice(itemIndex, 1);
            saveWishlist();
            renderWishlist();
            
            // Show notification
            showNotification('Item removed from your wishlist', 'info');
            
            // Update wishlist buttons
            const wishlistButton = document.querySelector(`.product-wishlist-btn[data-product-id="${productId}"]`);
            if (wishlistButton) {
                wishlistButton.classList.remove('active');
                wishlistButton.title = 'Add to Wishlist';
            }
        }
    }
    
    /**
     * Moves an item from wishlist to cart
     * @param {string} productId - The product ID to move
     */
    function moveToCart(productId) {
        // Find the item in wishlist
        const itemIndex = wishlistItems.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return;
        
        const item = wishlistItems[itemIndex];
        
        // Check if ShoppingCart module exists
        if (typeof ShoppingCart !== 'undefined' && ShoppingCart.addToCart) {
            // Add to cart
            ShoppingCart.addToCart({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: 1
            });
            
            // Remove from wishlist with animation
            removeFromWishlist(productId);
            
            // Show success message
            showNotification('Item added to your cart!', 'success');
        } else {
            console.error('ShoppingCart module not found');
            showNotification('Could not add item to cart. Try again later.', 'error');
        }
    }
    
    /**
     * Clears all items from the wishlist
     */
    function clearWishlist() {
        wishlistItems = [];
        saveWishlist();
        renderWishlist();
        
        // Show notification
        showNotification('Your wishlist has been cleared', 'info');
    }
    
    /**
     * Formats a number as currency
     * @param {number} amount - The amount to format
     * @returns {string} The formatted currency string
     */
    function formatCurrency(amount) {
        return `${config.currencySymbol}${amount.toFixed(config.decimalPlaces)}`;
    }
    
    /**
     * Shows a notification message
     * @param {string} message - The message to show
     * @param {string} type - The notification type (success, error, info)
     */
    function showNotification(message, type = 'info') {
        // Check if notification container exists, create if not
        let container = document.querySelector('.notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
            
            // Add styles if not already in stylesheet
            if (!document.getElementById('notification-styles')) {
                const styles = document.createElement('style');
                styles.id = 'notification-styles';
                styles.textContent = `
                    .notification-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 9999;
                    }
                    .notification {
                        padding: 15px 20px;
                        margin-bottom: 10px;
                        border-radius: 4px;
                        color: white;
                        font-weight: 500;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        min-width: 250px;
                        max-width: 450px;
                        opacity: 0;
                        transform: translateX(50px);
                        transition: all 0.3s ease;
                    }
                    .notification.success {
                        background-color: #28a745;
                    }
                    .notification.error {
                        background-color: #dc3545;
                    }
                    .notification.info {
                        background-color: #17a2b8;
                    }
                    .notification.show {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    .notification .close-btn {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        margin-left: 10px;
                    }
                `;
                document.head.appendChild(styles);
            }
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            ${message}
            <button class="close-btn">&times;</button>
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Add close button handler
        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    /**
     * Creates an animation for adding item to wishlist
     * @param {Element} sourceElement - The element that triggered the add
     */
    function animateAddToWishlist(sourceElement) {
        // Get source and target positions
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetElement = document.querySelector('.header-ctn .wishlist-dropdown-toggle');
        
        if (!targetElement) return;
        
        const targetRect = targetElement.getBoundingClientRect();
        
        // Create animation element
        const animElement = document.createElement('div');
        animElement.className = 'add-to-wishlist-animation';
        animElement.innerHTML = '<i class="fa fa-heart"></i>';
        
        // Add styles if not already in stylesheet
        if (!document.getElementById('wishlist-animation-styles')) {
            const styles = document.createElement('style');
            styles.id = 'wishlist-animation-styles';
            styles.textContent = `
                .add-to-wishlist-animation {
                    position: fixed;
                    z-index: 9999;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background-color: rgba(255, 159, 26, 0.8);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                    transition: all 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000);
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Position at source
        animElement.style.top = `${sourceRect.top + sourceRect.height / 2 - 15}px`;
        animElement.style.left = `${sourceRect.left + sourceRect.width / 2 - 15}px`;
        
        // Add to body
        document.body.appendChild(animElement);
        
        // Trigger animation
        setTimeout(() => {
            animElement.style.top = `${targetRect.top + targetRect.height / 2 - 15}px`;
            animElement.style.left = `${targetRect.left + targetRect.width / 2 - 15}px`;
            animElement.style.opacity = '0';
            animElement.style.transform = 'scale(0.5)';
            
            // Add bounce effect to wishlist icon
            if (targetElement) {
                targetElement.querySelector('i').style.transform = 'scale(1.2)';
                setTimeout(() => {
                    targetElement.querySelector('i').style.transform = '';
                }, 300);
            }
            
            // Remove animation element after completion
            setTimeout(() => {
                animElement.remove();
            }, config.animationDuration);
        }, 10);
    }
    
    /**
     * Gets a copy of the current wishlist data
     * @returns {Array} The wishlist items
     */
    function getWishlistData() {
        return JSON.parse(JSON.stringify(wishlistItems));
    }
    
    /**
     * Checks if a product is in the wishlist
     * @param {string} productId - The product ID to check
     * @returns {boolean} True if the product is in the wishlist
     */
    function isInWishlist(productId) {
        return wishlistItems.some(item => item.id === productId);
    }
    
    /**
     * Gets the total number of items in the wishlist
     * @returns {number} The total item count
     */
    function getItemCount() {
        return wishlistItems.length;
    }
    
    // Public API
    return {
        init,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        clearWishlist,
        getWishlistData,
        getItemCount,
        isInWishlist,
        renderWishlist
    };
})();

// Initialize wishlist when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    Wishlist.init();
    
    // Update wishlist heart icons on product cards
    document.querySelectorAll('.product-wishlist-btn').forEach(button => {
        const productId = button.dataset.productId;
        
        if (productId && Wishlist.isInWishlist(productId)) {
            button.classList.add('active');
            button.title = 'Remove from Wishlist';
        }
    });
    
    // Add wishlist buttons to product cards if they don't exist
    document.querySelectorAll('.product').forEach(productCard => {
        if (!productCard.querySelector('.product-wishlist-btn')) {
            const productId = productCard.dataset.productId;
            if (!productId) return;
            
            const wishlistBtn = document.createElement('button');
            wishlistBtn.className = 'product-wishlist-btn';
            wishlistBtn.dataset.productId = productId;
            wishlistBtn.title = Wishlist.isInWishlist(productId) ? 'Remove from Wishlist' : 'Add to Wishlist';
            wishlistBtn.innerHTML = '<i class="fa fa-heart"></i>';
            
            if (Wishlist.isInWishlist(productId)) {
                wishlistBtn.classList.add('active');
            }
            
            // Find a good place to append the button
            const productImgContainer = productCard.querySelector('.product-img');
            if (productImgContainer) {
                productImgContainer.appendChild(wishlistBtn);
            }
        }
    });
});

// Handle page visibility changes to ensure wishlist is up to date
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        Wishlist.init(); // Re-initialize to refresh from storage
    }
});
