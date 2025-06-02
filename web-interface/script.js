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
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Modal elements
const errorModal = document.getElementById('errorModal');
const modalErrorMessage = document.getElementById('modalErrorMessage');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalOkBtn = document.getElementById('modalOkBtn');

// Tab-related DOM elements
const tabNavigation = document.getElementById('tabNavigation');
const tabContent = document.getElementById('tabContent');
const overviewContent = document.getElementById('overviewContent');
const itemsContent = document.getElementById('itemsContent');
const shippingContent = document.getElementById('shippingContent');
const invoicesContent = document.getElementById('invoicesContent');
const rawDataContent = document.getElementById('rawDataContent');

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
    
    // Modal event listeners
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeErrorModal);
    }
    
    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', closeErrorModal);
    }
    
    // Close modal when clicking overlay
    if (errorModal) {
        errorModal.addEventListener('click', function(e) {
            if (e.target === errorModal || e.target.classList.contains('modal-overlay')) {
                closeErrorModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !errorModal.classList.contains('hidden')) {
            closeErrorModal();
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
    
    // Tab switching functionality
    setupTabEventListeners();
    
    // Demo button functionality
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', showDemoData);
    }
    
    // Reset button functionality
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetToDashboard);
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

function setupTabEventListeners() {
    // Add event listeners to tab buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('.tab-button') || e.target.closest('.tab-button')) {
            const button = e.target.matches('.tab-button') ? e.target : e.target.closest('.tab-button');
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        }
    });
}

function switchTab(tabId) {
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Remove active class from all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Add active class to clicked tab button
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Show corresponding tab panel
    const activePanel = document.getElementById(`${tabId}Tab`);
    if (activePanel) {
        activePanel.classList.add('active');
    }
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
        
    } catch (error) {
        console.error('Error loading shops:', error);
        shopSelect.innerHTML = '<option value="">Failed to load shops</option>';
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
    
    showLoading();
    hideError();
    
    try {
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
        hideLoading();
        console.error('Error searching order details:', error);
        // Automatically clear the form and show error
        clearForm();
        showError(`Failed to search order details: ${error.message}`);
    }
}

function displayOrderResults(data, invoiceData) {
    resultsTitle.textContent = 'Order Details';
    
    // Show results and hide error display
    showResults();
    
    // Show tab navigation
    tabNavigation.classList.remove('hidden');
    
    // Clear all tab content
    overviewContent.innerHTML = '';
    itemsContent.innerHTML = '';
    shippingContent.innerHTML = '';
    invoicesContent.innerHTML = '';
    rawDataContent.innerHTML = '';
    
    // Hide legacy results content
    resultsContent.style.display = 'none';
    
    if (!data || !data.order) {
        overviewContent.innerHTML = '<p>No order data found.</p>';
        return;
    }

    const order = data.order;
    
    // Populate Overview Tab (Summary + Payment Info)
    populateOverviewTab(order);
    
    // Populate Items Tab
    populateItemsTab(order);
    
    // Populate Shipping Tab
    populateShippingTab(order);
    
    // Populate Invoices Tab
    populateInvoicesTab(invoiceData);
    
    // Populate Raw Data Tab
    populateRawDataTab(data);
    
    // Update tab button badges with counts
    updateTabBadges(order, invoiceData);
    
    showResults();
}

function populateOverviewTab(order) {
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
    overviewContent.appendChild(summaryCard);
    
    // Payment information card
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
        overviewContent.appendChild(paymentCard);
    }
}

function populateItemsTab(order) {
    if (!order.items || order.items.length === 0) {
        itemsContent.innerHTML = `
            <div class="order-card">
                <div class="order-header">No Items Found</div>
                <p>No items found for this order.</p>
            </div>
        `;
        return;
    }

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
    
    itemsContent.appendChild(itemsCard);
}

function populateShippingTab(order) {
    if (!order.recipientAddress && !order.shippingProvider && !order.trackingNumber) {
        shippingContent.innerHTML = `
            <div class="order-card">
                <div class="order-header">No Shipping Information</div>
                <p>No shipping information available for this order.</p>
            </div>
        `;
        return;
    }

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
    shippingContent.appendChild(shippingCard);
}

