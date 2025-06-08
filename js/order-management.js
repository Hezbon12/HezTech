/**
 * Order Management System for HezTech E-commerce
 * Handles integration with third-party order management services
 * Version: 1.0
 */

// OrderManagement Module
const OrderManagement = (function() {
    // Configuration
    const config = {
        // API endpoints (would be replaced with actual endpoints)
        apiBaseUrl: 'https://api.heztech.co.ke/v1',
        orderSubmitEndpoint: '/orders',
        orderStatusEndpoint: '/orders/status',
        orderTrackingEndpoint: '/orders/tracking',
        notificationEndpoint: '/notifications/email',
        
        // Service providers
        orderServiceProvider: 'ShopifyAPI', // Options: 'ShopifyAPI', 'WooCommerceAPI', 'CustomAPI'
        emailServiceProvider: 'SendGrid', // Options: 'SendGrid', 'Mailgun', 'AmazonSES'
        
        // Authentication
        apiKey: 'YOUR_API_KEY', // Replace with actual API key
        apiSecret: 'YOUR_API_SECRET', // Replace with actual API secret
        
        // Timeouts and retries
        requestTimeout: 30000, // 30 seconds timeout for API requests
        maxRetries: 3, // Maximum number of retry attempts for failed requests
        retryDelay: 2000, // Delay between retries in milliseconds
        
        // Order statuses
        orderStatuses: {
            PENDING: 'pending',
            PROCESSING: 'processing',
            SHIPPED: 'shipped',
            DELIVERED: 'delivered',
            CANCELLED: 'cancelled',
            REFUNDED: 'refunded',
            FAILED: 'failed'
        },
        
        // Email templates
        emailTemplates: {
            orderConfirmation: 'order-confirmation',
            orderShipped: 'order-shipped',
            orderDelivered: 'order-delivered',
            orderCancelled: 'order-cancelled',
            paymentFailed: 'payment-failed'
        },
        
        // Debug mode
        debug: true
    };
    
    // Private variables
    let currentOrder = null;
    let orderCallbacks = {
        onSuccess: null,
        onFailure: null,
        onStatusUpdate: null
    };
    
    /**
     * Logs messages based on debug mode
     * @param {string} message - The message to log
     * @param {string} level - The log level (log, info, warn, error)
     * @param {*} data - Additional data to log
     */
    function log(message, level = 'log', data = null) {
        if (!config.debug && level !== 'error') return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[HezTech OrderManagement ${timestamp}]`;
        
        switch (level) {
            case 'info':
                console.info(`${prefix} ${message}`, data || '');
                break;
            case 'warn':
                console.warn(`${prefix} ${message}`, data || '');
                break;
            case 'error':
                console.error(`${prefix} ${message}`, data || '');
                break;
            default:
                console.log(`${prefix} ${message}`, data || '');
        }
        
        // In a production environment, you might want to send critical errors
        // to a logging service like Sentry
        if (level === 'error' && window.Sentry) {
            window.Sentry.captureMessage(`${message} ${JSON.stringify(data || {})}`);
        }
    }
    
    /**
     * Makes an API request to the order management service
     * @param {string} endpoint - The API endpoint
     * @param {string} method - The HTTP method
     * @param {object} data - The request data
     * @returns {Promise<object>} - Promise resolving to the API response
     */
    async function makeApiRequest(endpoint, method = 'GET', data = null) {
        const url = `${config.apiBaseUrl}${endpoint}`;
        let retries = 0;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            'X-Api-Version': '1.0',
            'X-Client-Platform': 'web'
        };
        
        const requestOptions = {
            method,
            headers,
            timeout: config.requestTimeout
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            requestOptions.body = JSON.stringify(data);
        }
        
        log(`Making ${method} request to ${url}`, 'info', data);
        
        // Function to handle the actual fetch with retries
        async function attemptFetch() {
            try {
                // In a real implementation, this would be a fetch call
                // For simulation purposes, we'll create a mock response
                
                // Simulate API call
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        // Simulate random failures for testing retry mechanism
                        if (Math.random() < 0.1 && retries < config.maxRetries) {
                            reject(new Error('Simulated network error'));
                            return;
                        }
                        
                        // Simulate successful response
                        const mockResponse = {
                            success: true,
                            timestamp: new Date().toISOString(),
                            data: {
                                // Mock data based on endpoint and method
                                ...(endpoint.includes('orders') && method === 'POST' && {
                                    orderId: `ORD-${Date.now()}`,
                                    status: config.orderStatuses.PENDING,
                                    createdAt: new Date().toISOString()
                                }),
                                ...(endpoint.includes('status') && {
                                    status: config.orderStatuses.PROCESSING,
                                    updatedAt: new Date().toISOString(),
                                    statusHistory: [
                                        {
                                            status: config.orderStatuses.PENDING,
                                            timestamp: new Date(Date.now() - 3600000).toISOString()
                                        },
                                        {
                                            status: config.orderStatuses.PROCESSING,
                                            timestamp: new Date().toISOString()
                                        }
                                    ]
                                }),
                                ...(endpoint.includes('tracking') && {
                                    trackingId: `TRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                                    carrier: 'Sendy',
                                    estimatedDelivery: new Date(Date.now() + 172800000).toISOString(),
                                    trackingUrl: 'https://track.sendy.co.ke/tracking/123456789'
                                }),
                                ...(endpoint.includes('notifications') && {
                                    messageId: `MSG-${Math.random().toString(36).substring(2, 10)}`,
                                    sentAt: new Date().toISOString(),
                                    recipient: data.recipient,
                                    template: data.template
                                })
                            }
                        };
                        
                        resolve(mockResponse);
                    }, 1000); // Simulate 1 second API delay
                });
            } catch (error) {
                if (retries < config.maxRetries) {
                    retries++;
                    log(`Request failed, retrying (${retries}/${config.maxRetries})...`, 'warn', error);
                    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
                    return attemptFetch();
                } else {
                    throw error;
                }
            }
        }
        
        return attemptFetch();
    }
    
    /**
     * Submits an order to the third-party order management service
     * @param {object} orderData - The order data
     * @param {Function} onSuccess - Success callback
     * @param {Function} onFailure - Failure callback
     * @returns {Promise<object>} - Promise resolving to the order submission result
     */
    async function submitOrder(orderData, onSuccess, onFailure) {
        try {
            // Store callbacks for later use
            orderCallbacks.onSuccess = onSuccess || function() {};
            orderCallbacks.onFailure = onFailure || function() {};
            
            // Validate order data
            if (!validateOrderData(orderData)) {
                const error = new Error('Invalid order data');
                log('Order validation failed', 'error', orderData);
                orderCallbacks.onFailure(error);
                return Promise.reject(error);
            }
            
            // Prepare order data for submission
            const preparedOrderData = prepareOrderData(orderData);
            currentOrder = preparedOrderData;
            
            log('Submitting order', 'info', preparedOrderData);
            
            // Submit order to the API
            const response = await makeApiRequest(
                config.orderSubmitEndpoint,
                'POST',
                preparedOrderData
            );
            
            if (!response || !response.success) {
                throw new Error('Order submission failed');
            }
            
            // Update current order with response data
            currentOrder = {
                ...currentOrder,
                orderId: response.data.orderId,
                status: response.data.status,
                createdAt: response.data.createdAt
            };
            
            log('Order submitted successfully', 'info', currentOrder);
            
            // Send order confirmation email
            await sendOrderEmail(
                currentOrder.customer.email,
                config.emailTemplates.orderConfirmation,
                {
                    orderId: currentOrder.orderId,
                    customerName: `${currentOrder.customer.firstName} ${currentOrder.customer.lastName}`,
                    orderItems: currentOrder.items,
                    shippingAddress: currentOrder.shippingAddress,
                    paymentMethod: currentOrder.payment.method,
                    orderTotal: currentOrder.total,
                    currency: 'KES'
                }
            );
            
            // Call success callback
            orderCallbacks.onSuccess(currentOrder);
            
            return {
                success: true,
                orderId: currentOrder.orderId,
                status: currentOrder.status,
                message: 'Order submitted successfully'
            };
        } catch (error) {
            log('Order submission error', 'error', error);
            
            // Call failure callback
            if (orderCallbacks.onFailure) {
                orderCallbacks.onFailure(error);
            }
            
            return {
                success: false,
                message: error.message || 'An error occurred while submitting the order',
                error: error
            };
        }
    }
    
    /**
     * Validates order data before submission
     * @param {object} orderData - The order data to validate
     * @returns {boolean} - Whether the order data is valid
     */
    function validateOrderData(orderData) {
        if (!orderData) return false;
        
        const requiredFields = [
            'customer',
            'items',
            'shippingAddress',
            'billingAddress',
            'payment',
            'subtotal',
            'shippingCost',
            'total'
        ];
        
        // Check if all required fields are present
        const missingFields = requiredFields.filter(field => !orderData[field]);
        if (missingFields.length > 0) {
            log('Missing required fields in order data', 'error', missingFields);
            return false;
        }
        
        // Validate customer data
        if (!orderData.customer.email || !orderData.customer.firstName || !orderData.customer.lastName) {
            log('Invalid customer data', 'error', orderData.customer);
            return false;
        }
        
        // Validate items
        if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
            log('Invalid or empty items array', 'error', orderData.items);
            return false;
        }
        
        // Validate payment data
        if (!orderData.payment.method || !orderData.payment.transactionId) {
            log('Invalid payment data', 'error', orderData.payment);
            return false;
        }
        
        // Validate addresses
        const addressFields = ['address1', 'city', 'zip', 'countryCode'];
        const isValidAddress = address => addressFields.every(field => address[field]);
        
        if (!isValidAddress(orderData.shippingAddress) || !isValidAddress(orderData.billingAddress)) {
            log('Invalid address data', 'error', {
                shipping: orderData.shippingAddress,
                billing: orderData.billingAddress
            });
            return false;
        }
        
        return true;
    }
    
    /**
     * Prepares order data for submission to the API
     * @param {object} orderData - The raw order data
     * @returns {object} - The prepared order data
     */
    function prepareOrderData(orderData) {
        // Create a copy to avoid modifying the original
        const prepared = JSON.parse(JSON.stringify(orderData));
        
        // Add metadata
        prepared.metadata = {
            source: 'web',
            userAgent: navigator.userAgent,
            ipAddress: '127.0.0.1', // This would be captured server-side
            timestamp: new Date().toISOString()
        };
        
        // Format payment data based on payment method
        if (prepared.payment.method === 'stripe') {
            prepared.payment.provider = 'Stripe';
            prepared.payment.paymentMethodType = 'card';
        } else if (prepared.payment.method === 'mpesa') {
            prepared.payment.provider = 'M-Pesa';
            prepared.payment.paymentMethodType = 'mobile_money';
        }
        
        // Add order reference
        prepared.reference = `HT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Format items data
        prepared.items = prepared.items.map(item => ({
            ...item,
            totalPrice: (item.price * item.quantity).toFixed(2)
        }));
        
        // Format monetary values
        prepared.subtotal = parseFloat(prepared.subtotal).toFixed(2);
        prepared.shippingCost = parseFloat(prepared.shippingCost).toFixed(2);
        prepared.total = parseFloat(prepared.total).toFixed(2);
        
        return prepared;
    }
    
    /**
     * Gets the status of an order
     * @param {string} orderId - The order ID
     * @returns {Promise<object>} - Promise resolving to the order status
     */
    async function getOrderStatus(orderId) {
        try {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            
            log(`Getting status for order ${orderId}`, 'info');
            
            const response = await makeApiRequest(
                `${config.orderStatusEndpoint}/${orderId}`,
                'GET'
            );
            
            if (!response || !response.success) {
                throw new Error('Failed to get order status');
            }
            
            // Update current order status if it's the current order
            if (currentOrder && currentOrder.orderId === orderId) {
                currentOrder.status = response.data.status;
                currentOrder.statusHistory = response.data.statusHistory;
                currentOrder.updatedAt = response.data.updatedAt;
                
                // Call status update callback if available
                if (orderCallbacks.onStatusUpdate) {
                    orderCallbacks.onStatusUpdate(currentOrder);
                }
            }
            
            return {
                success: true,
                orderId,
                status: response.data.status,
                updatedAt: response.data.updatedAt,
                statusHistory: response.data.statusHistory
            };
        } catch (error) {
            log(`Error getting status for order ${orderId}`, 'error', error);
            
            return {
                success: false,
                orderId,
                message: error.message || 'An error occurred while getting order status',
                error
            };
        }
    }
    
    /**
     * Gets tracking information for an order
     * @param {string} orderId - The order ID
     * @returns {Promise<object>} - Promise resolving to the tracking information
     */
    async function getOrderTracking(orderId) {
        try {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            
            log(`Getting tracking info for order ${orderId}`, 'info');
            
            const response = await makeApiRequest(
                `${config.orderTrackingEndpoint}/${orderId}`,
                'GET'
            );
            
            if (!response || !response.success) {
                throw new Error('Failed to get order tracking information');
            }
            
            // Update current order tracking if it's the current order
            if (currentOrder && currentOrder.orderId === orderId) {
                currentOrder.tracking = {
                    trackingId: response.data.trackingId,
                    carrier: response.data.carrier,
                    estimatedDelivery: response.data.estimatedDelivery,
                    trackingUrl: response.data.trackingUrl
                };
            }
            
            return {
                success: true,
                orderId,
                tracking: {
                    trackingId: response.data.trackingId,
                    carrier: response.data.carrier,
                    estimatedDelivery: response.data.estimatedDelivery,
                    trackingUrl: response.data.trackingUrl
                }
            };
        } catch (error) {
            log(`Error getting tracking for order ${orderId}`, 'error', error);
            
            return {
                success: false,
                orderId,
                message: error.message || 'An error occurred while getting tracking information',
                error
            };
        }
    }
    
    /**
     * Sends an email notification related to an order
     * @param {string} recipient - The email recipient
     * @param {string} template - The email template to use
     * @param {object} data - The data to populate the template
     * @returns {Promise<object>} - Promise resolving to the email sending result
     */
    async function sendOrderEmail(recipient, template, data) {
        try {
            if (!recipient || !template || !data) {
                throw new Error('Recipient, template, and data are required');
            }
            
            log(`Sending ${template} email to ${recipient}`, 'info');
            
            const emailData = {
                recipient,
                template,
                data,
                sender: 'orders@heztech.co.ke',
                senderName: 'HezTech Orders',
                subject: getEmailSubject(template, data)
            };
            
            const response = await makeApiRequest(
                config.notificationEndpoint,
                'POST',
                emailData
            );
            
            if (!response || !response.success) {
                throw new Error('Failed to send email notification');
            }
            
            log(`Email sent successfully to ${recipient}`, 'info', {
                messageId: response.data.messageId,
                template
            });
            
            return {
                success: true,
                messageId: response.data.messageId,
                recipient,
                template,
                sentAt: response.data.sentAt
            };
        } catch (error) {
            log(`Error sending email to ${recipient}`, 'error', error);
            
            return {
                success: false,
                recipient,
                template,
                message: error.message || 'An error occurred while sending email',
                error
            };
        }
    }
    
    /**
     * Gets the appropriate email subject based on template and data
     * @param {string} template - The email template
     * @param {object} data - The template data
     * @returns {string} - The email subject
     */
    function getEmailSubject(template, data) {
        const orderId = data.orderId || '';
        
        switch (template) {
            case config.emailTemplates.orderConfirmation:
                return `HezTech Order Confirmation #${orderId}`;
            case config.emailTemplates.orderShipped:
                return `Your HezTech Order #${orderId} Has Been Shipped`;
            case config.emailTemplates.orderDelivered:
                return `Your HezTech Order #${orderId} Has Been Delivered`;
            case config.emailTemplates.orderCancelled:
                return `Your HezTech Order #${orderId} Has Been Cancelled`;
            case config.emailTemplates.paymentFailed:
                return `Payment Failed for HezTech Order #${orderId}`;
            default:
                return `HezTech Order Update #${orderId}`;
        }
    }
    
    /**
     * Updates an existing order
     * @param {string} orderId - The order ID
     * @param {object} updateData - The data to update
     * @returns {Promise<object>} - Promise resolving to the update result
     */
    async function updateOrder(orderId, updateData) {
        try {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            
            log(`Updating order ${orderId}`, 'info', updateData);
            
            const response = await makeApiRequest(
                `${config.orderSubmitEndpoint}/${orderId}`,
                'PATCH',
                updateData
            );
            
            if (!response || !response.success) {
                throw new Error('Failed to update order');
            }
            
            // Update current order if it's the current order
            if (currentOrder && currentOrder.orderId === orderId) {
                currentOrder = {
                    ...currentOrder,
                    ...updateData,
                    updatedAt: response.data.updatedAt
                };
                
                // Call status update callback if status was updated
                if (updateData.status && orderCallbacks.onStatusUpdate) {
                    orderCallbacks.onStatusUpdate(currentOrder);
                }
            }
            
            return {
                success: true,
                orderId,
                updatedAt: response.data.updatedAt,
                message: 'Order updated successfully'
            };
        } catch (error) {
            log(`Error updating order ${orderId}`, 'error', error);
            
            return {
                success: false,
                orderId,
                message: error.message || 'An error occurred while updating the order',
                error
            };
        }
    }
    
    /**
     * Cancels an order
     * @param {string} orderId - The order ID
     * @param {string} reason - The cancellation reason
     * @returns {Promise<object>} - Promise resolving to the cancellation result
     */
    async function cancelOrder(orderId, reason) {
        try {
            if (!orderId) {
                throw new Error('Order ID is required');
            }
            
            log(`Cancelling order ${orderId}`, 'info', { reason });
            
            const response = await makeApiRequest(
                `${config.orderSubmitEndpoint}/${orderId}/cancel`,
                'POST',
                { reason }
            );
            
            if (!response || !response.success) {
                throw new Error('Failed to cancel order');
            }
            
            // Update current order if it's the current order
            if (currentOrder && currentOrder.orderId === orderId) {
                currentOrder.status = config.orderStatuses.CANCELLED;
                currentOrder.cancellationReason = reason;
                currentOrder.updatedAt = response.data.updatedAt;
                
                // Call status update callback
                if (orderCallbacks.onStatusUpdate) {
                    orderCallbacks.onStatusUpdate(currentOrder);
                }
            }
            
            // Send cancellation email
            if (currentOrder && currentOrder.customer && currentOrder.customer.email) {
                await sendOrderEmail(
                    currentOrder.customer.email,
                    config.emailTemplates.orderCancelled,
                    {
                        orderId,
                        customerName: `${currentOrder.customer.firstName} ${currentOrder.customer.lastName}`,
                        cancellationReason: reason
                    }
                );
            }
            
            return {
                success: true,
                orderId,
                status: config.orderStatuses.CANCELLED,
                updatedAt: response.data.updatedAt,
                message: 'Order cancelled successfully'
            };
        } catch (error) {
            log(`Error cancelling order ${orderId}`, 'error', error);
            
            return {
                success: false,
                orderId,
                message: error.message || 'An error occurred while cancelling the order',
                error
            };
        }
    }
    
    /**
     * Registers a callback for order status updates
     * @param {Function} callback - The callback function
     */
    function onOrderStatusUpdate(callback) {
        if (typeof callback === 'function') {
            orderCallbacks.onStatusUpdate = callback;
        }
    }
    
    /**
     * Gets the current order
     * @returns {object|null} - The current order or null if none
     */
    function getCurrentOrder() {
        return currentOrder;
    }
    
    /**
     * Initializes the order management system with custom configuration
     * @param {object} customConfig - Custom configuration
     */
    function init(customConfig = {}) {
        // Merge custom configuration with defaults
        Object.assign(config, customConfig);
        
        log('Order Management System initialized', 'info', {
            provider: config.orderServiceProvider,
            emailProvider: config.emailServiceProvider
        });
    }
    
    // Public API
    return {
        init,
        submitOrder,
        getOrderStatus,
        getOrderTracking,
        updateOrder,
        cancelOrder,
        sendOrderEmail,
        getCurrentOrder,
        onOrderStatusUpdate,
        
        // Constants
        STATUS: config.orderStatuses,
        EMAIL_TEMPLATES: config.emailTemplates
    };
})();

