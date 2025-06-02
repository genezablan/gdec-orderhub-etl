# TikTok Order Management Web Interface

A modern, responsive web interface for managing TikTok orders and viewing sales invoices.

## Features

- **Shop Selection**: Dropdown list of all available shops loaded dynamically from the API
- **Order Search**: Search for specific orders by entering an Order ID
- **Order Details**: View comprehensive order information including items, customer details, and status
- **Sales Invoices**: Retrieve and display sales invoices for specific orders
- **Error Handling**: User-friendly error messages for various scenarios
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- API Gateway running on port 3001

## Installation

1. Navigate to the web-interface directory:
   ```bash
   cd web-interface
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Starting the Web Interface

1. **Quick Start** (from project root):
   ```bash
   ./start-web-interface.sh
   ```

2. **Manual Start**:
   ```bash
   cd web-interface
   npm start
   ```

3. **Development Mode** (with auto-reload):
   ```bash
   cd web-interface
   npm run dev
   ```

The web interface will be available at: http://localhost:3002

### Using the Interface

1. **Select a Shop**: Choose from the dropdown list of available shops
2. **Enter Order ID**: Type the order ID you want to search for
3. **Search Actions**:
   - Click **"Search Order Details"** to get comprehensive order information
   - Click **"Get Sales Invoices"** to retrieve sales invoice data

### API Endpoints Used

The web interface communicates with these API Gateway endpoints:

- `GET /tiktok/shops` - Load available shops
- `GET /tiktok/orders/support-details?shop_id={shop_id}&order_id={order_id}` - Get order details
- `GET /tiktok/orders/sales-invoices?shop_id={shop_id}&order_id={order_id}` - Get sales invoices

## Configuration

The API base URL is configured in `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:3001'; // API Gateway URL
```

Update this if your API Gateway is running on a different port or host.

## File Structure

```
web-interface/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── server.js           # Express server for serving the interface
├── package.json        # Node.js dependencies and scripts
└── README.md          # This file
```

## Features in Detail

### Shop Selection
- Dynamically loads shops from the API on page load
- Displays shop name and ID for easy identification
- Handles loading states and error scenarios

### Order Search
- Validates input before enabling search buttons
- Supports Enter key for quick searching
- Displays comprehensive order information including items

### Sales Invoices
- Shows invoice count and status
- Displays detailed invoice information
- Handles cases where no invoices are found

### Error Handling
- Network error handling
- API error response handling
- User-friendly error messages
- Validation for required fields

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly buttons
- Readable typography on all devices

## Troubleshooting

### Common Issues

1. **"Failed to load shops"**
   - Ensure the API Gateway is running on port 3001
   - Check that the shops service is properly configured

2. **"Failed to search order details"**
   - Verify the shop ID and order ID are correct
   - Check that the order exists in the database

3. **"Failed to search sales invoices"**
   - Ensure the order has been processed
   - Check if sales invoices have been generated for the order

### Development

For development with auto-reload:
```bash
npm run dev
```

This will start the server with nodemon for automatic restarts on file changes.

## Technical Details

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Express.js server for serving static files
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **CORS**: Enabled for API communication
- **Error Handling**: Comprehensive client-side error handling

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Make changes to the appropriate files
2. Test the interface with the API Gateway running
3. Ensure responsive design works on different screen sizes
4. Verify error handling scenarios