# TikTok OrderHub System - 

## Overview
This document outlines the user stories and demo scenarios for the TikTok OrderHub system with access control, order management, and automated receipt generation.

---

## **Epic 1: User Authentication and Access Control**

### User Story 1.1: Corporate Email Login
**As a** user  
**I want to** log in using my greatdealscorp.com email address  
**So that** I can access the TikTok OrderHub system securely  

**Demo Steps:**

1. User visits the TikTok OrderHub application
2. Enters their @greatdealscorp.com email address
3. System validates the email domain
4. User proceeds to OTP verification

### User Story 1.2: OTP Verification
**As a** user  
**I want to** receive and enter an OTP for secure login  
**So that** I can authenticate without passwords  

**Demo Steps:**

1. System sends OTP to user's @greatdealscorp.com email
2. User receives OTP in their email inbox
3. User enters the OTP in the application
4. System validates the OTP and proceeds to access check

### User Story 1.3: Access Verification
**As a** user  
**I want to** have my access status automatically checked  
**So that** I know if I can use the system or need to request access  

**Demo Steps:**

1. After successful OTP verification, system checks user access status
2. If user has access: Redirects to main TikTok OrderHub dashboard
3. If user has no access: Shows access denied message with request option
4. User sees clear status of their current access level

### User Story 1.4: Access Request Process
**As a** user  
**I want to** request access to the TikTok OrderHub system  
**So that** I can start using the order management features  

**Demo Steps:**

1. User without access sees "Request Access" button
2. User clicks to submit access request
3. System creates access request with user's email
4. User sees confirmation message "Access request submitted"
5. User can check request status anytime

### User Story 1.5: Access Approval Management
**As a** super admin or admin  
**I want to** grant access to users who have requested it  
**So that** authorized team members can use the TikTok OrderHub system  

**Demo Steps:**

1. Super admin/admin logs into the system
2. Navigates to "Pending Access Requests" section
3. Reviews user details and request information
4. Can approve or reject the access request
5. Upon approval, user immediately gains system access
6. User receives notification of approval status

---

## **Epic 2: TikTok Order Search and Management**

### User Story 2.1: Order Search with TikTok Shop Selection
**As a** user  
**I want to** search for orders using order number and select specific TikTok shop  
**So that** I can find specific TikTok orders quickly and accurately  

**Demo Steps:**

1. User accesses the order search interface
2. Enters order number in search field
3. Selects specific TikTok shop from dropdown menu
4. System searches TikTok Seller Center for matching orders
5. Returns search results with order details
6. User can select desired order from results

### User Story 2.2: TikTok Order Details Display
**As a** user  
**I want to** view comprehensive order details with TikTok Seller Center as source of truth  
**So that** I can see accurate and up-to-date order information  

**Demo Steps:**

1. User selects an order from search results
2. System displays detailed order information sourced from TikTok Seller Center:
   - Order number and TikTok reference
   - Customer information (masked by default)
   - Product details and line items
   - Order status and tracking information
   - Payment details
   - Shipping and billing addresses (masked)
   - Order timeline and status history
3. All data reflects real-time information from TikTok platform

---

## **Epic 3: Automated Receipt Generation**

### User Story 3.1: Automatic Receipt Generation for Completed Orders
**As a** user  
**I want to** have receipts automatically generated for delivered and completed TikTok orders  
**So that** professional documentation is ready without manual intervention  

**Demo Steps:**

1. User searches for TikTok orders
2. System automatically detects orders with "Delivered" or "Completed" status
3. For qualifying orders without existing receipts, system automatically:
   - Generates professional PDF receipt
   - Includes company branding and TikTok order details
   - Adds all order line items with quantities and prices
   - Calculates taxes and totals correctly
   - Formats customer and shipping information
4. Receipt becomes immediately available for viewing
5. No manual action required from user

---

## **Epic 4: Receipt Reprinting with Data Unmasking**