function populateInvoicesTab(invoiceData) {
    const invoiceSection = document.createElement('div');
    invoiceSection.className = 'order-card';
    
    let invoiceContent = `
        <div class="order-header">
            Sales Invoices
        </div>
    `;
    
    if (invoiceData && invoiceData.success && invoiceData.data && invoiceData.data.length > 0) {
        invoiceData.data.forEach((invoice, index) => {
            invoiceContent += `
                <div class="invoice-item">
                    <div class="invoice-item-header">
                        <span class="invoice-title">Invoice #${invoice.sequenceNumber || (index + 1)}</span>
                        <div class="invoice-actions">
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
    } else if (invoiceData && invoiceData.count === 0) {
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
    invoicesContent.appendChild(invoiceSection);
}

function populateRawDataTab(data) {
    const rawDataCard = document.createElement('div');
    rawDataCard.className = 'order-card';
    rawDataCard.innerHTML = `
        <div class="order-header">
            Raw Order Data
        </div>
        <div class="raw-data-container">
            <button class="btn-toggle-raw" onclick="toggleRawData('orderRawData')">
                📋 Toggle Order Data
            </button>
            <div id="orderRawData" class="raw-data-content hidden">
                <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
            </div>
        </div>
    `;
    rawDataContent.appendChild(rawDataCard);
}

function updateTabBadges(order, invoiceData) {
    // Update Items tab badge
    const itemsButton = document.querySelector('[data-tab="items"]');
    if (itemsButton && order && order.items) {
        const itemsText = itemsButton.querySelector('.tab-text');
        if (itemsText) {
            itemsText.textContent = `Items (${order.items.length})`;
        }
    }
    
    // Update Invoices tab badge
    const invoicesButton = document.querySelector('[data-tab="invoices"]');
    if (invoicesButton && invoiceData && invoiceData.data) {
        const invoicesText = invoicesButton.querySelector('.tab-text');
        if (invoicesText) {
            invoicesText.textContent = `Invoices (${invoiceData.data.length})`;
        }
    }
    
    // Update Shipping tab visibility based on available data
    const shippingButton = document.querySelector('[data-tab="shipping"]');
    if (shippingButton && order) {
        const hasShippingData = order.recipientAddress || order.shippingProvider || order.trackingNumber;
        if (!hasShippingData) {
            shippingButton.style.opacity = '0.6';
            shippingButton.title = 'No shipping information available';
        } else {
            shippingButton.style.opacity = '1';
            shippingButton.title = '';
        }
    }
}

// Helper function for raw data toggle
function toggleRawData(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle('hidden');
    }
}

function showResults() {
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
    }
    if (errorDisplay) {
        errorDisplay.classList.add('hidden');
    }
    
    // Hide welcome header when showing results
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'none';
    }
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
    }
}

// Demo function to show the tabbed interface
function showDemoData() {
    const demoOrderData = {
        order: {
            orderId: "DEMO123456789",
            name: "John Doe",
            status: "Completed",
            createTime: new Date().toISOString(),
            paymentMethod: "Credit Card",
            currency: "PHP",
            totalAmount: "₱1,250.00",
            shippingFee: "₱85.00",
            shippingProvider: "LBC",
            trackingNumber: "DEMO-TRACK-001",
            recipientAddress: "123 Main Street, Makati City, Metro Manila, Philippines",
            items: [
                {
                    productName: "Premium Wireless Headphones",
                    sellerSku: "WH-001-BLACK",
                    productId: "PROD12345",
                    quantity: "1",
                    originalPrice: "999.00",
                    sellerDiscount: "50.00",
                    platformDiscount: "49.00"
                },
                {
                    productName: "USB-C Cable 2m",
                    sellerSku: "CABLE-USBC-2M",
                    productId: "PROD67890",
                    quantity: "2",
                    originalPrice: "199.00",
                    sellerDiscount: "20.00",
                    platformDiscount: "15.00"
                }
            ]
        }
    };
    
    const demoInvoiceData = {
        success: true,
        count: 2,
        data: [
            {
                sequenceNumber: "INV-2025-001234",
                amountDue: "1250.00",
                vatableSales: "1116.07",
                vatAmount: "133.93",
                subtotalNet: "1116.07",
                totalDiscount: "134.00",
                pageNumber: 1,
                totalPages: 1,
                generatedAt: new Date().toISOString(),
                filePath: "/demo/invoices/inv-2025-001234.pdf"
            },
            {
                sequenceNumber: "INV-2025-001235",
                amountDue: "398.00",
                vatableSales: "355.36",
                vatAmount: "42.64",
                subtotalNet: "355.36",
                totalDiscount: "70.00",
                pageNumber: 1,
                totalPages: 1,
                generatedAt: new Date(Date.now() - 86400000).toISOString(),
                filePath: "/demo/invoices/inv-2025-001235.pdf"
            }
        ]
    };
    
    // Display the demo data using the tabbed interface
    displayOrderResults(demoOrderData, demoInvoiceData);
    
    // Show reset button and hide demo button
    const demoBtn = document.getElementById('demoBtn');
    const resetBtn = document.getElementById('resetBtn');
    if (demoBtn) demoBtn.classList.add('hidden');
    if (resetBtn) resetBtn.classList.remove('hidden');
}

function resetToDashboard() {
    // Hide results and show welcome content
    resultsSection.classList.add('hidden');
    tabNavigation.classList.add('hidden');
    
    // Show welcome header again
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'block';
    }
    
    // Show demo button and hide reset button
    const demoBtn = document.getElementById('demoBtn');
    const resetBtn = document.getElementById('resetBtn');
    if (demoBtn) demoBtn.classList.remove('hidden');
    if (resetBtn) resetBtn.classList.add('hidden');
    
    // Reset to overview tab
    switchTab('overview');
    
    // Clear all content
    overviewContent.innerHTML = '';
    itemsContent.innerHTML = '';
    shippingContent.innerHTML = '';
    invoicesContent.innerHTML = '';
    rawDataContent.innerHTML = '';
    
    // Reset tab badges
    const itemsButton = document.querySelector('[data-tab="items"] .tab-text');
    const invoicesButton = document.querySelector('[data-tab="invoices"] .tab-text');
    if (itemsButton) itemsButton.textContent = 'Items';
    if (invoicesButton) invoicesButton.textContent = 'Invoices';
}

// Loading and Error Management Functions
function showLoading() {
    if (loading) {
        loading.classList.remove('hidden');
    }
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    if (errorModal) {
        errorModal.classList.add('hidden');
    }
    
    // Hide welcome header when loading
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'none';
    }
}

function hideLoading() {
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showResults() {
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
    }
    if (errorModal) {
        errorModal.classList.add('hidden');
    }
    
    // Hide welcome header when showing results
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'none';
    }
}

function showError(message) {
    if (modalErrorMessage) {
        modalErrorMessage.textContent = message;
    }
    if (errorModal) {
        errorModal.classList.remove('hidden');
        // Focus on the modal for accessibility
        setTimeout(() => {
            if (modalOkBtn) {
                modalOkBtn.focus();
            }
        }, 100);
    }
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    
    // Show welcome header again if there's an error
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'block';
    }
}

function hideError() {
    if (errorModal) {
        errorModal.classList.add('hidden');
    }
}

function closeErrorModal() {
    hideError();
}

function clearForm() {
    // Clear form inputs
    if (shopSelect) {
        shopSelect.value = '';
    }
    if (orderInput) {
        orderInput.value = '';
    }
    
    // Clear localStorage
    localStorage.removeItem('selectedShop');
    localStorage.removeItem('orderId');
    
    // Hide error and results
    hideError();
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
    
    // Show welcome header
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.style.display = 'block';
    }
    
    // Reset form validation
    validateForm();
    
    // Reset to dashboard state
    resetToDashboard();
}