// Document ready function for jQuery
$(document).ready(function() {
    // Initialize Order Management System
    OrderManagement.init({
        // Override default config if needed
        debug: true,
        // In production, you would set this to false and use a proper logging service
        apiBaseUrl: 'https://api.heztech.co.ke/v1'
    });
    
    // Listen for order status updates
    OrderManagement.onOrderStatusUpdate(function(order) {
        console.log(`Order ${order.orderId} status updated to: ${order.status}`);
        
        // Update UI based on status
        updateOrderStatusUI(order.status);
    });
    
    // Function to handle order placement
    window.placeOrder = async function(orderData) {
        // Show loading state
        $('#place-order').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Processing...');
        
        try {
            // Submit order
            const result = await OrderManagement.submitOrder(
                orderData,
                // Success callback
                function(order) {
                    console.log('Order placed successfully:', order);
                    
                    // Show confirmation
                    $('.checkout-section').removeClass('active');
                    $('#section-confirmation').addClass('active');
                    
                    // Set order ID in confirmation
                    $('#confirmation-order-id').text(order.orderId);
                    
                    // Update progress
                    $('.progress-bar').css('width', '100%');
                    $('#checkout-progress-text').text('Order Completed');
                },
                // Failure callback
                function(error) {
                    console.error('Order placement failed:', error);
                    
                    // Show error message
                    alert(`Order placement failed: ${error.message}. Please try again.`);
                    
                    // Reset button
                    $('#place-order').prop('disabled', false).html('Place Order');
                }
            );
            
            return result;
        } catch (error) {
            console.error('Error placing order:', error);
            
            // Show error message
            alert(`An error occurred: ${error.message}. Please try again.`);
            
            // Reset button
            $('#place-order').prop('disabled', false).html('Place Order');
            
            return {
                success: false,
                message: error.message
            };
        }
    };
    
    // Function to track an order
    window.trackOrder = async function(orderId) {
        try {
            // Get order status
            const statusResult = await OrderManagement.getOrderStatus(orderId);
            
            if (!statusResult.success) {
                throw new Error(statusResult.message);
            }
            
            // Get tracking information
            const trackingResult = await OrderManagement.getOrderTracking(orderId);
            
            // Update UI with tracking information
            if (trackingResult.success) {
                updateTrackingUI(trackingResult.tracking);
            }
            
            return {
                success: true,
                status: statusResult.status,
                tracking: trackingResult.success ? trackingResult.tracking : null
            };
        } catch (error) {
            console.error('Error tracking order:', error);
            
            return {
                success: false,
                message: error.message
            };
        }
    };
    
    // Function to update order status UI
    function updateOrderStatusUI(status) {
        // This function would update UI elements based on order status
        // For example, showing different messages or changing progress indicators
        
        let statusText = '';
        let statusClass = '';
        
        switch (status) {
            case OrderManagement.STATUS.PENDING:
                statusText = 'Order Pending';
                statusClass = 'status-pending';
                break;
            case OrderManagement.STATUS.PROCESSING:
                statusText = 'Order Processing';
                statusClass = 'status-processing';
                break;
            case OrderManagement.STATUS.SHIPPED:
                statusText = 'Order Shipped';
                statusClass = 'status-shipped';
                break;
            case OrderManagement.STATUS.DELIVERED:
                statusText = 'Order Delivered';
                statusClass = 'status-delivered';
                break;
            case OrderManagement.STATUS.CANCELLED:
                statusText = 'Order Cancelled';
                statusClass = 'status-cancelled';
                break;
            default:
                statusText = 'Order Status: ' + status;
                statusClass = 'status-default';
        }
        
        // Update status text if element exists
        const statusElement = $('#order-status');
        if (statusElement.length) {
            statusElement.text(statusText).removeClass().addClass(statusClass);
        }
    }
    
    // Function to update tracking UI
    function updateTrackingUI(tracking) {
        // This function would update UI elements with tracking information
        
        if (!tracking) return;
        
        // Update tracking information if elements exist
        const trackingIdElement = $('#tracking-id');
        if (trackingIdElement.length) {
            trackingIdElement.text(tracking.trackingId);
        }
        
        const carrierElement = $('#tracking-carrier');
        if (carrierElement.length) {
            carrierElement.text(tracking.carrier);
        }
        
        const deliveryDateElement = $('#estimated-delivery');
        if (deliveryDateElement.length) {
            const deliveryDate = new Date(tracking.estimatedDelivery);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            deliveryDateElement.text(deliveryDate.toLocaleDateString('en-KE', options));
        }
        
        const trackingUrlElement = $('#tracking-url');
        if (trackingUrlElement.length) {
            trackingUrlElement.attr('href', tracking.trackingUrl);
        }
    }
    
    // Handle "Track Order" button click
    $(document).on('click', '.track-order-btn', function(e) {
        e.preventDefault();
        
        const orderId = $(this).data('order-id');
        if (!orderId) {
            alert('Order ID is required for tracking');
            return;
        }
        
        // Show loading state
        $(this).html('<i class="fa fa-spinner fa-spin"></i> Tracking...');
        
        // Track order
        trackOrder(orderId)
            .then(result => {
                if (result.success) {
                    // Show tracking information in a modal or redirect to tracking page
                    if (window.trackingModal) {
                        window.trackingModal.show(result);
                    } else {
                        alert(`Order Status: ${result.status}\nTracking ID: ${result.tracking ? result.tracking.trackingId : 'Not available yet'}`);
                    }
                } else {
                    alert(`Tracking failed: ${result.message}`);
                }
            })
            .catch(error => {
                alert(`Error tracking order: ${error.message}`);
            })
            .finally(() => {
                // Reset button
                $(this).html('Track Order');
            });
    });
});
