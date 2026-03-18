/**
 * Date utilities for the Billing History Date Range system.
 */

// Default billing start time is 6:00 AM (360 minutes from midnight)
export const DEFAULT_BILLING_START_TIME = 360;

/**
 * Gets the start and end Unix timestamps for a given date selection,
 * applying the restaurant's business day offset.
 * 
 * @param date The selected date (at midnight)
 * @param billingStartTime Minutes from midnight when the business day starts
 */
export function getBusinessDayRange(date: Date, billingStartTime: number = DEFAULT_BILLING_START_TIME) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setMinutes(billingStartTime);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  // Business day ends when the next one starts
  
  return {
    from: start.getTime(),
    to: end.getTime() - 1,
  };
}

/**
 * Calculates the Unix timestamp range for a specific preset.
 */
export function getRangeForPreset(preset: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth', billingStartTime: number = DEFAULT_BILLING_START_TIME) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  // If current time is before billingStartTime, "today"'s business day actually started yesterday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (currentMinutes < billingStartTime) {
    todayStart.setDate(todayStart.getDate() - 1);
  }

  switch (preset) {
    case 'today':
      return getBusinessDayRange(todayStart, billingStartTime);
      
    case 'yesterday': {
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      return getBusinessDayRange(yesterday, billingStartTime);
    }
    
    case 'thisWeek': {
      const day = todayStart.getDay();
      const diff = todayStart.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      const weekStart = new Date(todayStart);
      weekStart.setDate(diff);
      
      const start = new Date(weekStart);
      start.setMinutes(billingStartTime);
      
      const end = new Date(todayStart);
      end.setDate(end.getDate() + 1);
      end.setMinutes(billingStartTime);
      
      return { from: start.getTime(), to: end.getTime() - 1 };
    }
    
    case 'thisMonth': {
      const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      const start = new Date(monthStart);
      start.setMinutes(billingStartTime);
      
      const end = new Date(todayStart);
      end.setDate(end.getDate() + 1);
      end.setMinutes(billingStartTime);
      
      return { from: start.getTime(), to: end.getTime() - 1 };
    }
  }
}

/**
 * Formats a Unix timestamp for display (e.g., "18-Mar-2026").
 */
export function formatDate(timestamp: number) {
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

/**
 * Validates a custom range.
 */
export function validateRange(from: number, to: number) {
  // Sequence check
  if (to < from) return { valid: false, error: 'End date cannot be before start date' };
  
  // 6-month limit (180 days)
  const diffDays = (to - from) / (1000 * 60 * 60 * 24);
  if (diffDays > 180) return { valid: false, error: 'Range cannot exceed 6 months (180 days)' };
  
  // Future block
  if (from > Date.now()) return { valid: false, error: 'Cannot select future dates' };
  
  return { valid: true };
}
