// Configuration
const API_BASE_URL = 'http://localhost:3000'; // API Gateway URL
let shops = [];

// DOM Elements
const shopSelect = document.getElementById('shopSelect');
const orderInput = document.getElementById('orderInput');
const searchOrderBtn = document.getElementById('searchOrderBtn');
const searchInvoicesBtn = document.getElementById('searchInvoicesBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const resultsTitle = document.getElementById('resultsTitle');
const resultsContent = document.getElementById('resultsContent');
const errorDisplay = document.getElementById('errorDisplay');
const errorMessage = document.getElementById('errorMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadShops();
    setupEventListeners();
});

function setupEventListeners() {
    // Enable form elements when both shop is selected and order ID is entered
    shopSelect.addEventListener('change', validateForm);
    orderInput.addEventListener('input', validateForm);
    
    // Search button event listeners
    searchOrderBtn.addEventListener('click', searchOrderDetails);
    searchInvoicesBtn.addEventListener('click', searchSalesInvoices);
    
    // Allow Enter key in order input to trigger search
    orderInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !searchOrderBtn.disabled) {
            searchOrderDetails();
        }
    });
}

function validateForm() {
    const shopSelected = shopSelect.value !== '';
    const orderEntered = orderInput.value.trim() !== '';
    const isValid = shopSelected && orderEntered;
    
    searchOrderBtn.disabled = !isValid;
    searchInvoicesBtn.disabled = !isValid;
}

