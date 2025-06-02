// Get status badge class
export function getStatusBadgeClass(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('delivered') || statusLower.includes('completed')) {
    return 'bg-green-100 text-green-800';
  } else if (statusLower.includes('shipped') || statusLower.includes('transit')) {
    return 'bg-blue-100 text-blue-800';
  } else if (statusLower.includes('processing') || statusLower.includes('pending')) {
    return 'bg-yellow-100 text-yellow-800';
  } else if (statusLower.includes('cancelled') || statusLower.includes('failed')) {
    return 'bg-red-100 text-red-800';
  } else {
    return 'bg-gray-100 text-gray-800';
  }
}

// Format date
export function formatDate(dateString: string | number): string {
  try {
    let timestamp = dateString;
    
    // If it's a string, check if it's ISO 8601 format first
    if (typeof dateString === 'string') {
      // Check if it's an ISO 8601 date string (contains 'T' or 'Z')
      if (dateString.includes('T') || dateString.includes('Z') || dateString.includes('-')) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
      }
      
      // Try to parse it as a number (Unix timestamp)
      const parsed = parseInt(dateString, 10);
      if (!isNaN(parsed)) {
        timestamp = parsed;
      }
    }
    
    // Handle Unix timestamps (seconds) - convert to milliseconds
    if (typeof timestamp === 'number' && timestamp < 1e12) {
      timestamp = timestamp * 1000;
    }
    
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return String(dateString);
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateString);
  }
}

// Format currency
export function formatCurrency(amount: number | string | undefined, currency: string = ''): string {
  if (!amount) return 'N/A';
  
  const num = parseFloat(String(amount));
  if (isNaN(num)) return String(amount);
  
  return `${currency} ${num.toFixed(2)}`.trim();
}
