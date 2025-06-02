// Configuration
const API_BASE_URL = 'http://localhost:3000'; // API Gateway URL
let shops = [];

// DOM Elements
const shopSelect = document.getElementById('shopSelect');
const orderInput = document.getElementById('orderInput');
const searchOrderBtn = document.getElementById('searchOrderBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const resultsTitle = document.getElementById('resultsTitle');
const resultsContent = document.getElementById('resultsContent');
const errorDisplay = document.getElementById('errorDisplay');
const errorMessage = document.getElementById('errorMessage');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadShops().then(() => {
        // Restore previously saved shop and order values from localStorage
        restoreFormValues();
    });
    setupEventListeners();
});

function setupEventListeners() {
    // Enable form elements when both shop is selected and order ID is entered
    shopSelect.addEventListener('change', validateForm);
    orderInput.addEventListener('input', validateForm);
    
    // Search button event listener
    searchOrderBtn.addEventListener('click', searchOrderDetails);
    
    // Allow Enter key in order input to trigger search
    orderInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !searchOrderBtn.disabled) {
            searchOrderDetails();
        }
    });
    
    // Sidebar toggle for mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
}

function validateForm() {
    const shopSelected = shopSelect.value !== '';
    const orderEntered = orderInput.value.trim() !== '';
    const isValid = shopSelected && orderEntered;
    
    searchOrderBtn.disabled = !isValid;
}

// After the other validation checks, save the values
function saveFormValues() {
    localStorage.setItem('selectedShop', shopSelect.value);
    localStorage.setItem('orderId', orderInput.value.trim());
}

