# TikTok Receipt Service - Refactored Architecture

This document describes the refactored architecture of the TikTok Receipt Service, which has been restructured to follow better software engineering practices.

## Overview

The original monolithic `TiktokReceiptService` has been broken down into smaller, focused services that each handle a specific responsibility. This improves maintainability, testability, and code reusability.

## Services Architecture

### 1. **PdfGeneratorService** (`services/pdf-generator.service.ts`)
**Responsibility**: PDF generation using Puppeteer and Pug templates

**Key Features**:
- Browser connection pooling and reuse
- Proper resource management with cleanup
- Template rendering with validation
- Support for both file output and buffer generation
- Comprehensive error handling and logging

**Methods**:
- `renderReceiptHtml(data)` - Renders Pug template to HTML
- `generatePdf(data, outputPath)` - Generates PDF file
- `generatePdfBuffer(data)` - Generates PDF as Buffer

### 2. **S3UploadService** (`services/s3-upload.service.ts`)
**Responsibility**: File storage and S3 operations

**Key Features**:
- Centralized S3 configuration management
- Retry logic for DNS resolution errors
- Structured S3 key generation
- Proper error handling and logging
- Support for different bucket configurations

**Methods**:
- `uploadPdf(buffer, key)` - Uploads PDF to S3
- `generateS3Key(shopId, orderId, packageId, sequenceNumber)` - Creates S3 keys

### 3. **InvoiceTransformerService** (`services/invoice-transformer.service.ts`)
**Responsibility**: Data transformation and business logic

**Key Features**:
- Order to package transformation
- Receipt DTO mapping with financial calculations
- Item aggregation logic
- Sales invoice DTO creation
- Configurable business rules (VAT rates, company info)

**Methods**:
- `transformToPackages(orderData)` - Splits orders into packages
- `mapOrderToReceiptDto(order, sequenceNumber)` - Creates receipt data
- `createSalesInvoiceDto(packageData, sequenceNumber, filePath, receiptDto)` - Creates invoice record
- `aggregateOrderItems(items)` - Consolidates duplicate items

### 4. **TiktokReceiptConfigService** (`services/config.service.ts`)
**Responsibility**: Configuration management

**Key Features**:
- Centralized configuration loading
- Environment variable handling
- Type-safe configuration objects
- Default value management

**Configuration Sections**:
- AWS settings (region, credentials, S3 bucket)
- Business settings (company info, VAT rate, currency)
- PDF generation settings (timeout, format)
- Environment settings (stage)

### 5. **ValidationService** (`services/validation.service.ts`)
**Responsibility**: Input validation and data integrity

**Key Features**:
- Structured validation with clear error messages
- Type checking and null validation
- Comprehensive logging of validation failures

**Methods**:
- `validateOrderInput(input)` - Validates order processing inputs
- `validatePackageInput(input)` - Validates package processing inputs
- `validateSequenceNumber(sequenceNumber)` - Validates sequence numbers
- `validatePdfBuffer(buffer)` - Validates PDF buffer integrity

### 6. **TiktokReceiptService** (Refactored Main Service)
**Responsibility**: Orchestration and coordination

**Key Features**:
- Clean separation of concerns
- Comprehensive error handling with proper logging
- Structured workflow orchestration
- Backward compatibility with legacy methods
- Proper dependency injection

**Main Workflow**:
1. `processOrder(orderId, shopId)` - Main entry point
2. `fetchOrderData()` - Data retrieval and aggregation
3. `processPackages()` - Package processing coordination
4. `processPackageInvoice()` - Individual package handling
5. `generateAndUploadPdf()` - PDF generation and storage
6. `saveSalesInvoice()` - Database persistence

## Benefits of the Refactored Architecture

### 1. **Separation of Concerns**
- Each service has a single, well-defined responsibility
- Easier to understand, modify, and maintain
- Reduced coupling between different functionalities

### 2. **Improved Testability**
- Services can be unit tested in isolation
- Easy to mock dependencies
- Clear interfaces for testing

### 3. **Better Error Handling**
- Structured error handling at each layer
- Proper logging with context information
- Graceful failure handling

### 4. **Enhanced Maintainability**
- Smaller, focused code files
- Clear dependency relationships
- Easier to locate and fix issues

### 5. **Reusability**
- Services can be reused across different contexts
- Clear service interfaces
- Modular design

### 6. **Performance Improvements**
- Browser connection pooling in PDF service
- Efficient resource management
- Proper cleanup and disposal

### 7. **Configuration Management**
- Centralized configuration handling
- Environment-specific settings
- Type-safe configuration access

## Migration Strategy

The refactored service maintains backward compatibility through deprecated methods that delegate to the new services. This allows for gradual migration:

1. **Phase 1**: Deploy refactored services alongside legacy methods
2. **Phase 2**: Update calling code to use new service methods
3. **Phase 3**: Remove deprecated legacy methods

## Usage Examples

```typescript
// Main orchestration
await tiktokReceiptService.processOrder(orderId, shopId);

// Direct service usage
const pdfBuffer = await pdfGeneratorService.generatePdfBuffer(receiptData);
const s3Url = await s3UploadService.uploadPdf(pdfBuffer, s3Key);
const packages = invoiceTransformerService.transformToPackages(orderData);
```

## Dependencies

The refactored services maintain the same external dependencies but organize them more clearly:

- `@nestjs/common` - Dependency injection and decorators
- `@app/logging` - Structured logging
- `@app/database-orderhub` - Database services
- `@app/database-scrooge` - Counter services
- `puppeteer` - PDF generation
- `pug` - Template rendering
- `@aws-sdk/client-s3` - S3 operations

## Future Improvements

1. **Circuit Breaker Pattern**: Add circuit breakers for external service calls
2. **Caching**: Implement caching for frequently accessed data
3. **Metrics**: Add performance and business metrics
4. **Rate Limiting**: Implement rate limiting for S3 uploads
5. **Batch Processing**: Support for batch invoice generation
6. **Template Management**: Dynamic template selection and management