async function loadShops() {
    try {
        showLoading();
        hideError();
        
        const response = await fetch(`${API_BASE_URL}/tiktok/shops`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        shops = await response.json();
        
        // Clear loading options
        shopSelect.innerHTML = '<option value="">Select a shop...</option>';
        
        // Populate shops dropdown
        shops.forEach(shop => {
            const option = document.createElement('option');
            option.value = shop.tiktok_shop_code;
            option.textContent = `${shop.name} (${shop.tiktok_shop_code})`;
            shopSelect.appendChild(option);
        });
        
        // Enable the dropdown and order input
        shopSelect.disabled = false;
        orderInput.disabled = false;
        
        hideLoading();
        
    } catch (error) {
        console.error('Error loading shops:', error);
        showError(`Failed to load shops: ${error.message}`);
        shopSelect.innerHTML = '<option value="">Failed to load shops</option>';
        hideLoading();
    }
}

async function searchOrderDetails() {
    const shopId = shopSelect.value;
    const orderId = orderInput.value.trim();
    
    if (!shopId || !orderId) {
        showError('Please select a shop and enter an order ID');
        return;
    }
    
    try {
        showLoading();
        hideError();
        
        const response = await fetch(
            `${API_BASE_URL}/tiktok/orders/support-details?shop_id=${encodeURIComponent(shopId)}&order_id=${encodeURIComponent(orderId)}`
        );
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        hideLoading();
        displayOrderResults(data);
        
    } catch (error) {
        console.error('Error searching order details:', error);
        hideLoading();
        showError(`Failed to search order details: ${error.message}`);
    }
}

async function searchSalesInvoices() {
    const shopId = shopSelect.value;
    const orderId = orderInput.value.trim();
    
    if (!shopId || !orderId) {
        showError('Please select a shop and enter an order ID');
        return;
    }
    
    try {
        showLoading();
        hideError();
        
        const response = await fetch(
            `${API_BASE_URL}/tiktok/orders/sales-invoices?shop_id=${encodeURIComponent(shopId)}&order_id=${encodeURIComponent(orderId)}`
        );
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        hideLoading();
        displayInvoiceResults(data);
        
    } catch (error) {
        console.error('Error searching sales invoices:', error);
        hideLoading();
        showError(`Failed to search sales invoices: ${error.message}`);
    }
}

function displayOrderResults(data) {
    resultsTitle.textContent = 'Order Details';
    resultsContent.innerHTML = '';
    
    if (!data || !data.order) {
        resultsContent.innerHTML = '<p>No order data found.</p>';
    } else {
        const order = data.order;
        
        // Summary card with key information
        const summaryCard = document.createElement('div');
        summaryCard.className = 'order-card summary-card';
        summaryCard.innerHTML = `
            <div class="order-header">
                <span class="summary-title">Order Summary</span>
                <span class="order-status ${order.status ? order.status.toLowerCase().replace(/\s+/g, '-') : 'unknown'}">${order.status || 'Unknown'}</span>
            </div>
            <div class="summary-content">
                <div class="summary-item">
                    <div class="summary-label">Order ID</div>
                    <div class="summary-value">${order.orderId || 'N/A'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Customer</div>
                    <div class="summary-value">${order.name || 'N/A'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Amount</div>
                    <div class="summary-value summary-amount">${order.totalAmount || order.subTotal || 'N/A'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Order Date</div>
                    <div class="summary-value">${order.createTime ? new Date(order.createTime * 1000).toLocaleDateString() : 'N/A'}</div>
                </div>
            </div>
        `;
        resultsContent.appendChild(summaryCard);
        
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        orderCard.innerHTML = `
            <div class="order-header">
                Detailed Order Information
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <div class="detail-label">Order ID</div>
                    <div class="detail-value">${order.orderId || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Shop ID</div>
                    <div class="detail-value">${order.shopId || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">${order.status || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Customer Name</div>
                    <div class="detail-value">${order.name || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Total Amount</div>
                    <div class="detail-value">${order.subTotal || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Created At</div>
                    <div class="detail-value">${order.createTime ? new Date(order.createTime * 1000).toLocaleString() : 'N/A'}</div>
                </div>
            </div>
        `;
        
        resultsContent.appendChild(orderCard);
        
        // Show additional order details if available
        if (order.paymentMethod || order.currency || order.totalAmount || order.shippingFee) {
            const paymentCard = document.createElement('div');
            paymentCard.className = 'order-card';
            paymentCard.innerHTML = `
                <div class="order-header">
                    Payment Information
                </div>
                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${order.paymentMethod || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Currency</div>
                        <div class="detail-value">${order.currency || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Total Amount</div>
                        <div class="detail-value">${order.totalAmount || order.subTotal || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Shipping Fee</div>
                        <div class="detail-value">${order.shippingFee || 'N/A'}</div>
                    </div>
                </div>
            `;
            resultsContent.appendChild(paymentCard);
        }

        // Show order items if available
        if (order.items && order.items.length > 0) {
            const itemsCard = document.createElement('div');
            itemsCard.className = 'order-card items-card';
            itemsCard.innerHTML = `
                <div class="order-header">
                    Order Items (${order.items.length})
                </div>
                <div class="items-container">
                </div>
            `;
            
            const itemsContainer = itemsCard.querySelector('.items-container');
            
            order.items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item-card';
                itemDiv.innerHTML = `
                    <div class="item-header">
                        <span class="item-number">#${index + 1}</span>
                        <span class="item-name">${item.productName || item.skuName || 'Unknown Product'}</span>
                    </div>
                    <div class="item-details">
                        <div class="item-row">
                            <span class="item-label">SKU:</span>
                            <span class="item-value">${item.sellerSku || item.sku || 'N/A'}</span>
                        </div>
                        <div class="item-row">
                            <span class="item-label">Quantity:</span>
                            <span class="item-value">${item.quantity || 'N/A'}</span>
                        </div>
                        <div class="item-row">
                            <span class="item-label">Price:</span>
                            <span class="item-value">${item.originalPrice || item.salePrice || 'N/A'}</span>
                        </div>
                        <div class="item-row">
                            <span class="item-label">Product ID:</span>
                            <span class="item-value">${item.productId || 'N/A'}</span>
                        </div>
                    </div>
                `;
                itemsContainer.appendChild(itemDiv);
            });
            
            resultsContent.appendChild(itemsCard);
        }

        // Show shipping/delivery information if available
        if (order.recipientAddress || order.shippingProvider || order.trackingNumber) {
            const shippingCard = document.createElement('div');
            shippingCard.className = 'order-card';
            shippingCard.innerHTML = `
                <div class="order-header">
                    Shipping Information
                </div>
                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">Shipping Provider</div>
                        <div class="detail-value">${order.shippingProvider || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Tracking Number</div>
                        <div class="detail-value">${order.trackingNumber || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Delivery Address</div>
                        <div class="detail-value">${order.recipientAddress || order.fullAddress || 'N/A'}</div>
                    </div>
                </div>
            `;
            resultsContent.appendChild(shippingCard);
        }
    }
    
    // Add a toggle for raw data (for debugging)
    addRawDataToggle(resultsContent, data, 'Order');
    
    showResults();
}

