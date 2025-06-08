/**
 * Shipping Calculator for HezTech E-commerce
 * Handles location-based shipping calculations for Kenya
 * Version: 1.0
 */

// ShippingCalculator Module
const ShippingCalculator = (function() {
    // Kenya regions and shipping rates
    const regions = {
        // Major cities
        cities: {
            'Nairobi': {
                standardRate: 200,
                expressRate: 400,
                sameDayAvailable: true,
                sameDayRate: 800,
                standardDeliveryDays: { min: 1, max: 2 },
                expressDeliveryDays: { min: 0, max: 1 }, // Same day to next day
                zone: 'urban'
            },
            'Mombasa': {
                standardRate: 350,
                expressRate: 600,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 2, max: 3 },
                expressDeliveryDays: { min: 1, max: 2 },
                zone: 'urban'
            },
            'Kisumu': {
                standardRate: 350,
                expressRate: 600,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 2, max: 4 },
                expressDeliveryDays: { min: 1, max: 2 },
                zone: 'urban'
            },
            'Nakuru': {
                standardRate: 300,
                expressRate: 550,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 2, max: 3 },
                expressDeliveryDays: { min: 1, max: 2 },
                zone: 'urban'
            },
            'Eldoret': {
                standardRate: 400,
                expressRate: 650,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 2, max: 4 },
                expressDeliveryDays: { min: 1, max: 2 },
                zone: 'urban'
            }
        },
        
        // Counties grouped by regions
        counties: {
            // Nairobi and surrounding
            'Nairobi': {
                standardRate: 200,
                expressRate: 400,
                sameDayAvailable: true,
                zone: 'urban'
            },
            'Kiambu': {
                standardRate: 250,
                expressRate: 450,
                sameDayAvailable: true,
                zone: 'peri-urban'
            },
            'Kajiado': {
                standardRate: 300,
                expressRate: 550,
                sameDayAvailable: false,
                zone: 'peri-urban'
            },
            'Machakos': {
                standardRate: 300,
                expressRate: 550,
                sameDayAvailable: false,
                zone: 'peri-urban'
            },
            
            // Coast region
            'Mombasa': {
                standardRate: 350,
                expressRate: 600,
                sameDayAvailable: false,
                zone: 'urban'
            },
            'Kilifi': {
                standardRate: 400,
                expressRate: 650,
                sameDayAvailable: false,
                zone: 'peri-urban'
            },
            'Kwale': {
                standardRate: 450,
                expressRate: 700,
                sameDayAvailable: false,
                zone: 'rural'
            },
            'Taita Taveta': {
                standardRate: 500,
                expressRate: 800,
                sameDayAvailable: false,
                zone: 'rural'
            },
            'Lamu': {
                standardRate: 600,
                expressRate: 1000,
                sameDayAvailable: false,
                zone: 'remote'
            },
            'Tana River': {
                standardRate: 600,
                expressRate: 1000,
                sameDayAvailable: false,
                zone: 'remote'
            },
            
            // Western region
            'Kisumu': {
                standardRate: 350,
                expressRate: 600,
                sameDayAvailable: false,
                zone: 'urban'
            },
            'Kakamega': {
                standardRate: 400,
                expressRate: 650,
                sameDayAvailable: false,
                zone: 'peri-urban'
            },
            'Bungoma': {
                standardRate: 450,
                expressRate: 700,
                sameDayAvailable: false,
                zone: 'rural'
            },
            'Busia': {
                standardRate: 500,
                expressRate: 800,
                sameDayAvailable: false,
                zone: 'rural'
            },
            'Vihiga': {
                standardRate: 450,
                expressRate: 700,
                sameDayAvailable: false,
                zone: 'rural'
            },
            
            // Rift Valley
            'Nakuru': {
                standardRate: 300,
                expressRate: 550,
                sameDayAvailable: false,
                zone: 'urban'
            },
            'Uasin Gishu': {
                standardRate: 400,
                expressRate: 650,
                sameDayAvailable: false,
                zone: 'urban'
            },
            'Nandi': {
                standardRate: 450,
                expressRate: 700,
                sameDayAvailable: false,
                zone: 'rural'
            },
            'Kericho': {
                standardRate: 400,
                expressRate: 650,
                sameDayAvailable: false,
                zone: 'peri-urban'
            },
            'Bomet': {
                standardRate: 450,
                expressRate: 700,
                sameDayAvailable: false,
                zone: 'rural'
            },
            'Baringo': {
                standardRate: 500,
                expressRate: 800,
                sameDayAvailable: false,
                zone: 'rural'
            },
            'Turkana': {
                standardRate: 800,
                expressRate: 1200,
                sameDayAvailable: false,
                zone: 'remote'
            },
            'West Pokot': {
                standardRate: 700,
                expressRate: 1100,
                sameDayAvailable: false,
                zone: 'remote'
            },
            
            // Other counties with default rates
            'default': {
                standardRate: 500,
                expressRate: 800,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 3, max: 7 },
                expressDeliveryDays: { min: 2, max: 4 },
                zone: 'rural'
            }
        },
        
        // Zone-based rates (fallback)
        zones: {
            'urban': {
                standardRate: 300,
                expressRate: 550,
                sameDayAvailable: false,
                sameDayRate: 1000,
                standardDeliveryDays: { min: 2, max: 4 },
                expressDeliveryDays: { min: 1, max: 2 }
            },
            'peri-urban': {
                standardRate: 400,
                expressRate: 650,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 3, max: 5 },
                expressDeliveryDays: { min: 2, max: 3 }
            },
            'rural': {
                standardRate: 500,
                expressRate: 800,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 4, max: 7 },
                expressDeliveryDays: { min: 2, max: 4 }
            },
            'remote': {
                standardRate: 700,
                expressRate: 1100,
                sameDayAvailable: false,
                sameDayRate: null,
                standardDeliveryDays: { min: 5, max: 10 },
                expressDeliveryDays: { min: 3, max: 6 }
            }
        }
    };
    
    // Shipping method configurations
    const shippingMethods = {
        'standard': {
            name: 'Standard Shipping',
            description: 'Standard delivery service',
            rateMultiplier: 1.0,
            freeThreshold: 10000 // Free shipping for orders above 10,000 KES
        },
        'express': {
            name: 'Express Shipping',
            description: 'Faster delivery service',
            rateMultiplier: 1.0, // Express rates are already defined in regions
            freeThreshold: 20000 // Free express shipping for orders above 20,000 KES
        },
        'same-day': {
            name: 'Same Day Delivery',
            description: 'Delivery within the same day (selected areas only)',
            rateMultiplier: 1.0, // Same-day rates are already defined in regions
            freeThreshold: 30000 // Free same-day shipping for orders above 30,000 KES
        }
    };
    
    // Configuration
    let config = {
        defaultCounty: 'Nairobi',
        defaultCity: 'Nairobi',
        defaultZone: 'urban',
        minimumOrderForFreeShipping: 10000,
        weightFactorPerKg: 50, // Additional charge per kg above base weight
        baseWeight: 5, // Base weight in kg included in standard rates
        bulkyItemThreshold: 15, // kg threshold for bulky items
        bulkyItemSurcharge: 300, // Additional charge for bulky items
        fragileItemSurcharge: 200, // Additional charge for fragile items
        remoteAreaSurcharge: 200, // Additional charge for remote areas
        holidaySurcharge: 100 // Additional charge for holiday deliveries
    };
    
    /**
     * Normalizes a location string for consistent lookup
     * @param {string} location - The location to normalize
     * @returns {string} - Normalized location string
     */
    function normalizeLocation(location) {
        if (!location) return '';
        
        // Remove extra spaces, convert to title case
        return location.trim()
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Gets shipping rates for a specific location
     * @param {string} city - The city
     * @param {string} county - The county
     * @returns {object} - Shipping rates for the location
     */
    function getLocationRates(city, county) {
        // Normalize inputs
        const normalizedCity = normalizeLocation(city);
        const normalizedCounty = normalizeLocation(county);
        
        // Try to find city-specific rates
        if (normalizedCity && regions.cities[normalizedCity]) {
            return regions.cities[normalizedCity];
        }
        
        // Try to find county-specific rates
        if (normalizedCounty && regions.counties[normalizedCounty]) {
            return regions.counties[normalizedCounty];
        }
        
        // If county is known but doesn't have specific rates, use default county rates
        if (normalizedCounty) {
            return regions.counties.default;
        }
        
        // Fallback to default urban rates
        return regions.zones[config.defaultZone];
    }
    
    /**
     * Calculates shipping cost based on location and shipping method
     * @param {object} options - Calculation options
     * @param {string} options.city - The city
     * @param {string} options.county - The county
     * @param {string} options.shippingMethod - The shipping method (standard, express, same-day)
     * @param {number} options.orderTotal - The total order amount
     * @param {number} options.weight - The total weight in kg
     * @param {boolean} options.isBulky - Whether the order contains bulky items
     * @param {boolean} options.isFragile - Whether the order contains fragile items
     * @param {boolean} options.isHoliday - Whether the order is during a holiday period
     * @returns {object} - Shipping cost details
     */
    function calculateShippingCost(options) {
        const {
            city = config.defaultCity,
            county = config.defaultCounty,
            shippingMethod = 'standard',
            orderTotal = 0,
            weight = config.baseWeight,
            isBulky = false,
            isFragile = false,
            isHoliday = false
        } = options;
        
        // Get location-specific rates
        const locationRates = getLocationRates(city, county);
        
        // Check if the selected shipping method is available for this location
        if (shippingMethod === 'same-day' && !locationRates.sameDayAvailable) {
            return {
                available: false,
                cost: null,
                method: shippingMethod,
                message: 'Same-day delivery is not available for this location'
            };
        }
        
        // Get the base rate for the selected shipping method
        let baseRate = 0;
        switch (shippingMethod) {
            case 'express':
                baseRate = locationRates.expressRate || regions.zones[locationRates.zone].expressRate;
                break;
            case 'same-day':
                baseRate = locationRates.sameDayRate || regions.zones[locationRates.zone].sameDayRate;
                break;
            case 'standard':
            default:
                baseRate = locationRates.standardRate || regions.zones[locationRates.zone].standardRate;
                break;
        }
        
        // Check for free shipping threshold
        const freeThreshold = shippingMethods[shippingMethod].freeThreshold;
        if (orderTotal >= freeThreshold) {
            return {
                available: true,
                cost: 0,
                method: shippingMethod,
                baseRate: baseRate,
                discounts: [{
                    type: 'free-shipping',
                    amount: baseRate,
                    reason: `Free ${shippingMethods[shippingMethod].name} for orders above KES ${freeThreshold}`
                }],
                message: `Free ${shippingMethods[shippingMethod].name} for orders above KES ${freeThreshold}`,
                estimatedDelivery: getEstimatedDeliveryTime(city, county, shippingMethod)
            };
        }
        
        // Calculate additional charges
        let additionalCharges = [];
        let totalAdditionalCharge = 0;
        
        // Weight surcharge (if above base weight)
        if (weight > config.baseWeight) {
            const extraWeight = weight - config.baseWeight;
            const weightCharge = Math.ceil(extraWeight) * config.weightFactorPerKg;
            additionalCharges.push({
                type: 'weight',
                amount: weightCharge,
                reason: `Extra weight (${Math.ceil(extraWeight)} kg above ${config.baseWeight} kg base)`
            });
            totalAdditionalCharge += weightCharge;
        }
        
        // Bulky item surcharge
        if (isBulky || weight >= config.bulkyItemThreshold) {
            additionalCharges.push({
                type: 'bulky',
                amount: config.bulkyItemSurcharge,
                reason: 'Bulky item handling'
            });
            totalAdditionalCharge += config.bulkyItemSurcharge;
        }
        
        // Fragile item surcharge
        if (isFragile) {
            additionalCharges.push({
                type: 'fragile',
                amount: config.fragileItemSurcharge,
                reason: 'Fragile item handling'
            });
            totalAdditionalCharge += config.fragileItemSurcharge;
        }
        
        // Remote area surcharge
        if (locationRates.zone === 'remote') {
            additionalCharges.push({
                type: 'remote',
                amount: config.remoteAreaSurcharge,
                reason: 'Remote area delivery'
            });
            totalAdditionalCharge += config.remoteAreaSurcharge;
        }
        
        // Holiday surcharge
        if (isHoliday) {
            additionalCharges.push({
                type: 'holiday',
                amount: config.holidaySurcharge,
                reason: 'Holiday period delivery'
            });
            totalAdditionalCharge += config.holidaySurcharge;
        }
        
        // Calculate total shipping cost
        const totalCost = baseRate + totalAdditionalCharge;
        
        return {
            available: true,
            cost: totalCost,
            method: shippingMethod,
            baseRate: baseRate,
            additionalCharges: additionalCharges,
            message: `${shippingMethods[shippingMethod].name} to ${city || county}`,
            estimatedDelivery: getEstimatedDeliveryTime(city, county, shippingMethod)
        };
    }
    
    /**
     * Gets estimated delivery time for a location and shipping method
     * @param {string} city - The city
     * @param {string} county - The county
     * @param {string} shippingMethod - The shipping method
     * @returns {object} - Estimated delivery time range
     */
    function getEstimatedDeliveryTime(city, county, shippingMethod = 'standard') {
        // Get location rates
        const locationRates = getLocationRates(city, county);
        
        // Get delivery days based on shipping method
        let deliveryDays;
        
        switch (shippingMethod) {
            case 'express':
                deliveryDays = locationRates.expressDeliveryDays || 
                    regions.zones[locationRates.zone].expressDeliveryDays;
                break;
            case 'same-day':
                return {
                    min: 0,
                    max: 0,
                    unit: 'days',
                    formatted: 'Today',
                    cutoffTime: '12:00 PM'
                };
            case 'standard':
            default:
                deliveryDays = locationRates.standardDeliveryDays || 
                    regions.zones[locationRates.zone].standardDeliveryDays;
                break;
        }
        
        // Calculate actual dates
        const today = new Date();
        const minDeliveryDate = new Date(today);
        minDeliveryDate.setDate(today.getDate() + deliveryDays.min);
        
        const maxDeliveryDate = new Date(today);
        maxDeliveryDate.setDate(today.getDate() + deliveryDays.max);
        
        // Format dates
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const minFormatted = minDeliveryDate.toLocaleDateString('en-KE', options);
        const maxFormatted = maxDeliveryDate.toLocaleDateString('en-KE', options);
        
        let formatted;
        if (deliveryDays.min === 0) {
            formatted = 'Today (before 8:00 PM)';
        } else if (deliveryDays.min === deliveryDays.max) {
            formatted = minFormatted;
        } else {
            formatted = `${minFormatted} - ${maxFormatted}`;
        }
        
        return {
            min: deliveryDays.min,
            max: deliveryDays.max,
            unit: 'days',
            minDate: minDeliveryDate,
            maxDate: maxDeliveryDate,
            formatted: formatted
        };
    }
    
    /**
     * Gets all available shipping methods for a location
     * @param {string} city - The city
     * @param {string} county - The county
     * @param {number} orderTotal - The total order amount
     * @returns {Array} - Available shipping methods with costs
     */
    function getAvailableShippingMethods(city, county, orderTotal = 0) {
        const locationRates = getLocationRates(city, county);
        const methods = [];
        
        // Standard shipping is always available
        methods.push(calculateShippingCost({
            city,
            county,
            shippingMethod: 'standard',
            orderTotal
        }));
        
        // Express shipping is always available
        methods.push(calculateShippingCost({
            city,
            county,
            shippingMethod: 'express',
            orderTotal
        }));
        
        // Same-day shipping is only available in certain locations
        if (locationRates.sameDayAvailable) {
            methods.push(calculateShippingCost({
                city,
                county,
                shippingMethod: 'same-day',
                orderTotal
            }));
        }
        
        return methods;
    }
    
    /**
     * Validates and formats a Kenyan address
     * @param {object} address - The address to validate
     * @returns {object} - Validation result with formatted address
     */
    function validateKenyanAddress(address) {
        const { street, city, county, postalCode } = address;
        const errors = [];
        
        // Basic validation
        if (!street || street.trim().length < 5) {
            errors.push('Please enter a valid street address');
        }
        
        if (!city || city.trim().length < 2) {
            errors.push('Please enter a valid city/town');
        }
        
        if (!county || county.trim().length < 2) {
            errors.push('Please select a county');
        }
        
        // Kenyan postal codes are typically 5 digits
        const postalCodeRegex = /^\d{5}$/;
        if (!postalCode || !postalCodeRegex.test(postalCode)) {
            errors.push('Please enter a valid 5-digit postal code');
        }
        
        // Check if the city exists in our database
        const normalizedCity = normalizeLocation(city);
        const cityExists = regions.cities[normalizedCity] !== undefined;
        
        // Check if the county exists in our database
        const normalizedCounty = normalizeLocation(county);
        const countyExists = regions.counties[normalizedCounty] !== undefined;
        
        if (city && !cityExists) {
            // Not an error, but a warning
            console.warn(`City "${city}" not found in database, using county rates`);
        }
        
        if (county && !countyExists) {
            errors.push(`County "${county}" not recognized. Please select a valid Kenyan county.`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            formattedAddress: errors.length === 0 ? {
                street: street.trim(),
                city: normalizedCity,
                county: normalizedCounty,
                postalCode: postalCode,
                country: 'Kenya'
            } : null
        };
    }
    
    /**
     * Checks if same-day delivery is available for the given location and time
     * @param {string} city - The city
     * @param {string} county - The county
     * @returns {object} - Availability information
     */
    function checkSameDayAvailability(city, county) {
        const locationRates = getLocationRates(city, county);
        
        // Check if same-day is available for this location
        if (!locationRates.sameDayAvailable) {
            return {
                available: false,
                reason: 'Same-day delivery is not available in this location'
            };
        }
        
        // Check if it's too late in the day (cutoff time: 12:00 PM)
        const now = new Date();
        const cutoffTime = new Date();
        cutoffTime.setHours(12, 0, 0, 0); // 12:00 PM
        
        if (now > cutoffTime) {
            return {
                available: false,
                reason: 'Same-day delivery orders must be placed before 12:00 PM',
                cutoffTime: '12:00 PM'
            };
        }
        
        // Check if it's a weekend or holiday (simplified)
        const day = now.getDay();
        if (day === 0) { // Sunday
            return {
                available: false,
                reason: 'Same-day delivery is not available on Sundays'
            };
        }
        
        // All checks passed
        return {
            available: true,
            cutoffTime: '12:00 PM',
            message: 'Order before 12:00 PM for delivery today'
        };
    }
    
    /**
     * Updates the shipping calculator configuration
     * @param {object} newConfig - New configuration options
     */
    function updateConfig(newConfig) {
        config = { ...config, ...newConfig };
    }
    
    /**
     * Gets all Kenyan counties
     * @returns {Array} - List of counties
     */
    function getAllCounties() {
        return Object.keys(regions.counties).filter(county => county !== 'default');
    }
    
    /**
     * Gets all major cities
     * @returns {Array} - List of cities
     */
    function getAllCities() {
        return Object.keys(regions.cities);
    }
    
    /**
     * Initializes the shipping calculator with custom configuration
     * @param {object} customConfig - Custom configuration
     */
    function init(customConfig = {}) {
        updateConfig(customConfig);
        console.log('Shipping Calculator initialized with config:', config);
    }
    
    // Public API
    return {
        init,
        calculateShippingCost,
        getEstimatedDeliveryTime,
        getAvailableShippingMethods,
        validateKenyanAddress,
        checkSameDayAvailability,
        getAllCounties,
        getAllCities
    };
})();