### User Story 4.1: Controlled Receipt Reprinting
**As a** user  
**I want to** update specific information and reprint receipts with security controls  
**So that** I can provide accurate documentation while maintaining data privacy  

**Demo Steps:**

1. User selects an existing receipt for reprinting 
2. To enable reprinting, user must first unmask required information:
   - TIN (Tax Identification Number)
   - Complete billing address information
   - Complete shipping address information
3. User can update/edit the unmasked information if needed
4. System validates all required fields are unmasked
5. User can reprint the receipt only once per session
6. After reprinting, system logs the action for audit
7. For subsequent reprints, user must unmask data again

---

## **Security and Compliance Features**

### **Authentication Security:**
- ✅ Corporate email domain validation (@greatdealscorp.com)
- ✅ OTP-based passwordless authentication
- ✅ Role-based access control (Super Admin, Admin, User)
- ✅ IP Whitelisting

### **Data Privacy:**
- ✅ Controlled unmasking with audit trails
- ✅ One-time receipt reprinting per unmasking session

### **TikTok Integration:**
- ✅ TikTok Seller Center as single source of truth
- ✅ Real-time order status synchronization
- ✅ Automatic receipt generation for completed orders
- ✅ TikTok-specific order formatting and details

---

## **Key Business Benefits**

1. **"Secure Access Control"** - Only authorized @greatdealscorp.com users can access the system
2. **"Real-Time TikTok Integration"** - Always up-to-date order information from TikTok Seller Center
3. **"Automated Documentation"** - Professional receipts generated automatically for completed orders
4. **"Eliminated Manual Work"** - Customer support no longer needs to manually create invoices or request missing orders from the tech team
5. **"Privacy-First Design"** - Customer data protected with controlled unmasking and audit trails
6. **"Efficient Order Management"** - Quick search and detailed view of TikTok orders

This system streamlines TikTok order management while eliminating manual work for customer support and maintaining the highest standards of security and customer privacy!

---

## **Tech Stack & Architecture**

### **Architecture Type:**
- **Monorepo Structure** - Single repository containing multiple applications and shared libraries
- **Microservices Architecture** - Distributed system with independent, scalable services
- **Event-Driven Architecture** - Real-time data synchronization and automated workflows
- **API Gateway Pattern** - Centralized entry point for all client requests

### **Backend Technologies:**
- **Node.js** - Runtime environment for scalable server-side applications
- **NestJS** - Progressive Node.js framework with TypeScript support
- **TypeScript** - Type-safe JavaScript for better code quality and maintainability
- **PostgreSQL** - Primary relational database for OrderHub and TikTok data
- **MongoDB** - Document database for Scrooge service data storage
- **Redis** - In-memory caching and session management

### **Message Broker & Communication:**
- **TCP Transport** - Direct TCP communication between microservices using NestJS built-in transport
- **MessagePattern** - RPC-style communication for service-to-service calls
- **ClientProxy** - Service client proxies for inter-microservice communication

### **Authentication & Security:**
- **AWS Cognito** - Passwordless authentication and user management
- **OTP-based Authentication** - One-time password verification via email
- **JWT Tokens** - Secure session management and API authorization
- **Role-Based Access Control (RBAC)** - Granular permission management

### **External Integrations:**
- **TikTok Seller Center API** - Real-time order data synchronization
- **AWS SES** - Email service for OTP delivery and notifications
- **Puppeteer** - PDF generation service for automated receipt creation
- **Audit Logging Service** - Comprehensive activity tracking

### **Infrastructure & Deployment:**
- **Docker** - Containerized application deployment
- **PM2** - Process management for Node.js applications
- **Concurrently** - Development environment service orchestration
- **TypeORM** - Database ORM for PostgreSQL connections
- **Mongoose** - MongoDB object modeling for Node.js

### **Development & Quality:**
- **ESLint** - Code quality and consistency enforcement
- **Jest** - Unit and integration testing framework
- **Git** - Version control and collaborative development
- **Prettier** - Code formatting and style consistency