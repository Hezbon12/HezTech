$(document).ready(function() {
    // --- Configuration ---
    const STRIPE_PUBLIC_KEY = 'pk_test_YOUR_STRIPE_PUBLIC_KEY'; // Replace with your actual Stripe public key
    const MOCK_API_DELAY = 1500; // ms for simulating API calls

    // --- State ---
    let currentStep = 1;
    let selectedPaymentMethod = null;
    let selectedShippingOption = {
        price: 0,
        method: 'standard',
        description: 'Standard Shipping (3-5 business days)'
    };
    let orderSubtotal = 21960.00; // Assuming this is fixed for now or fetched from cart

    // --- Stripe Initialization ---
    let stripe, elements, cardElement;
    try {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#32325d',
                    fontFamily: 'Montserrat, sans-serif',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            }
        });
        if (document.getElementById('card-element')) {
            cardElement.mount('#card-element');
        } else {
            console.warn('Stripe card element not found on this page.');
        }

        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
                displayError.style.display = 'block';
            } else {
                displayError.textContent = '';
                displayError.style.display = 'none';
            }
        });
    } catch (error) {
        console.error("Error initializing Stripe:", error);
        // Display a user-friendly message if Stripe fails to load
        $('#stripe-payment').html('<p class="text-danger">There was an issue loading the payment form. Please try refreshing the page.</p>');
    }


    // --- Event Listeners ---

    // Step Navigation
    $('#to-step-2').click(function(e) {
        e.preventDefault();
        if (validateShippingForm()) {
            updateOrderSummaryFromForm();
            goToStep(2);
        }
    });

    $('#back-to-step-1').click(function(e) {
        e.preventDefault();
        goToStep(1);
    });

    $('#to-step-3').click(function(e) {
        e.preventDefault();
        if (validatePaymentForm()) {
            updateOrderSummaryFromForm(); // Ensure summary is up-to-date
            populateReviewData();
            goToStep(3);
        }
    });

    $('#back-to-step-2').click(function(e) {
        e.preventDefault();
        goToStep(2);
    });

    $('#place-order').click(function(e) {
        e.preventDefault();
        handlePlaceOrder();
    });

    // Payment Method Selection
    $('.payment-method-card').click(function() {
        $('.payment-method-card').removeClass('selected');
        $(this).addClass('selected');
        selectedPaymentMethod = $(this).data('method');

        $('.payment-details').removeClass('active').hide();
        $(`#${selectedPaymentMethod}-payment`).addClass('active').fadeIn();
        updateOrderSummaryDisplay();
    });

    // Shipping Method Selection
    $('.shipping-option').click(function() {
        $('.shipping-option').removeClass('selected');
        $(this).addClass('selected');
        $(this).find('input[type="radio"]').prop('checked', true);

        selectedShippingOption.price = parseFloat($(this).data('price'));
        selectedShippingOption.method = $(this).data('method');
        selectedShippingOption.description = $(this).find('label').text().trim();

        updateOrderSummaryDisplay();
    });

    // Form input validation on blur
    $('#billing-details input, #shiping-details .caption input').on('blur', function() {
        validateField($(this));
    });
    $('#email').on('blur', function() { validateEmailField($(this)); });
    $('#phone').on('blur', function() { validatePhoneField($(this), 'phone-error'); });
    $('#mpesa-phone').on('blur', function() { validatePhoneField($(this), 'mpesa-phone-error', true); });
    $('#password, #confirm-password').on('blur', function() {
        if ($('#create-account').is(':checked')) {
            validatePasswordFields();
        }
    });


    // Checkbox toggles for account creation and shipping address
    $('#create-account').change(function() {
        const caption = $(this).closest('.input-checkbox').find('.caption');
        if ($(this).is(':checked')) {
            caption.slideDown();
        } else {
            caption.slideUp();
            // Clear password fields if "create account" is unchecked
            $('#password, #confirm-password').val('');
            clearError($('#password'));
            clearError($('#confirm-password'));
        }
    });

    $('#shiping-address').change(function() {
        const caption = $(this).closest('.input-checkbox').find('.caption');
        if ($(this).is(':checked')) {
            caption.slideDown();
        } else {
            caption.slideUp();
            // Clear shipping fields if "ship to different address" is unchecked
            $('#shiping-details .caption input').val('');
            $('#shiping-details .caption .error-message').hide();
            $('#shiping-details .caption .input').removeClass('error');
        }
    });

    // Initialize with hidden captions
    $('.input-checkbox .caption').hide();


    // --- Step Navigation Function ---
    function goToStep(step) {
        currentStep = step;
        $('.step').removeClass('active completed');
        for (let i = 1; i < step; i++) {
            $(`#step-${i}`).addClass('completed');
        }
        $(`#step-${step}`).addClass('active');

        $('.checkout-section').removeClass('active').hide();
        $(`#section-${step}`).addClass('active').fadeIn();

        const progress = (step / 3) * 100;
        $('.progress-bar').css('width', `${progress}%`);
        $('#checkout-progress-text').text(`Step ${step} of 3: ${getStepName(step)}`);

        $('html, body').animate({
            scrollTop: $('#breadcrumb').offset().top - 20
        }, 300);
    }

    function getStepName(step) {
        switch (step) {
            case 1: return 'Shipping Information';
            case 2: return 'Payment Method';
            case 3: return 'Review & Confirmation';
            default: return '';
        }
    }

    // --- Form Validation Functions ---
    function validateField(field) {
        const value = field.val().trim();
        const errorElement = field.next('.error-message');
        if (!value && field.prop('required')) {
            field.addClass('error');
            errorElement.text(field.prev('label').text() + ' is required.').show();
            return false;
        }
        field.removeClass('error');
        errorElement.hide();
        return true;
    }

    function validateEmailField(field) {
        if (!validateField(field)) return false;
        const email = field.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const errorElement = field.next('.error-message');
        if (email && !emailRegex.test(email)) {
            field.addClass('error');
            errorElement.text('Please enter a valid email address.').show();
            return false;
        }
        field.removeClass('error');
        errorElement.hide();
        return true;
    }

    function validatePhoneField(field, errorId, isMpesa = false) {
        if (!validateField(field)) return false;
        const phone = field.val().trim().replace(/\s+/g, ''); // Remove spaces for validation
        const errorElement = field.next('.error-message'); // Ensure this targets the correct error message div
        
        // Basic international phone regex (allows +, digits, min 7, max 15)
        let phoneRegex = /^\+?[0-9]{7,15}$/;
        let specificErrorMsg = 'Please enter a valid phone number.';

        if (isMpesa) {
            // Kenyan M-Pesa format: 07xxxxxxxx, 01xxxxxxxx, or +2547xxxxxxxx, +2541xxxxxxxx
            phoneRegex = /^(?:0|\+254)?(7[0-9]{8}|1[0-9]{8})$/;
            specificErrorMsg = 'Please enter a valid M-Pesa phone number (e.g., 0712345678 or +254712345678).';
        }

        if (phone && !phoneRegex.test(phone)) {
            field.addClass('error');
            errorElement.text(specificErrorMsg).show();
            return false;
        }
        field.removeClass('error');
        errorElement.hide();
        return true;
    }
    
    function validatePasswordFields() {
        let isValid = true;
        const passwordField = $('#password');
        const confirmPasswordField = $('#confirm-password');
        const passwordError = $('#password-error');
        const confirmPasswordError = $('#confirm-password-error');

        const password = passwordField.val();
        const confirmPassword = confirmPasswordField.val();

        if (password.length < 8) {
            passwordField.addClass('error');
            passwordError.text('Password must be at least 8 characters.').show();
            isValid = false;
        } else {
            passwordField.removeClass('error');
            passwordError.hide();
        }

        if (password !== confirmPassword) {
            confirmPasswordField.addClass('error');
            confirmPasswordError.text('Passwords do not match.').show();
            isValid = false;
        } else {
            confirmPasswordField.removeClass('error');
            confirmPasswordError.hide();
        }
        return isValid;
    }
    
    function clearError(field) {
        field.removeClass('error');
        field.next('.error-message').hide();
    }


    function validateShippingForm() {
        let isValid = true;
        const requiredFields = [
            { id: 'first-name' }, { id: 'last-name' },
            { id: 'email' }, { id: 'phone' },
            { id: 'address' }, { id: 'city' }, { id: 'zip-code' },
            { id: 'country' }, { id: 'state' }
        ];

        requiredFields.forEach(f => {
            if (!validateField($(`#${f.id}`))) isValid = false;
        });

        if (!validateEmailField($('#email'))) isValid = false;
        if (!validatePhoneField($('#phone'), 'phone-error')) isValid = false;


        if ($('#create-account').is(':checked')) {
            if (!validatePasswordFields()) isValid = false;
        }

        if ($('#shiping-address').is(':checked')) {
            const shipRequiredFields = [
                { id: 'ship-first-name' }, { id: 'ship-last-name' },
                { id: 'ship-address' }, { id: 'ship-city' }, { id: 'ship-zip' },
                { id: 'ship-country' }, { id: 'ship-state' }, { id: 'ship-phone'}
            ];
            shipRequiredFields.forEach(f => {
                 const field = $(`#${f.id}`);
                 // Make shipping fields required only if the checkbox is checked
                 field.prop('required', true);
                 if (!validateField(field)) isValid = false;
            });
            if (!validatePhoneField($('#ship-phone'), 'ship-phone-error')) isValid = false; // Assuming ship-phone-error exists
        } else {
             // If not shipping to different address, these fields are not required
            const shipFields = ['ship-first-name', 'ship-last-name', 'ship-address', 'ship-city', 'ship-zip', 'ship-country', 'ship-state', 'ship-phone'];
            shipFields.forEach(id => {
                const field = $(`#${id}`);
                field.prop('required', false);
                clearError(field);
            });
        }

        return isValid;
    }

    function validatePaymentForm() {
        if (!selectedPaymentMethod) {
            alert('Please select a payment method.');
            return false;
        }

        if (selectedPaymentMethod === 'stripe') {
            if (!$('#card-holder').val().trim()) {
                validateField($('#card-holder')); // Trigger validation display
                return false;
            }
            // Stripe card element has its own validation, checked during payment processing
        } else if (selectedPaymentMethod === 'mpesa') {
            if (!validatePhoneField($('#mpesa-phone'), 'mpesa-phone-error', true)) {
                 return false;
            }
        }
        return true;
    }

    // --- Order Summary & Total Calculation ---
    function updateOrderSummaryDisplay() {
        // Update shipping cost in summary
        $('#shipping-cost').text(selectedShippingOption.price === 0 ? 'FREE' : `KES ${selectedShippingOption.price.toFixed(2)}`);

        // Update total
        const total = orderSubtotal + selectedShippingOption.price;
        $('#order-total').text(`KES ${total.toFixed(2)}`);

        // Update selected payment method in summary
        let paymentMethodText = 'No payment method selected';
        if (selectedPaymentMethod === 'stripe') {
            paymentMethodText = 'Credit/Debit Card (Stripe)';
        } else if (selectedPaymentMethod === 'mpesa') {
            paymentMethodText = 'M-Pesa';
        }
        $('#selected-payment-method').text(paymentMethodText);

        // Update selected shipping method in summary
        $('#selected-shipping-method').text(selectedShippingOption.description);
    }
    
    function updateOrderSummaryFromForm() {
        // This function can be expanded if product details are dynamic
        // For now, it mainly ensures shipping and payment are updated
        updateOrderSummaryDisplay();
    }


    // --- Populate Review Data ---
    function populateReviewData() {
        // Shipping Information
        let shipToName = $('#first-name').val() + ' ' + $('#last-name').val();
        let shipToEmail = $('#email').val();
        let shipToPhone = $('#phone').val();
        let shipToAddress = $('#address').val();
        let shipToCity = $('#city').val();
        let shipToState = $('#state option:selected').text();
        let shipToCountry = $('#country option:selected').text();

        if ($('#shiping-address').is(':checked')) {
            shipToName = ($('#ship-first-name').val() || $('#first-name').val()) + ' ' + ($('#ship-last-name').val() || $('#last-name').val());
            // Email is usually not different for shipping, but phone might be
            shipToPhone = $('#ship-phone').val() || $('#phone').val();
            shipToAddress = $('#ship-address').val() || $('#address').val();
            shipToCity = $('#ship-city').val() || $('#city').val();
            shipToState = $('#ship-state option:selected').text() || $('#state option:selected').text();
            shipToCountry = $('#ship-country option:selected').text() || $('#country option:selected').text();
        }

        $('#review-name').text(shipToName);
        $('#review-email').text(shipToEmail);
        $('#review-phone').text(shipToPhone);
        $('#review-address').text(shipToAddress);
        $('#review-city').text(shipToCity);
        $('#review-state').text(shipToState);
        $('#review-country').text(shipToCountry);

        // Shipping Method
        $('#review-shipping-method').text(selectedShippingOption.description);
        $('#review-shipping-cost').text(selectedShippingOption.price === 0 ? 'FREE' : `KES ${selectedShippingOption.price.toFixed(2)}`);

        // Payment Method
        let paymentMethodText = 'N/A';
        if (selectedPaymentMethod === 'stripe') paymentMethodText = 'Credit/Debit Card (Stripe)';
        if (selectedPaymentMethod === 'mpesa') paymentMethodText = 'M-Pesa';
        $('#review-payment-method').text(paymentMethodText);

        // Order Items (Hardcoded for now as per HTML)
        // In a real app, loop through cart items
        // $('.order-products').html(...) 

        // Total
        const total = orderSubtotal + selectedShippingOption.price;
        $('#review-total').text(`KES ${total.toFixed(2)}`);
    }

    // --- Order Processing ---
    async function handlePlaceOrder() {
        if (!$('#terms').is(':checked')) {
            alert('Please read and accept the terms and conditions to place your order.');
            return;
        }

        const placeOrderButton = $('#place-order');
        placeOrderButton.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Processing...');

        try {
            let paymentResult;
            if (selectedPaymentMethod === 'stripe') {
                paymentResult = await processStripePayment();
            } else if (selectedPaymentMethod === 'mpesa') {
                paymentResult = await processMpesaPayment();
            } else {
                throw new Error("Invalid payment method selected.");
            }

            if (paymentResult.success) {
                // Simulate submitting order to a third-party service
                const orderData = getOrderData(paymentResult.transactionId);
                const submissionResult = await submitOrderToThirdParty(orderData);

                if (submissionResult.success) {
                    $('#confirmation-order-id').text(submissionResult.orderId);
                    goToStep(4); // Assuming step 4 is confirmation
                    $('.checkout-section').removeClass('active').hide(); // Hide other sections
                    $('#section-confirmation').addClass('active').fadeIn(); // Show confirmation
                     // Update progress bar for completion
                    $('.progress-bar').css('width', '100%');
                    $('#checkout-progress-text').text('Order Completed!');
                } else {
                    alert(`Order submission failed: ${submissionResult.message || 'Please try again.'}`);
                    placeOrderButton.prop('disabled', false).html('Place Order');
                }
            } else {
                alert(`Payment failed: ${paymentResult.message || 'Please check your payment details and try again.'}`);
                placeOrderButton.prop('disabled', false).html('Place Order');
            }
        } catch (error) {
            console.error("Error placing order:", error);
            alert(`An error occurred: ${error.message || 'Please try again.'}`);
            placeOrderButton.prop('disabled', false).html('Place Order');
        }
    }

    async function processStripePayment() {
        const cardHolderName = $('#card-holder').val();
        const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: cardHolderName,
                email: $('#email').val(),
                phone: $('#phone').val(),
                address: {
                    line1: $('#address').val(),
                    city: $('#city').val(),
                    state: $('#state option:selected').text(), // Or use value if it's a code
                    postal_code: $('#zip-code').val(),
                    country: $('#country').val(), // Assuming value is country code like 'KE'
                },
            },
        });

        if (error) {
            console.error("Stripe error:", error);
            $('#card-errors').text(error.message).show();
            return { success: false, message: error.message };
        }

        // SIMULATE backend processing of paymentMethod.id
        // In a real app, send paymentMethod.id to your backend to create a PaymentIntent and confirm it.
        console.log("Stripe PaymentMethod created:", paymentMethod);
        return new Promise(resolve => {
            setTimeout(() => {
                // Simulate a successful payment confirmation from backend
                resolve({ success: true, transactionId: paymentMethod.id });
                // To simulate failure:
                // resolve({ success: false, message: "Payment declined by bank (simulated)." });
            }, MOCK_API_DELAY);
        });
    }

    async function processMpesaPayment() {
        const mpesaPhone = $('#mpesa-phone').val().replace(/\s+/g, '');
        // Normalize phone to +254 format if it starts with 0
        const normalizedPhone = mpesaPhone.startsWith('0') ? `254${mpesaPhone.substring(1)}` : mpesaPhone.replace('+', '');


        console.log(`Initiating M-Pesa STK push for ${normalizedPhone} with amount KES ${orderSubtotal + selectedShippingOption.price}`);

        // SIMULATE API call to your backend, which then calls M-Pesa API
        return new Promise(resolve => {
            // Display a message to the user
            const mpesaStatusDiv = $('#mpesa-payment').find('.mpesa-status-message'); // Add this div in HTML if needed
            if(mpesaStatusDiv.length) {
                mpesaStatusDiv.text('Processing M-Pesa payment... Please check your phone for STK push and enter your PIN.').show();
            } else {
                $('<div class="mpesa-status-message" style="margin-top:10px; color:green;">Processing M-Pesa payment... Please check your phone for STK push and enter your PIN.</div>').insertAfter('#mpesa-phone');
            }


            setTimeout(() => {
                // Simulate M-Pesa STK push success and payment confirmation
                // In a real app, your backend would poll M-Pesa or receive a callback
                const mockTransactionId = `MPESA_TRX_${Date.now()}`;
                console.log("M-Pesa payment successful (simulated). Transaction ID:", mockTransactionId);
                 if(mpesaStatusDiv.length) mpesaStatusDiv.hide();
                resolve({ success: true, transactionId: mockTransactionId });

                // To simulate failure:
                // console.log("M-Pesa payment failed (simulated).");
                // resolve({ success: false, message: "M-Pesa transaction timed out or was cancelled by user (simulated)." });
            }, MOCK_API_DELAY + 3000); // Longer delay for M-Pesa simulation
        });
    }
    
    function getOrderData(transactionId) {
        const billingAddress = {
            firstName: $('#first-name').val(),
            lastName: $('#last-name').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            address1: $('#address').val(),
            city: $('#city').val(),
            zip: $('#zip-code').val(),
            countryCode: $('#country').val(),
            province: $('#state option:selected').text(),
        };

        let shippingAddress = billingAddress;
        if ($('#shiping-address').is(':checked')) {
            shippingAddress = {
                firstName: $('#ship-first-name').val() || billingAddress.firstName,
                lastName: $('#ship-last-name').val() || billingAddress.lastName,
                // Email is usually not different for shipping
                phone: $('#ship-phone').val() || billingAddress.phone,
                address1: $('#ship-address').val() || billingAddress.address1,
                city: $('#ship-city').val() || billingAddress.city,
                zip: $('#ship-zip').val() || billingAddress.zip,
                countryCode: $('#ship-country').val() || billingAddress.countryCode,
                province: $('#ship-state option:selected').text() || billingAddress.province,
            };
        }
        
        // Product data is hardcoded in HTML for now
        const items = [
            { sku: 'DELL-LAT-3350', name: 'DELL LATITUDE 3350', quantity: 1, price: 10980.00 },
            { sku: 'AJENNY-HPS5000', name: 'AJENNY HPS5000 HEADPHONES', quantity: 2, price: 5490.00 } // Assuming price per unit
        ];

        return {
            customer: {
                firstName: billingAddress.firstName,
                lastName: billingAddress.lastName,
                email: billingAddress.email,
            },
            billingAddress: billingAddress,
            shippingAddress: shippingAddress,
            items: items,
            shippingMethod: selectedShippingOption,
            payment: {
                method: selectedPaymentMethod,
                transactionId: transactionId,
            },
            orderNotes: $('#order-notes').val(),
            subtotal: orderSubtotal,
            shippingCost: selectedShippingOption.price,
            total: orderSubtotal + selectedShippingOption.price,
            createAccount: $('#create-account').is(':checked'),
            password: $('#create-account').is(':checked') ? $('#password').val() : null,
        };
    }

    async function submitOrderToThirdParty(orderData) {
        console.log("Submitting order to third-party service (simulated):", orderData);
        // SIMULATE API call to a third-party order management system
        return new Promise(resolve => {
            setTimeout(() => {
                const mockOrderId = `ORD-${Date.now()}`;
                console.log("Order submitted successfully (simulated). Order ID:", mockOrderId);
                resolve({ success: true, orderId: mockOrderId });
                // To simulate failure:
                // resolve({ success: false, message: "Failed to connect to order service (simulated)." });
            }, MOCK_API_DELAY);
        });
    }


    // --- Location Search (Mock) ---
    const locationInput = $('#address'); // Assuming billing address is used for shipping cost calculation
    const locationResultsContainer = $('<div class="location-results"></div>').insertAfter(locationInput.parent());
    locationInput.parent().addClass('location-search'); // Add class for styling context

    locationInput.on('input', function() {
        const query = $(this).val();
        if (query.length < 3) {
            locationResultsContainer.hide().empty();
            return;
        }
        // Mock API call for location suggestions
        setTimeout(function() {
            const demoLocations = [
                'Kilifi Town, Kilifi County', 'Malindi, Kilifi County',
                'Watamu, Kilifi County', 'Mtwapa, Kilifi County',
                'Mariakani, Kilifi County', 'Kaloleni, Kilifi County',
                'Nairobi CBD, Nairobi County', 'Westlands, Nairobi County',
                'Mombasa Island, Mombasa County', 'Nyali, Mombasa County'
            ];
            const filtered = demoLocations.filter(loc => loc.toLowerCase().includes(query.toLowerCase()));
            locationResultsContainer.empty();
            if (filtered.length) {
                filtered.forEach(loc => {
                    $('<div class="location-result-item"></div>').text(loc).appendTo(locationResultsContainer);
                });
                locationResultsContainer.show();
            } else {
                locationResultsContainer.hide();
            }
        }, 300);
    });

    $(document).on('click', '.location-result-item', function() {
        const selectedText = $(this).text();
        locationInput.val(selectedText);
        locationResultsContainer.hide().empty();
        // Here you might parse selectedText to fill city/state/country if API provides structured data
        // For now, this just fills the address line.
        // Potentially trigger shipping cost recalculation if it depends on this address.
        // e.g., calculateDynamicShippingCosts(selectedText);
    });

    $(document).on('click', function(e) {
        if (!$(e.target).closest('.location-search').length) {
            locationResultsContainer.hide();
        }
    });
    
    // --- Initial Setup ---
    updateOrderSummaryDisplay(); // Initialize summary on page load
    if ($('#create-account').is(':checked')) {
         $('#create-account').closest('.input-checkbox').find('.caption').show();
    }
    if ($('#shiping-address').is(':checked')) {
         $('#shiping-address').closest('.input-checkbox').find('.caption').show();
    }

});