// Document ready function for jQuery
$(document).ready(function() {
    // Initialize the Shipping Calculator
    ShippingCalculator.init();
    
    // Populate county dropdown if it exists
    const countyDropdown = $('#state, #ship-state');
    if (countyDropdown.length) {
        const counties = ShippingCalculator.getAllCounties();
        counties.sort(); // Sort alphabetically
        
        countyDropdown.each(function() {
            const dropdown = $(this);
            const currentValue = dropdown.val();
            
            // Clear existing options except the first one
            dropdown.find('option:not(:first)').remove();
            
            // Add counties
            counties.forEach(county => {
                dropdown.append(`<option value="${county}">${county}</option>`);
            });
            
            // Restore selected value if it exists
            if (currentValue) {
                dropdown.val(currentValue);
            }
        });
    }
    
    // Update shipping options when location changes
    $('#state, #city, #ship-state, #ship-city').on('change', function() {
        updateShippingOptions();
    });
    
    // Handle shipping method selection
    $('.shipping-option').on('click', function() {
        const shippingMethod = $(this).data('method');
        const shippingPrice = $(this).data('price');
        
        // Update UI
        $('.shipping-option').removeClass('selected');
        $(this).addClass('selected');
        $(this).find('input[type="radio"]').prop('checked', true);
        
        // Update order summary
        if (shippingPrice === 0) {
            $('#shipping-cost, #review-shipping-cost').text('FREE');
        } else {
            $('#shipping-cost, #review-shipping-cost').text(`KES ${shippingPrice.toFixed(2)}`);
        }
        
        // Update total
        updateOrderTotal();
        
        // Update selected shipping method in summary
        $('#selected-shipping-method').text($(this).find('label').text());
    });
    
    // Function to update shipping options based on location
    function updateShippingOptions() {
        const city = $('#city').val() || $('#ship-city').val() || '';
        const county = $('#state').val() || $('#ship-state').val() || '';
        const orderTotal = 21960; // This should be dynamically calculated from cart
        
        if (!county) return; // Need at least a county to calculate shipping
        
        // Get available shipping methods
        const shippingMethods = ShippingCalculator.getAvailableShippingMethods(city, county, orderTotal);
        
        // Update shipping options in the UI
        const shippingOptionsContainer = $('.shipping-options');
        shippingOptionsContainer.empty();
        
        shippingMethods.forEach((method, index) => {
            if (!method.available) return; // Skip unavailable methods
            
            const isSelected = index === 0; // Select first method by default
            const priceText = method.cost === 0 ? 'FREE' : `KES ${method.cost.toFixed(2)}`;
            const deliveryEstimate = method.estimatedDelivery.formatted;
            
            const optionHtml = `
                <div class="shipping-option ${isSelected ? 'selected' : ''}" 
                     data-price="${method.cost}" 
                     data-method="${method.method}">
                    <div class="shipping-option-header">
                        <div>
                            <input type="radio" name="shipping-method" 
                                   id="${method.method}-shipping" 
                                   ${isSelected ? 'checked' : ''}>
                            <label for="${method.method}-shipping">
                                ${shippingMethodToDisplay(method.method)} (${deliveryEstimate})
                            </label>
                        </div>
                        <div class="shipping-price">${priceText}</div>
                    </div>
                </div>
            `;
            
            shippingOptionsContainer.append(optionHtml);
        });
        
        // Reattach click handler to new elements
        $('.shipping-option').on('click', function() {
            $('.shipping-option').removeClass('selected');
            $(this).addClass('selected');
            $(this).find('input[type="radio"]').prop('checked', true);
            
            const shippingPrice = $(this).data('price');
            if (shippingPrice === 0) {
                $('#shipping-cost').text('FREE');
            } else {
                $('#shipping-cost').text(`KES ${shippingPrice.toFixed(2)}`);
            }
            
            updateOrderTotal();
            $('#selected-shipping-method').text($(this).find('label').text());
        });
        
        // Update order summary with first shipping method
        const firstMethod = shippingMethods[0];
        if (firstMethod) {
            if (firstMethod.cost === 0) {
                $('#shipping-cost').text('FREE');
            } else {
                $('#shipping-cost').text(`KES ${firstMethod.cost.toFixed(2)}`);
            }
            
            $('#selected-shipping-method').text(
                `${shippingMethodToDisplay(firstMethod.method)} (${firstMethod.estimatedDelivery.formatted})`
            );
            
            updateOrderTotal();
        }
    }
    
    // Helper function to convert shipping method code to display text
    function shippingMethodToDisplay(method) {
        switch (method) {
            case 'standard': return 'Standard Shipping';
            case 'express': return 'Express Shipping';
            case 'same-day': return 'Same Day Delivery';
            default: return method;
        }
    }
    
    // Function to update order total
    function updateOrderTotal() {
        const subtotal = 21960; // This should be dynamically calculated from cart
        const shippingCostText = $('#shipping-cost').text();
        let shippingCost = 0;
        
        if (shippingCostText !== 'FREE') {
            shippingCost = parseFloat(shippingCostText.replace('KES ', ''));
        }
        
        const total = subtotal + shippingCost;
        $('#order-total').text(`KES ${total.toFixed(2)}`);
    }
    
    // Initialize shipping options on page load
    setTimeout(updateShippingOptions, 500); // Delay to ensure dropdowns are populated
});
