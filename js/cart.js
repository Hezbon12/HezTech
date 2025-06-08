/**
 * HezTech E-commerce - Cart Functionality
 * Handles all cart operations, UI updates, and local storage persistence
 * Version: 1.0
 */

// Cart Module using IIFE pattern to avoid global namespace pollution
const ShoppingCart = (function() {
    // Private variables
    let cartItems = [];
    let cartElement = null;
    let cartListElement = null;
    let cartCountElement = null;
    let cartTotalElement = null;
    let cartSubtotalElement = null;
    let cartItemCountElement = null;
    
    // Configuration
    const config = {
        storageKey: 'heztech_cart',
        animationDuration: 800,
        maxQuantity: 10,
        minQuantity: 1,
        taxRate: 0.16, // 16% VAT for Kenya
        currencySymbol: 'KES',
        decimalPlaces: 2,
        autoSaveDelay: 300, // ms delay before saving to storage after changes
    };
    
    // Save timeout ID for debouncing
    let saveTimeout = null;
    
    /**
     * Initializes the shopping cart
     * @param {Object} options - Configuration options
     */
    function init(options = {}) {
        // Merge options with default config
        Object.assign(config, options);
        
        // Cache DOM elements
        cartElement = document.querySelector('.cart-dropdown');
        cartListElement = document.querySelector('.cart-list');
        cartCountElement = document.querySelector('.header-ctn .dropdown .qty');
        cartTotalElement = document.querySelector('.cart-summary h5 .subtotal-amount');
        cartSubtotalElement = document.querySelector('.cart-summary h5 .subtotal-amount');
        cartItemCountElement = document.querySelector('.cart-summary small');
        
        // Load cart from storage
        loadCart();
        
        // Render initial cart
        renderCart();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('ShoppingCart initialized');
    }
    
    /**
     * Sets up event listeners for cart interactions
     */
    function setupEventListeners() {
        // Delegate events to handle cart item interactions
        if (cartListElement) {
            cartListElement.addEventListener('click', handleCartItemInteractions);
        }
        
        // Listen for "Add to Cart" buttons throughout the site
        document.addEventListener('click', function(e) {
            if (e.target && (
                e.target.classList.contains('add-to-cart-btn') || 
                e.target.closest('.add-to-cart-btn')
            )) {
                const button = e.target.classList.contains('add-to-cart-btn') ? 
                    e.target : e.target.closest('.add-to-cart-btn');
                
                e.preventDefault();
                
                const productId = button.dataset.productId;
                const productName = button.dataset.productName || 'Product';
                const productPrice = parseFloat(button.dataset.productPrice) || 0;
                const productImg = button.dataset.productImg || 'img/product01.png';
                
                // Add item to cart with animation
                addToCart({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImg,
                    quantity: 1
                }, button);
            }
        });
        
        // Toggle cart dropdown
        const cartToggle = document.querySelector('.header-ctn .dropdown > a');
        if (cartToggle) {
            cartToggle.addEventListener('click', function(e) {
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
        if (cartElement) {
            cartElement.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
    
    /**
     * Handles interactions within cart items (quantity changes, removal, etc.)
     * @param {Event} e - The click event
     */
    function handleCartItemInteractions(e) {
        const target = e.target;
        
        // Handle quantity decrease
        if (target.classList.contains('minus') || target.closest('.minus')) {
            const item = target.closest('.cart-item');
            const productId = item.dataset.productId;
            updateItemQuantity(productId, -1);
        }
        
        // Handle quantity increase
        else if (target.classList.contains('plus') || target.closest('.plus')) {
            const item = target.closest('.cart-item');
            const productId = item.dataset.productId;
            updateItemQuantity(productId, 1);
        }
        
        // Handle direct quantity input
        else if (target.classList.contains('qty-input')) {
            target.addEventListener('change', function() {
                const item = target.closest('.cart-item');
                const productId = item.dataset.productId;
                const newQty = parseInt(this.value) || 1;
                setItemQuantity(productId, newQty);
            });
        }
        
        // Handle item removal
        else if (target.classList.contains('delete') || target.closest('.delete')) {
            const item = target.closest('.cart-item');
            const productId = item.dataset.productId;
            removeFromCart(productId);
        }
        
        // Handle move to wishlist
        else if (target.classList.contains('move-to-wishlist') || target.closest('.move-to-wishlist')) {
            e.preventDefault();
            const item = target.closest('.cart-item');
            const productId = item.dataset.productId;
            moveToWishlist(productId);
        }
    }
    
    /**
     * Loads cart data from local storage
     */
    function loadCart() {
        try {
            const storedCart = localStorage.getItem(config.storageKey);
            if (storedCart) {
                cartItems = JSON.parse(storedCart);
                
                // Validate loaded items
                cartItems = cartItems.filter(item => 
                    item && item.id && item.name && 
                    !isNaN(item.price) && !isNaN(item.quantity)
                );
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            cartItems = [];
        }
    }
    
    /**
     * Saves cart data to local storage
     */
    function saveCart() {
        // Clear any pending save
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Debounce save operation
        saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem(config.storageKey, JSON.stringify(cartItems));
            } catch (error) {
                console.error('Error saving cart to storage:', error);
            }
        }, config.autoSaveDelay);
    }
    
    /**
     * Renders the cart UI
     */
    function renderCart() {
        if (!cartListElement) return;
        
        // Clear current cart display
        cartListElement.innerHTML = '';
        
        if (cartItems.length === 0) {
            // Show empty cart message
            cartListElement.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="store.html" class="primary-btn">Start Shopping</a>
                </div>
            `;
        } else {
            // Render each cart item
            cartItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.dataset.productId = item.id;
                
                itemElement.innerHTML = `
                    <div class="product-img">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="product-body">
                        <h3 class="product-name"><a href="product.html?id=${item.id}">${item.name}</a></h3>
                        <h4 class="product-price"><span class="qty">${item.quantity}x</span>${formatCurrency(item.price)}</h4>
                        <div class="product-controls">
                            <div class="qty-control">
                                <button class="qty-btn minus">-</button>
                                <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${config.maxQuantity}">
                                <button class="qty-btn plus">+</button>
                            </div>
                            <a href="#" class="move-to-wishlist"><i class="fa fa-heart-o"></i> Save</a>
                        </div>
                    </div>
                    <button class="delete"><i class="fa fa-close"></i></button>
                `;
                
                cartListElement.appendChild(itemElement);
                
                // Add entrance animation
                setTimeout(() => {
                    itemElement.classList.add('cart-item-enter');
                }, 10);
            });
        }
        
        // Update cart summary
        updateCartSummary();
    }
    
    /**
     * Updates the cart summary (count, subtotal)
     */
    function updateCartSummary() {
        const itemCount = getTotalItems();
        const subtotal = calculateSubtotal();
        
        // Update item count badge
        if (cartCountElement) {
            cartCountElement.textContent = itemCount;
            
            // Add pulse animation if items exist
            if (itemCount > 0) {
                cartCountElement.classList.add('pulse');
                setTimeout(() => {
                    cartCountElement.classList.remove('pulse');
                }, 1000);
            }
        }
        
        // Update subtotal
        if (cartSubtotalElement) {
            cartSubtotalElement.textContent = formatCurrency(subtotal);
        }
        
        // Update item count text
        if (cartItemCountElement) {
            const itemText = itemCount === 1 ? 'Item' : 'Items';
            cartItemCountElement.textContent = `${itemCount} ${itemText} selected`;
        }
    }
    
    /**
     * Adds an item to the cart
     * @param {Object} item - The item to add
     * @param {Element} sourceElement - The element that triggered the add (for animation)
     */
    function addToCart(item, sourceElement = null) {
        // Check if item already exists in cart
        const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingItemIndex !== -1) {
            // Update quantity of existing item
            const newQty = Math.min(
                cartItems[existingItemIndex].quantity + item.quantity, 
                config.maxQuantity
            );
            
            cartItems[existingItemIndex].quantity = newQty;
        } else {
            // Add new item
            cartItems.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: Math.min(item.quantity, config.maxQuantity)
            });
        }
        
        // Save and render cart
        saveCart();
        renderCart();
        
        // Show animation if source element provided
        if (sourceElement) {
            animateAddToCart(sourceElement);
        }
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('cart:updated', { 
            detail: { cart: getCartData() } 
        }));
    }
    
    /**
     * Updates the quantity of an item in the cart
     * @param {string} productId - The product ID
     * @param {number} change - The quantity change (+1 or -1)
     */
    function updateItemQuantity(productId, change) {
        const itemIndex = cartItems.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return;
        
        const newQty = cartItems[itemIndex].quantity + change;
        
        // Ensure quantity is within limits
        if (newQty < config.minQuantity) {
            // Show confirmation before removing
            if (confirm('Remove this item from your cart?')) {
                removeFromCart(productId);
            }
            return;
        }
        
        if (newQty > config.maxQuantity) {
            alert(`Sorry, you can't add more than ${config.maxQuantity} of this item.`);
            return;
        }
        
        // Update quantity
        cartItems[itemIndex].quantity = newQty;
        
        // Update UI
        const qtyInput = document.querySelector(`.cart-item[data-product-id="${productId}"] .qty-input`);
        const qtyDisplay = document.querySelector(`.cart-item[data-product-id="${productId}"] .qty`);
        
        if (qtyInput) qtyInput.value = newQty;
        if (qtyDisplay) qtyDisplay.textContent = `${newQty}x`;
        
        // Save cart and update summary
        saveCart();
        updateCartSummary();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('cart:updated', { 
            detail: { cart: getCartData() } 
        }));
    }
    
    /**
     * Sets the quantity of an item directly
     * @param {string} productId - The product ID
     * @param {number} quantity - The new quantity
     */
    function setItemQuantity(productId, quantity) {
        const itemIndex = cartItems.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return;
        
        // Validate quantity
        const newQty = Math.max(
            config.minQuantity, 
            Math.min(quantity, config.maxQuantity)
        );
        
        // Remove if quantity is minimum
        if (newQty === config.minQuantity) {
            // Show confirmation before removing
            if (confirm('Remove this item from your cart?')) {
                removeFromCart(productId);
            } else {
                // Reset to previous quantity
                const qtyInput = document.querySelector(`.cart-item[data-product-id="${productId}"] .qty-input`);
                if (qtyInput) qtyInput.value = cartItems[itemIndex].quantity;
            }
            return;
        }
        
        // Update quantity
        cartItems[itemIndex].quantity = newQty;
        
        // Update UI
        const qtyInput = document.querySelector(`.cart-item[data-product-id="${productId}"] .qty-input`);
        const qtyDisplay = document.querySelector(`.cart-item[data-product-id="${productId}"] .qty`);
        
        if (qtyInput) qtyInput.value = newQty;
        if (qtyDisplay) qtyDisplay.textContent = `${newQty}x`;
        
        // Save cart and update summary
        saveCart();
        updateCartSummary();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('cart:updated', { 
            detail: { cart: getCartData() } 
        }));
    }
    
    /**
     * Removes an item from the cart
     * @param {string} productId - The product ID to remove
     */
    function removeFromCart(productId) {
        // Find item index
        const itemIndex = cartItems.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return;
        
        // Get item element for animation
        const itemElement = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        
        if (itemElement) {
            // Animate removal
            itemElement.classList.add('cart-item-exit');
            
            // Wait for animation to complete
            setTimeout(() => {
                // Remove from array
                cartItems.splice(itemIndex, 1);
                
                // Save and render cart
                saveCart();
                renderCart();
                
                // Trigger custom event
                document.dispatchEvent(new CustomEvent('cart:updated', { 
                    detail: { cart: getCartData() } 
                }));
            }, 300); // Match animation duration
        } else {
            // No animation, just remove
            cartItems.splice(itemIndex, 1);
            saveCart();
            renderCart();
            
            // Trigger custom event
            document.dispatchEvent(new CustomEvent('cart:updated', { 
                detail: { cart: getCartData() } 
            }));
        }
    }
    
    /**
     * Moves an item from cart to wishlist
     * @param {string} productId - The product ID to move
     */
    function moveToWishlist(productId) {
        // Find the item in cart
        const itemIndex = cartItems.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return;
        
        const item = cartItems[itemIndex];
        
        // Check if Wishlist module exists
        if (typeof Wishlist !== 'undefined' && Wishlist.addToWishlist) {
            // Add to wishlist
            Wishlist.addToWishlist({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image
            });
            
            // Remove from cart with animation
            removeFromCart(productId);
            
            // Show success message
            showNotification('Item moved to your wishlist!', 'success');
        } else {
            console.error('Wishlist module not found');
            showNotification('Could not move item to wishlist. Try again later.', 'error');
        }
    }
    
    /**
     * Clears all items from the cart
     */
    function clearCart() {
        cartItems = [];
        saveCart();
        renderCart();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('cart:updated', { 
            detail: { cart: getCartData() } 
        }));
    }
    
    /**
     * Calculates the cart subtotal
     * @returns {number} The cart subtotal
     */
    function calculateSubtotal() {
        return cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    /**
     * Calculates the cart tax amount
     * @returns {number} The tax amount
     */
    function calculateTax() {
        return calculateSubtotal() * config.taxRate;
    }
    
    /**
     * Calculates the cart total (subtotal + tax)
     * @returns {number} The cart total
     */
    function calculateTotal() {
        return calculateSubtotal() + calculateTax();
    }
    
    /**
     * Gets the total number of items in the cart
     * @returns {number} The total item count
     */
    function getTotalItems() {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    }
    
    /**
     * Gets the number of unique products in the cart
     * @returns {number} The unique product count
     */
    function getUniqueItemCount() {
        return cartItems.length;
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
     * Creates an animation for adding item to cart
     * @param {Element} sourceElement - The element that triggered the add
     */
    function animateAddToCart(sourceElement) {
        // Get source and target positions
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetElement = document.querySelector('.header-ctn .dropdown > a');
        
        if (!targetElement) return;
        
        const targetRect = targetElement.getBoundingClientRect();
        
        // Create animation element
        const animElement = document.createElement('div');
        animElement.className = 'add-to-cart-animation';
        
        // Position at source
        animElement.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
        animElement.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
        
        // Add to body
        document.body.appendChild(animElement);
        
        // Trigger animation
        setTimeout(() => {
            animElement.style.top = `${targetRect.top + targetRect.height / 2}px`;
            animElement.style.left = `${targetRect.left + targetRect.width / 2}px`;
            animElement.style.opacity = '0';
            animElement.style.transform = 'scale(0.5)';
            
            // Add bounce effect to cart icon
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
     * Gets a copy of the current cart data
     * @returns {Array} The cart items
     */
    function getCartData() {
        return JSON.parse(JSON.stringify(cartItems));
    }
    
    /**
     * Checks if a product is in the cart
     * @param {string} productId - The product ID to check
     * @returns {boolean} True if the product is in the cart
     */
    function isInCart(productId) {
        return cartItems.some(item => item.id === productId);
    }
    
    /**
     * Gets the quantity of a specific product in the cart
     * @param {string} productId - The product ID to check
     * @returns {number} The quantity in cart, 0 if not in cart
     */
    function getItemQuantity(productId) {
        const item = cartItems.find(item => item.id === productId);
        return item ? item.quantity : 0;
    }
    
    // Public API
    return {
        init,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        setItemQuantity,
        moveToWishlist,
        clearCart,
        getCartData,
        getTotalItems,
        getUniqueItemCount,
        calculateSubtotal,
        calculateTotal,
        calculateTax,
        isInCart,
        getItemQuantity,
        renderCart
    };
})();

// Initialize cart when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    ShoppingCart.init();
    
    // Update "Add to Cart" buttons to show current state
    document.querySelectorAll('[data-product-id]').forEach(element => {
        const productId = element.dataset.productId;
        
        if (productId && ShoppingCart.isInCart(productId)) {
            const qty = ShoppingCart.getItemQuantity(productId);
            
            // Update button text if it's an "Add to Cart" button
            const addButton = element.querySelector('.add-to-cart-btn');
            if (addButton) {
                addButton.innerHTML = `<i class="fa fa-check"></i> In Cart (${qty})`;
                addButton.classList.add('in-cart');
            }
        }
    });
});

// Handle page visibility changes to ensure cart is up to date
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        ShoppingCart.init(); // Re-initialize to refresh from storage
    }
});
