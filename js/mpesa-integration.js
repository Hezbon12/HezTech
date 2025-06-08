/**
 * MPesa Integration for HezTech E-commerce
 * This file handles MPesa mobile payment integration for the checkout process
 * Version: 1.0
 */

// MPesa Integration Module
const MPesaIntegration = (function() {
    // Configuration
    const config = {
        apiUrl: 'https://api.safaricom.co.ke', // Would be replaced with sandbox URL for testing
        businessShortCode: '174379', // Your business short code (Lipa Na MPesa Online)
        passKey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Placeholder passkey
        transactionType: 'CustomerPayBillOnline',
        callbackUrl: 'https://heztech.co.ke/api/mpesa/callback', // Your callback URL
        accountReference: 'HezTech',
        transactionDesc: 'Payment for HezTech order',
        timeout: 60000, // Timeout for API calls in milliseconds
        retryAttempts: 3, // Number of retry attempts for API calls
    };

    // Private variables
    let transactionCheckInterval = null;
    let currentTransactionId = null;
    let onPaymentSuccess = null;
    let onPaymentFailure = null;
    let onPaymentPending = null;

    /**
     * Validates a Kenyan phone number
     * @param {string} phoneNumber - The phone number to validate
     * @returns {boolean} - Whether the phone number is valid
     */
    function validateKenyanPhoneNumber(phoneNumber) {
        if (!phoneNumber) return false;
        
        // Remove any spaces, dashes, or other characters
        const cleanedNumber = phoneNumber.replace(/\s+|-|\(|\)/g, '');
        
        // Regex patterns for different Kenyan phone number formats
        const patterns = {
            // Format: 07XXXXXXXX or 01XXXXXXXX (10 digits starting with 07 or 01)
            localFormat: /^0[17][0-9]{8}$/,
            
            // Format: +2547XXXXXXXX or +2541XXXXXXXX (international format)
            internationalFormat: /^\+254[17][0-9]{8}$/,
            
            // Format: 2547XXXXXXXX or 2541XXXXXXXX (without +)
            internationalFormatNoPlus: /^254[17][0-9]{8}$/
        };
        
        return patterns.localFormat.test(cleanedNumber) || 
               patterns.internationalFormat.test(cleanedNumber) || 
               patterns.internationalFormatNoPlus.test(cleanedNumber);
    }

    /**
     * Formats a Kenyan phone number to the format required by MPesa API (2547XXXXXXXX)
     * @param {string} phoneNumber - The phone number to format
     * @returns {string|null} - The formatted phone number or null if invalid
     */
    function formatPhoneNumber(phoneNumber) {
        if (!validateKenyanPhoneNumber(phoneNumber)) {
            return null;
        }
        
        // Remove any spaces, dashes, or other characters
        let cleanedNumber = phoneNumber.replace(/\s+|-|\(|\)/g, '');
        
        // Convert to international format without the + sign
        if (cleanedNumber.startsWith('0')) {
            // Convert from 07XXXXXXXX to 2547XXXXXXXX
            return '254' + cleanedNumber.substring(1);
        } else if (cleanedNumber.startsWith('+254')) {
            // Remove the + sign
            return cleanedNumber.substring(1);
        } else if (cleanedNumber.startsWith('254')) {
            // Already in the correct format
            return cleanedNumber;
        }
        
        // If we get here, something went wrong
        return null;
    }

    /**
     * Generates a timestamp in the format required by MPesa API (YYYYMMDDHHmmss)
     * @returns {string} - The formatted timestamp
     */
    function generateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Generates a random transaction ID
     * @returns {string} - The generated transaction ID
     */
    function generateTransactionId() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `HT${timestamp}${random}`;
    }

    /**
     * Generates the password for the MPesa API
     * @returns {string} - The generated password
     */
    function generatePassword() {
        const timestamp = generateTimestamp();
        const base64String = btoa(`${config.businessShortCode}${config.passKey}${timestamp}`);
        return base64String;
    }

    /**
     * Initiates an MPesa STK push to the customer's phone
     * @param {string} phoneNumber - The customer's phone number
     * @param {number} amount - The amount to charge
     * @param {Function} successCallback - Called when the STK push is successful
     * @param {Function} failureCallback - Called when the STK push fails
     * @param {Function} pendingCallback - Called when the STK push is pending
     * @returns {Promise<object>} - Promise resolving to the STK push response
     */
    async function initiateSTKPush(phoneNumber, amount, successCallback, failureCallback, pendingCallback) {
        try {
            // Set callback functions
            onPaymentSuccess = successCallback || function() {};
            onPaymentFailure = failureCallback || function() {};
            onPaymentPending = pendingCallback || function() {};
            
            // Validate phone number
            const formattedPhone = formatPhoneNumber(phoneNumber);
            if (!formattedPhone) {
                const error = new Error('Invalid phone number format. Please use a valid Kenyan phone number.');
                onPaymentFailure(error);
                return Promise.reject(error);
            }
            
            // Validate amount
            if (!amount || amount <= 0) {
                const error = new Error('Invalid amount. Amount must be greater than 0.');
                onPaymentFailure(error);
                return Promise.reject(error);
            }
            
            // Generate timestamp and transaction ID
            const timestamp = generateTimestamp();
            currentTransactionId = generateTransactionId();
            
            // Prepare request data
            const requestData = {
                BusinessShortCode: config.businessShortCode,
                Password: generatePassword(),
                Timestamp: timestamp,
                TransactionType: config.transactionType,
                Amount: Math.round(amount), // MPesa only accepts integers
                PartyA: formattedPhone,
                PartyB: config.businessShortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: config.callbackUrl,
                AccountReference: config.accountReference,
                TransactionDesc: config.transactionDesc
            };
            
            // In a real implementation, we would make an API call here
            // For simulation purposes, we'll just log the request and simulate a response
            console.log('Initiating MPesa STK Push with data:', requestData);
            
            // Simulate API call
            return new Promise((resolve) => {
                // Notify that payment is pending
                onPaymentPending({
                    message: 'Please check your phone for the MPesa prompt and enter your PIN to complete the payment.',
                    transactionId: currentTransactionId
                });
                
                // Simulate a successful STK push (in real implementation, this would be the API response)
                setTimeout(() => {
                    const response = {
                        MerchantRequestID: 'MR' + Math.random().toString(36).substring(2, 15),
                        CheckoutRequestID: 'CR' + Math.random().toString(36).substring(2, 15),
                        ResponseCode: '0', // 0 means success in MPesa API
                        ResponseDescription: 'Success. Request accepted for processing',
                        CustomerMessage: 'Success. Request accepted for processing'
                    };
                    
                    // Start checking transaction status
                    startTransactionStatusCheck(response.CheckoutRequestID);
                    
                    resolve(response);
                }, 2000); // Simulate 2 seconds delay
            });
        } catch (error) {
            console.error('Error initiating MPesa STK push:', error);
            onPaymentFailure(error);
            return Promise.reject(error);
        }
    }

    /**
     * Starts checking the transaction status at regular intervals
     * @param {string} checkoutRequestId - The checkout request ID from the STK push
     */
    function startTransactionStatusCheck(checkoutRequestId) {
        // Clear any existing interval
        if (transactionCheckInterval) {
            clearInterval(transactionCheckInterval);
        }
        
        // Set up a new interval to check status every 5 seconds
        let attempts = 0;
        transactionCheckInterval = setInterval(() => {
            attempts++;
            
            // Check transaction status
            checkTransactionStatus(checkoutRequestId)
                .then(response => {
                    // Process the response
                    if (response.ResultCode === '0') {
                        // Transaction successful
                        clearInterval(transactionCheckInterval);
                        onPaymentSuccess({
                            transactionId: currentTransactionId,
                            mpesaReceiptNumber: response.mpesaReceiptNumber,
                            amount: response.amount,
                            phoneNumber: response.phoneNumber,
                            message: 'Payment completed successfully'
                        });
                    } else if (attempts >= 6) { // Stop after 30 seconds (6 attempts * 5 seconds)
                        // Transaction timed out
                        clearInterval(transactionCheckInterval);
                        onPaymentFailure({
                            message: 'Payment timed out. Please try again.',
                            transactionId: currentTransactionId
                        });
                    }
                })
                .catch(error => {
                    console.error('Error checking transaction status:', error);
                    if (attempts >= 6) { // Stop after 30 seconds
                        clearInterval(transactionCheckInterval);
                        onPaymentFailure({
                            message: 'Error checking payment status. Please try again.',
                            transactionId: currentTransactionId,
                            error: error.message
                        });
                    }
                });
        }, 5000); // Check every 5 seconds
    }

    /**
     * Checks the status of an MPesa transaction
     * @param {string} checkoutRequestId - The checkout request ID from the STK push
     * @returns {Promise<object>} - Promise resolving to the transaction status
     */
    async function checkTransactionStatus(checkoutRequestId) {
        try {
            // Prepare request data
            const requestData = {
                BusinessShortCode: config.businessShortCode,
                Password: generatePassword(),
                Timestamp: generateTimestamp(),
                CheckoutRequestID: checkoutRequestId
            };
            
            // In a real implementation, we would make an API call here
            // For simulation purposes, we'll just log the request and simulate a response
            console.log('Checking MPesa transaction status with data:', requestData);
            
            // Simulate API call with 80% chance of success after a few attempts
            return new Promise((resolve) => {
                // Simulate a random response
                const randomSuccess = Math.random() < 0.4; // 40% chance of immediate success
                
                if (randomSuccess) {
                    // Simulate a successful transaction
                    resolve({
                        ResultCode: '0',
                        ResultDesc: 'The service request is processed successfully.',
                        mpesaReceiptNumber: 'MJ' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                        amount: Math.floor(Math.random() * 10000) + 1000,
                        phoneNumber: '254712345678',
                        transactionDate: generateTimestamp()
                    });
                } else {
                    // Simulate a pending transaction
                    resolve({
                        ResultCode: '1032',
                        ResultDesc: 'Request cancelled by user'
                    });
                }
            });
        } catch (error) {
            console.error('Error checking MPesa transaction status:', error);
            return Promise.reject(error);
        }
    }

    /**
     * Cancels an ongoing MPesa transaction check
     */
    function cancelTransactionCheck() {
        if (transactionCheckInterval) {
            clearInterval(transactionCheckInterval);
            transactionCheckInterval = null;
        }
    }

    /**
     * Handles MPesa payment errors
     * @param {Error|string} error - The error object or message
     * @returns {object} - Formatted error object
     */
    function handlePaymentError(error) {
        let errorMessage = '';
        
        if (typeof error === 'string') {
            errorMessage = error;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        } else if (error && error.message) {
            errorMessage = error.message;
        } else {
            errorMessage = 'An unknown error occurred during payment processing';
        }
        
        console.error('MPesa payment error:', errorMessage);
        
        return {
            success: false,
            message: errorMessage,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Initializes the MPesa integration with custom configuration
     * @param {object} customConfig - Custom configuration to override defaults
     */
    function init(customConfig = {}) {
        // Merge custom configuration with defaults
        Object.assign(config, customConfig);
        
        console.log('MPesa Integration initialized with config:', config);
    }

    // Public API
    return {
        init,
        validatePhoneNumber: validateKenyanPhoneNumber,
        formatPhoneNumber,
        initiatePayment: initiateSTKPush,
        checkStatus: checkTransactionStatus,
        cancelCheck: cancelTransactionCheck,
        handleError: handlePaymentError
    };
})();

// Document ready function for jQuery
$(document).ready(function() {
    // Initialize MPesa Integration
    MPesaIntegration.init({
        // Override default config if needed
        accountReference: 'HezTech-' + new Date().getFullYear()
    });
    
    // Add event listener for MPesa phone number validation
    $('#mpesa-phone').on('blur', function() {
        const phoneNumber = $(this).val();
        const isValid = MPesaIntegration.validatePhoneNumber(phoneNumber);
        
        if (!isValid && phoneNumber) {
            $('#mpesa-phone-error').text('Please enter a valid M-Pesa phone number (e.g., 0712345678)').show();
            $(this).addClass('error');
        } else {
            $('#mpesa-phone-error').hide();
            $(this).removeClass('error');
        }
    });
    
    // This function would be called when the user proceeds to pay with MPesa
    window.processMPesaPayment = function(amount, successCallback, failureCallback) {
        const phoneNumber = $('#mpesa-phone').val();
        
        // Validate phone number
        if (!MPesaIntegration.validatePhoneNumber(phoneNumber)) {
            $('#mpesa-phone-error').text('Please enter a valid M-Pesa phone number').show();
            $('#mpesa-phone').addClass('error');
            if (failureCallback) failureCallback({
                message: 'Invalid phone number. Please enter a valid M-Pesa phone number.'
            });
            return;
        }
        
        // Show processing message
        const statusElement = $('#mpesa-payment').find('.mpesa-status-message');
        if (statusElement.length === 0) {
            $('<div class="mpesa-status-message processing">Processing your payment request...</div>')
                .insertAfter('#mpesa-phone-error');
        } else {
            statusElement.text('Processing your payment request...')
                .removeClass('success error')
                .addClass('processing')
                .show();
        }
        
        // Initiate STK push
        MPesaIntegration.initiatePayment(
            phoneNumber,
            amount,
            // Success callback
            function(response) {
                console.log('MPesa payment successful:', response);
                $('.mpesa-status-message')
                    .text('Payment successful! Transaction ID: ' + response.transactionId)
                    .removeClass('processing error')
                    .addClass('success');
                
                if (successCallback) successCallback(response);
            },
            // Failure callback
            function(error) {
                console.error('MPesa payment failed:', error);
                $('.mpesa-status-message')
                    .text('Payment failed: ' + error.message)
                    .removeClass('processing success')
                    .addClass('error');
                
                if (failureCallback) failureCallback(error);
            },
            // Pending callback
            function(status) {
                console.log('MPesa payment pending:', status);
                $('.mpesa-status-message')
                    .text(status.message)
                    .removeClass('error success')
                    .addClass('processing');
            }
        ).catch(function(error) {
            console.error('Error initiating MPesa payment:', error);
            $('.mpesa-status-message')
                .text('Error initiating payment: ' + error.message)
                .removeClass('processing success')
                .addClass('error');
            
            if (failureCallback) failureCallback(error);
        });
    };
});