function displayInvoiceResults(data) {
    resultsTitle.textContent = 'Sales Invoices';
    resultsContent.innerHTML = '';
    
    if (!data) {
        resultsContent.innerHTML = '<p>No invoice data found.</p>';
    } else {
        // Show summary
        const summaryCard = document.createElement('div');
        summaryCard.className = 'invoice-card';
        summaryCard.innerHTML = `
            <div class="invoice-header">
                Search Results Summary
            </div>
            <div class="invoice-details">
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="${data.success ? 'success-badge' : 'error-badge'}">
                            ${data.success ? 'Success' : 'Failed'}
                        </span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Invoices Found</div>
                    <div class="detail-value">
                        <span class="count-badge">${data.count || 0}</span>
                    </div>
                </div>
            </div>
        `;
        resultsContent.appendChild(summaryCard);
        
        // Show invoices if available
        if (data.data && data.data.length > 0) {
            data.data.forEach((invoice, index) => {
                const invoiceCard = document.createElement('div');
                invoiceCard.className = 'invoice-card';
                
                invoiceCard.innerHTML = `
                    <div class="invoice-header">
                        <span class="invoice-title">Sales Invoice ${index + 1}</span>
                        <span class="invoice-sequence">#${invoice.sequenceNumber || 'N/A'}</span>
                    </div>
                    <div class="invoice-details">
                        <div class="invoice-section">
                            <div class="section-title">Order Information</div>
                            <div class="detail-item">
                                <div class="detail-label">Order ID</div>
                                <div class="detail-value">${invoice.orderId || 'N/A'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Shop ID</div>
                                <div class="detail-value">${invoice.shopId || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="invoice-section">
                            <div class="section-title">Financial Details</div>
                            <div class="detail-item">
                                <div class="detail-label">Amount Due</div>
                                <div class="detail-value amount-highlight">${invoice.amountDue || 'N/A'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">VAT Amount</div>
                                <div class="detail-value">${invoice.vatAmount || 'N/A'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Total Amount</div>
                                <div class="detail-value amount-highlight">${invoice.totalAmount || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="invoice-section">
                            <div class="section-title">Processing Information</div>
                            <div class="detail-item">
                                <div class="detail-label">Generated At</div>
                                <div class="detail-value">${invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleString() : 'N/A'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Status</div>
                                <div class="detail-value">
                                    <span class="status-badge">${invoice.status || 'Generated'}</span>
                                </div>
                            </div>
                            ${invoice.filePath ? `
                            <div class="detail-item">
                                <div class="detail-label">File Location</div>
                                <div class="detail-value file-path">${invoice.filePath}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                resultsContent.appendChild(invoiceCard);
            });
        } else if (data.count === 0) {
            const noDataCard = document.createElement('div');
            noDataCard.className = 'invoice-card no-data-card';
            noDataCard.innerHTML = `
                <div class="invoice-header">
                    <span class="invoice-title">No Sales Invoices Found</span>
                </div>
                <div class="no-data-content">
                    <div class="no-data-icon">📄</div>
                    <div class="no-data-message">
                        <p>No sales invoices were found for this order.</p>
                        <div class="possible-reasons">
                            <h4>Possible reasons:</h4>
                            <ul>
                                <li>The order hasn't been processed yet</li>
                                <li>No invoices have been generated for this order</li>
                                <li>The order doesn't exist in the system</li>
                                <li>The order is still being processed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            resultsContent.appendChild(noDataCard);
        }
    }
    
    // Add a toggle for raw data (for debugging)
    addRawDataToggle(resultsContent, data, 'Invoice');
    
    showResults();
}

function showLoading() {
    loading.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorDisplay.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showResults() {
    resultsSection.classList.remove('hidden');
    errorDisplay.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorDisplay.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

function hideError() {
    errorDisplay.classList.add('hidden');
}

function addRawDataToggle(container, data, dataType) {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'raw-data-toggle-container';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'btn-toggle-raw';
    toggleButton.textContent = `Show Raw ${dataType} Data`;
    toggleButton.onclick = function() {
        const rawDataCard = container.querySelector('.raw-data-card');
        if (rawDataCard) {
            rawDataCard.remove();
            toggleButton.textContent = `Show Raw ${dataType} Data`;
        } else {
            const jsonCard = document.createElement('div');
            jsonCard.className = 'order-card raw-data-card';
            jsonCard.innerHTML = `
                <div class="order-header">
                    Raw ${dataType} Data (JSON)
                    <small style="color: #6c757d; font-weight: normal; margin-left: 10px;">For debugging purposes</small>
                </div>
                <div class="json-display">${JSON.stringify(data, null, 2)}</div>
            `;
            container.appendChild(jsonCard);
            toggleButton.textContent = `Hide Raw ${dataType} Data`;
        }
    };
    
    toggleContainer.appendChild(toggleButton);
    container.appendChild(toggleContainer);
}