# TikTok Receipt Service - Reprint Feature

## Overview
The TikTok Receipt Service has been enhanced with the ability to reprint existing sales invoices without changing the sequence number. This feature allows reprinting of invoices when needed (e.g., corrupted files, customer requests) while maintaining the original invoice numbering.

## New Reprint Functionality

### 1. **Main Reprint Method**
```typescript
async reprintInvoice(salesInvoiceId: string): Promise<string>
```

**Parameters:**
- `salesInvoiceId`: The ID of the existing sales invoice to reprint

**Returns:**
- The new S3 URL of the reprinted invoice

**Workflow:**
1. Validates the sales invoice ID
2. Fetches the existing sales invoice record
3. Validates that invoice content exists
4. Generates a new PDF using the stored invoice content
5. Creates a new S3 key with timestamp to avoid conflicts
6. Uploads the reprinted PDF to S3
7. Updates the sales invoice record with the new file path
8. Returns the new S3 URL

### 2. **Supporting Methods**

#### `canReprintInvoice(salesInvoiceId: string): Promise<boolean>`
Checks if a sales invoice exists and can be reprinted by verifying:
- The sales invoice record exists
- The invoice content is available for PDF generation

#### `getExistingInvoice(salesInvoiceId: string)`
Retrieves the complete sales invoice record for inspection or processing.

### 3. **Utility Methods**

#### `extractS3KeyFromUrl(s3Url: string): string`
Extracts the S3 key from a full S3 URL for generating reprint keys.

#### `generateReprintS3Key(originalKey: string, timestamp: string): string`
Creates a new S3 key for the reprinted invoice by appending a timestamp:
- Original: `dev/invoices/tiktok/shop123/order456/package789/12345.pdf`
- Reprint: `dev/invoices/tiktok/shop123/order456/package789/12345_reprint_2025-06-13T10-30-45-123Z.pdf`

#### `updateInvoiceFilePath(salesInvoiceId: string, newFilePath: string): Promise<void>`
Updates the sales invoice record with the new file path and generation timestamp.

## Key Benefits

### 1. **Preserves Invoice Integrity**
- Original sequence number is maintained
- Original invoice content is preserved
- No duplicate invoice numbers

### 2. **Audit Trail**
- New file path is recorded
- Generation timestamp is updated
- Original invoice remains accessible

### 3. **Simple Interface**
- Single parameter (sales invoice ID)
- Clear return value (new S3 URL)
- Comprehensive error handling

### 4. **Robust Error Handling**
- Validates input parameters
- Checks for invoice existence
- Verifies invoice content availability
- Handles S3 upload failures gracefully

## Usage Examples

### Basic Reprint
```typescript
// Reprint an existing invoice
const newFileUrl = await tiktokReceiptService.reprintInvoice('invoice-id-123');
console.log(`Reprinted invoice available at: ${newFileUrl}`);
```

### Check Before Reprint
```typescript
// Check if an invoice can be reprinted
const canReprint = await tiktokReceiptService.canReprintInvoice('invoice-id-123');
if (canReprint) {
    const newFileUrl = await tiktokReceiptService.reprintInvoice('invoice-id-123');
    console.log(`Reprinted invoice: ${newFileUrl}`);
} else {
    console.log('Invoice cannot be reprinted - missing content or record');
}
```

### Get Invoice Details
```typescript
// Retrieve invoice details before reprinting
const invoice = await tiktokReceiptService.getExistingInvoice('invoice-id-123');
if (invoice) {
    console.log(`Invoice ${invoice.sequenceNumber} for order ${invoice.orderId}`);
    const newFileUrl = await tiktokReceiptService.reprintInvoice('invoice-id-123');
}
```

## Error Scenarios

### 1. **Invalid Sales Invoice ID**
- Throws validation error for empty/null IDs
- Clear error messages for debugging

### 2. **Invoice Not Found**
- Throws error when sales invoice doesn't exist
- Provides specific error message with ID

### 3. **Missing Invoice Content**
- Throws error when invoice content is not available
- Indicates that reprinting is not possible

### 4. **S3 Upload Failures**
- Handles network issues gracefully
- Provides detailed error information
- Uses existing retry logic from S3UploadService

## Technical Implementation

### Validation Enhancement
Added `validateSalesInvoiceId()` method to ValidationService for input validation.

### S3 Key Management
- Reprint files use timestamp-based naming
- Avoids conflicts with existing files
- Maintains logical file organization

### Database Updates
- Updates file path in sales invoice record
- Updates generation timestamp
- Preserves all other invoice data

## Future Enhancements

1. **Reprint History Tracking**
   - Track number of reprints
   - Store reprint timestamps
   - Add reprint reason codes

2. **Batch Reprinting**
   - Support multiple invoice reprints
   - Parallel processing for efficiency

3. **Template Versioning**
   - Handle template changes over time
   - Option to use current or original template

4. **Access Control**
   - Add authorization checks
   - Audit log for reprint activities

## Migration Notes

The reprint feature is fully backward compatible:
- No changes to existing invoice generation
- New methods are additive
- Existing API endpoints unchanged
- No database schema changes required

This enhancement provides a robust solution for invoice reprinting while maintaining data integrity and providing comprehensive error handling.