function restoreFormValues() {
    const savedShop = localStorage.getItem('selectedShop');
    const savedOrderId = localStorage.getItem('orderId');
    
    if (savedShop) {
        shopSelect.value = savedShop;
    }
    
    if (savedOrderId) {
        orderInput.value = savedOrderId;
    }
    
    validateForm();
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

    // Save form values to localStorage before making the request
    saveFormValues();
    
    try {
        showLoading();
        hideError();
        
        // Fetch both order details and sales invoices in parallel
        const [orderResponse, invoiceResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/tiktok/orders/support-details?shop_id=${encodeURIComponent(shopId)}&order_id=${encodeURIComponent(orderId)}`),
            fetch(`${API_BASE_URL}/tiktok/orders/sales-invoices?shop_id=${encodeURIComponent(shopId)}&order_id=${encodeURIComponent(orderId)}`)
        ]);
        
        if (!orderResponse.ok) {
            const errorData = await orderResponse.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `HTTP error! status: ${orderResponse.status}`);
        }
        
        const orderData = await orderResponse.json();
        let invoiceData = null;
        
        // Try to get invoice data, but don't fail if it's not available
        if (invoiceResponse.ok) {
            try {
                invoiceData = await invoiceResponse.json();
            } catch (error) {
                console.warn('Failed to parse invoice data:', error);
            }
        } else {
            console.warn('Invoice data not available:', invoiceResponse.status);
        }
        
        hideLoading();
        displayOrderResults(orderData, invoiceData);
        
    } catch (error) {
        console.error('Error searching order details:', error);
        hideLoading();
        showError(`Failed to search order details: ${error.message}`);
    }
}

function displayOrderResults(data, invoiceData) {
    resultsTitle.textContent = 'Order Details';
    resultsContent.innerHTML = '';
    
    // Hide the welcome header when showing results
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'none';
    }
    
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
                    <div class="summary-label">Order Date</div>
                    <div class="summary-value">${order.createTime ? new Date(order.createTime).toLocaleDateString() : 'N/A'}</div>
                </div>
            </div>
        `;
        resultsContent.appendChild(summaryCard);
        
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
            
            // Calculate totals
            let totalQuantity = 0;
            let totalOriginalAmount = 0;
            let totalDiscount = 0;
            let totalFinalAmount = 0;
            
            const itemsTableHTML = order.items.map((item, index) => {
                const quantity = parseInt(item.quantity) || 1;
                const originalPrice = parseFloat(item.originalPrice) || 0;
                const sellerDiscount = parseFloat(item.sellerDiscount) || 0;
                const platformDiscount = parseFloat(item.platformDiscount) || 0;
                const totalItemDiscount = sellerDiscount + platformDiscount;
                const originalAmount = originalPrice * quantity;
                const finalAmount = originalAmount - (totalItemDiscount * quantity);
                
                // Update running totals
                totalQuantity += quantity;
                totalOriginalAmount += originalAmount;
                totalDiscount += (totalItemDiscount * quantity);
                totalFinalAmount += finalAmount;
                
                return `
                    <tr class="item-row" data-item-index="${index}">
                        <td class="item-number">${index + 1}</td>
                        <td class="item-info">
                            <div class="product-name">${item.productName || item.skuName || 'Unknown Product'}</div>
                            <div class="product-sku">SKU: ${item.sellerSku || item.sku || 'N/A'}</div>
                            <div class="product-id">ID: ${item.productId || 'N/A'}</div>
                        </td>
                        <td class="item-quantity">${quantity}</td>
                        <td class="item-price">₱${originalPrice.toFixed(2)}</td>
                        <td class="item-original-amount">₱${originalAmount.toFixed(2)}</td>
                        <td class="item-discount">
                            <div class="discount-breakdown">
                                ${sellerDiscount > 0 ? `<div class="seller-discount">Seller: ₱${(sellerDiscount * quantity).toFixed(2)}</div>` : ''}
                                ${platformDiscount > 0 ? `<div class="platform-discount">Platform: ₱${(platformDiscount * quantity).toFixed(2)}</div>` : ''}
                                <div class="total-discount">Total: ₱${(totalItemDiscount * quantity).toFixed(2)}</div>
                            </div>
                        </td>
                        <td class="item-final-amount">₱${finalAmount.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
            
            itemsCard.innerHTML = `
                <div class="order-header">
                    <span>Order Items</span>
                    <span class="items-count">${order.items.length} item${order.items.length > 1 ? 's' : ''}</span>
                </div>
                <div class="items-table-container">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th class="col-number">#</th>
                                <th class="col-product">Product</th>
                                <th class="col-qty">Qty</th>
                                <th class="col-price">Unit Price</th>
                                <th class="col-amount">Amount</th>
                                <th class="col-discount">Discount</th>
                                <th class="col-final">Final Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsTableHTML}
                        </tbody>
                        <tfoot>
                            <tr class="totals-row">
                                <td colspan="2" class="totals-label">
                                    <strong>TOTALS</strong>
                                </td>
                                <td class="total-quantity">
                                    <strong>${totalQuantity}</strong>
                                </td>
                                <td class="total-spacer">—</td>
                                <td class="total-original">
                                    <strong>₱${totalOriginalAmount.toFixed(2)}</strong>
                                </td>
                                <td class="total-discount">
                                    <strong>₱${totalDiscount.toFixed(2)}</strong>
                                </td>
                                <td class="total-final">
                                    <strong>₱${totalFinalAmount.toFixed(2)}</strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
            
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

        // Show sales invoice information if available
        if (invoiceData) {
            const invoiceSection = document.createElement('div');
            invoiceSection.className = 'order-card';
            
            let invoiceContent = `
                <div class="order-header">
                    Sales Invoices
                </div>
            `;
            
            if (invoiceData.success && invoiceData.data && invoiceData.data.length > 0) {
                invoiceContent += `
                    <div class="invoice-summary">
                        <div class="detail-item">
                            <div class="detail-label">Invoices Found</div>
                            <div class="detail-value">
                                <span class="count-badge">${invoiceData.count || invoiceData.data.length}</span>
                            </div>
                        </div>
                    </div>
                `;
                
                invoiceData.data.forEach((invoice, index) => {
                    invoiceContent += `
                        <div class="invoice-item">
                            <div class="invoice-item-header">
                                <span class="invoice-title">Invoice ${index + 1}</span>
                                <div class="invoice-actions">
                                    <span class="invoice-sequence">#${invoice.sequenceNumber || 'N/A'}</span>
                                    ${invoice.filePath ? `
                                        <button class="btn-download" onclick="downloadInvoice('${invoice.filePath}', '${invoice.sequenceNumber}')">
                                            📄 Download PDF
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="invoice-financial-grid">
                                <div class="financial-item">
                                    <div class="financial-label">Amount Due</div>
                                    <div class="financial-value amount-due">₱${invoice.amountDue || 'N/A'}</div>
                                </div>
                                <div class="financial-item">
                                    <div class="financial-label">Vatable Sales</div>
                                    <div class="financial-value">₱${invoice.vatableSales || 'N/A'}</div>
                                </div>
                                <div class="financial-item">
                                    <div class="financial-label">VAT Amount</div>
                                    <div class="financial-value">₱${invoice.vatAmount || 'N/A'}</div>
                                </div>
                                <div class="financial-item">
                                    <div class="financial-label">Subtotal Net</div>
                                    <div class="financial-value">₱${invoice.subtotalNet || 'N/A'}</div>
                                </div>
                                <div class="financial-item">
                                    <div class="financial-label">Total Discount</div>
                                    <div class="financial-value">₱${invoice.totalDiscount || '0.00'}</div>
                                </div>
                                <div class="financial-item">
                                    <div class="financial-label">Pages</div>
                                    <div class="financial-value">${invoice.pageNumber || 1} of ${invoice.totalPages || 1}</div>
                                </div>
                            </div>
                            <div class="invoice-item-details">
                                <div class="detail-item">
                                    <div class="detail-label">Generated At</div>
                                    <div class="detail-value">${invoice.generatedAt ? new Date(invoice.generatedAt).toLocaleString() : 'N/A'}</div>
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
                });
            } else if (invoiceData.count === 0) {
                invoiceContent += `
                    <div class="no-invoice-content">
                        <div class="no-data-icon">📄</div>
                        <div class="no-data-message">
                            <p>No sales invoices found for this order.</p>
                            <small>This order may not have been processed yet or no invoices have been generated.</small>
                        </div>
                    </div>
                `;
            } else {
                invoiceContent += `
                    <div class="no-invoice-content">
                        <div class="no-data-icon">⚠️</div>
                        <div class="no-data-message">
                            <p>Unable to retrieve sales invoice information.</p>
                            <small>There may have been an issue fetching the invoice data.</small>
                        </div>
                    </div>
                `;
            }
            
            invoiceSection.innerHTML = invoiceContent;
            resultsContent.appendChild(invoiceSection);
        }
    }
    
    // Add a toggle for raw data (for debugging)
    addRawDataToggle(resultsContent, data, 'Order');
    
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
    
    // Show welcome header again if there's an error
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'block';
    }
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

function downloadInvoice(filePath, sequenceNumber) {
    // Create a download link for the invoice file
    try {
        // Create the download URL using the TikTok download endpoint
        const fileName = `Invoice_${sequenceNumber}.pdf`;
        
        // Use the TikTok download endpoint
        const downloadUrl = `${API_BASE_URL}/tiktok/download/invoice?file=${encodeURIComponent(filePath)}`;
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error downloading invoice:', error);
        showError(`Failed to download invoice: ${error.message}`);
    }
}