# Sales Invoice Computations Documentation

## Overview

This document provides a comprehensive guide to the financial computations involved in generating sales invoices for TikTok orders. The calculations follow Philippine tax regulations and business requirements.

## Table of Contents

1. [Basic Components](#basic-components)
2. [Tax Calculations](#tax-calculations)
3. [Invoice Totals](#invoice-totals)
4. [Sample Computations](#sample-computations)
5. [Edge Cases](#edge-cases)
6. [Implementation Details](#implementation-details)

## Basic Components

### 1. Line Item Calculations

Each order item contributes to the invoice through the following calculations:

```
Item Subtotal = Unit Price × Quantity
Item Discount = Item Subtotal × (Discount Percentage / 100)
Item Net Amount = Item Subtotal - Item Discount
```

**Example:**
```
Product: T-Shirt
Unit Price: ₱500.00
Quantity: 2
Discount: 10%

Item Subtotal = ₱500.00 × 2 = ₱1,000.00
Item Discount = ₱1,000.00 × (10/100) = ₱100.00
Item Net Amount = ₱1,000.00 - ₱100.00 = ₱900.00
```

### 2. Shipping and Fees

```
Total Shipping = Base Shipping Fee + Additional Fees
Total Fees = Platform Fees + Processing Fees + Other Fees
```

## Tax Calculations

### 1. VATable Sales (12% VAT)

For items subject to 12% VAT:

```
VATable Sales = Sum of all VATable items net amounts
VAT Amount = VATable Sales × 0.12
```

### 2. VAT-Exempt Sales

For items exempt from VAT:

```
VAT Exempt Sales = Sum of all VAT-exempt items net amounts
VAT Amount for Exempt = ₱0.00
```

### 3. Zero-Rated Sales

For export or zero-rated transactions:

```
Zero-Rated Sales = Sum of all zero-rated items net amounts
VAT Amount for Zero-Rated = ₱0.00
```

## Invoice Totals

### 1. Subtotal Calculations

```
Subtotal (Before VAT) = VATable Sales + VAT Exempt Sales + Zero-Rated Sales
Total VAT = VAT Amount (from VATable items only)
Subtotal (After VAT) = Subtotal (Before VAT) + Total VAT
```

### 2. Final Amount Calculations

```
Total Discount = Sum of all item discounts + Order-level discounts
Gross Amount = Subtotal (After VAT) + Shipping + Fees
Net Amount = Gross Amount - Total Discount
Amount Due = Net Amount
```

## Sample Computations

### Example 1: Standard Order with VATable Items

**Order Details:**
- Item 1: Shirt (₱800.00 × 1, 5% discount)
- Item 2: Pants (₱1,200.00 × 2, no discount)
- Shipping: ₱150.00
- Platform Fee: ₱50.00

**Step-by-Step Calculation:**

1. **Item Calculations:**
   ```
   Item 1:
   - Subtotal: ₱800.00 × 1 = ₱800.00
   - Discount: ₱800.00 × 5% = ₱40.00
   - Net: ₱800.00 - ₱40.00 = ₱760.00
   
   Item 2:
   - Subtotal: ₱1,200.00 × 2 = ₱2,400.00
   - Discount: ₱0.00
   - Net: ₱2,400.00
   ```

2. **VAT Calculations:**
   ```
   VATable Sales = ₱760.00 + ₱2,400.00 = ₱3,160.00
   VAT Amount = ₱3,160.00 × 12% = ₱379.20
   ```

3. **Total Calculations:**
   ```
   Subtotal (Before VAT) = ₱3,160.00
   Total VAT = ₱379.20
   Subtotal (After VAT) = ₱3,160.00 + ₱379.20 = ₱3,539.20
   
   Additional Charges = ₱150.00 + ₱50.00 = ₱200.00
   Total Discount = ₱40.00
   
   Gross Amount = ₱3,539.20 + ₱200.00 = ₱3,739.20
   Amount Due = ₱3,739.20
   ```

### Example 2: Mixed VAT Status Order

**Order Details:**
- Item 1: Book (₱500.00 × 1, VAT-Exempt)
- Item 2: Electronics (₱2,000.00 × 1, VATable, 8% discount)
- Item 3: Medicine (₱300.00 × 2, VAT-Exempt)
- Shipping: ₱120.00

**Step-by-Step Calculation:**

1. **Item Calculations:**
   ```
   Item 1 (VAT-Exempt):
   - Net: ₱500.00
   
   Item 2 (VATable):
   - Subtotal: ₱2,000.00
   - Discount: ₱2,000.00 × 8% = ₱160.00
   - Net: ₱2,000.00 - ₱160.00 = ₱1,840.00
   
   Item 3 (VAT-Exempt):
   - Net: ₱300.00 × 2 = ₱600.00
   ```

2. **VAT Calculations:**
   ```
   VATable Sales = ₱1,840.00
   VAT Amount = ₱1,840.00 × 12% = ₱220.80
   
   VAT-Exempt Sales = ₱500.00 + ₱600.00 = ₱1,100.00
   VAT on Exempt = ₱0.00
   ```

3. **Total Calculations:**
   ```
   Subtotal (Before VAT) = ₱1,840.00 + ₱1,100.00 = ₱2,940.00
   Total VAT = ₱220.80
   Subtotal (After VAT) = ₱2,940.00 + ₱220.80 = ₱3,160.80
   
   Additional Charges = ₱120.00
   Total Discount = ₱160.00
   
   Amount Due = ₱3,160.80 + ₱120.00 = ₱3,280.80
   ```

## Edge Cases

### 1. Zero Amount Orders

When the total discount equals or exceeds the subtotal:

```
If (Total Discount >= Subtotal + VAT + Shipping):
    Amount Due = ₱0.00
    Special Note: "Fully discounted order"
```

### 2. Refund Scenarios

For partial or full refunds:

```
Refund Amount = Original Amount × (Refund Percentage / 100)
VAT Refund = (Refund Amount / 1.12) × 0.12  // For VATable items
Net Refund = Refund Amount - VAT Refund
```

### 3. Multiple Currency Orders

When dealing with foreign currency:

```
PHP Amount = Foreign Amount × Exchange Rate
VAT Calculation = Proceed with PHP amounts using standard formula
```

## Implementation Details

### 1. Precision and Rounding

- All monetary calculations use **2 decimal places**
- Rounding method: **Round half up** (0.5 rounds up)
- Intermediate calculations may use higher precision, final amounts rounded to 2 decimals

```typescript
// Example rounding function
function roundCurrency(amount: number): number {
    return Math.round(amount * 100) / 100;
}
```

### 2. Data Structure Example

```typescript
interface InvoiceLineItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    discountPercentage: number;
    vatStatus: 'vatable' | 'exempt' | 'zero-rated';
    
    // Computed fields
    subtotal: number;
    discountAmount: number;
    netAmount: number;
    vatAmount: number;
}

interface InvoiceComputations {
    // Line items
    lineItems: InvoiceLineItem[];
    
    // Subtotals by VAT status
    vatableSales: number;
    vatExemptSales: number;
    zeroRatedSales: number;
    
    // VAT breakdown
    totalVatAmount: number;
    
    // Totals
    subtotalBeforeVat: number;
    subtotalAfterVat: number;
    totalDiscount: number;
    shippingAmount: number;
    totalFees: number;
    grossAmount: number;
    amountDue: number;
}
```

### 3. Validation Rules

1. **Amount Validations:**
   - All amounts must be non-negative
   - VAT amount cannot exceed 12% of VATable sales
   - Total discount cannot exceed gross amount

2. **Business Rules:**
   - VAT-exempt items: Books, medicines, basic commodities
   - Zero-rated items: Exports, certain services
   - VATable items: Most consumer goods

3. **Compliance Requirements:**
   - Must follow BIR (Bureau of Internal Revenue) regulations
   - Invoice sequence numbers must be continuous
   - VAT registration details must be included

## Error Handling

### Common Calculation Errors

1. **Division by Zero:**
   ```typescript
   // Always check for zero quantities or amounts
   if (quantity === 0) {
       throw new Error('Quantity cannot be zero');
   }
   ```

2. **Negative Amounts:**
   ```typescript
   // Validate non-negative amounts
   if (amount < 0) {
       throw new Error('Amount cannot be negative');
   }
   ```

3. **VAT Computation Errors:**
   ```typescript
   // Ensure VAT is only applied to VATable items
   if (item.vatStatus === 'vatable') {
       vatAmount = netAmount * 0.12;
   } else {
       vatAmount = 0;
   }
   ```

## Testing Scenarios

### Unit Test Cases

1. **Basic VATable Item:**
   - Input: ₱1,000 item, no discount
   - Expected VAT: ₱120.00
   - Expected Total: ₱1,120.00

2. **Discounted VATable Item:**
   - Input: ₱1,000 item, 10% discount
   - Expected Net: ₱900.00
   - Expected VAT: ₱108.00
   - Expected Total: ₱1,008.00

3. **Mixed VAT Status:**
   - Input: ₱500 VATable + ₱300 Exempt
   - Expected VAT: ₱60.00 (only on VATable)
   - Expected Total: ₱860.00

4. **Zero Amount Order:**
   - Input: 100% discount on all items
   - Expected Total: ₱0.00

## Related Files

- **Entity:** `libs/database-orderhub/src/sales_invoice/sales_invoice.entity.ts`
- **Service:** `libs/database-orderhub/src/sales_invoice/sales_invoice.service.ts`
- **Transformer:** `apps/tiktok-receipt/src/services/invoice-transformer.service.ts`
- **PDF Generator:** `apps/tiktok-receipt/src/services/pdf-generator.service.ts`

## References

- [BIR Revenue Regulations](https://www.bir.gov.ph/)
- [Philippine VAT Guidelines](https://www.bir.gov.ph/index.php/tax-information/value-added-tax.html)
- [E-Invoice Requirements](https://www.bir.gov.ph/index.php/electronic-filing.html)

---

**Last Updated:** July 4, 2025  
**Version:** 1.0  
**Maintained by:** Development Team
