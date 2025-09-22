// Data formatting utilities for the admin dashboard

/**
 * Format timestamp to human-readable time
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Format timestamp to human-readable date
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const now = new Date();
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  return formatDate(timestamp);
};

/**
 * Format duration in milliseconds to human-readable format
 */
export const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format percentage with optional decimal places
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format currency values
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
};

/**
 * Format sensor data values with appropriate units and precision
 */
export const formatSensorData = {
  heartRate: (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${Math.round(value)} BPM`;
  },
  
  skinConductance: (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${Number(value).toFixed(3)} μS`;
  },
  
  bodyTemperature: (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${Number(value).toFixed(1)}°C`;
  },
  
  batteryLevel: (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${Math.round(value)}%`;
  },
  
  accelerometer: (value) => {
    if (!value || typeof value !== 'object') return 'N/A';
    const { x = 0, y = 0, z = 0 } = value;
    return `X:${Number(x).toFixed(2)}, Y:${Number(y).toFixed(2)}, Z:${Number(z).toFixed(2)}`;
  }
};

/**
 * Format device status for display
 */
export const formatDeviceStatus = (status) => {
  const statusMap = {
    online: { label: 'Online', color: 'green' },
    offline: { label: 'Offline', color: 'gray' },
    active: { label: 'Active', color: 'green' },
    inactive: { label: 'Inactive', color: 'gray' },
    available: { label: 'Available', color: 'blue' },
    assigned: { label: 'Assigned', color: 'emerald' },
    error: { label: 'Error', color: 'red' }
  };
  
  return statusMap[status] || { label: status || 'Unknown', color: 'gray' };
};

/**
 * Format user roles for display
 */
export const formatUserRole = (role) => {
  const roleMap = {
    admin: 'Administrator',
    psychologist: 'Psychologist',
    patient: 'Patient',
    user: 'User'
  };
  
  return roleMap[role] || 'User';
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Parse and validate email addresses
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Parse and format phone numbers
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if format not recognized
};

/**
 * Color utilities for charts and data visualization
 */
export const colorPalette = {
  primary: 'rgba(16, 185, 129, 1)',      // emerald-500
  primaryLight: 'rgba(16, 185, 129, 0.5)',
  secondary: 'rgba(59, 130, 246, 1)',     // blue-500
  secondaryLight: 'rgba(59, 130, 246, 0.5)',
  accent: 'rgba(236, 72, 153, 1)',        // pink-500
  accentLight: 'rgba(236, 72, 153, 0.5)',
  warning: 'rgba(245, 158, 11, 1)',       // amber-500
  warningLight: 'rgba(245, 158, 11, 0.5)',
  danger: 'rgba(239, 68, 68, 1)',         // red-500
  dangerLight: 'rgba(239, 68, 68, 0.5)',
  success: 'rgba(34, 197, 94, 1)',        // green-500
  successLight: 'rgba(34, 197, 94, 0.5)',
  gray: 'rgba(156, 163, 175, 1)',         // gray-400
  grayLight: 'rgba(156, 163, 175, 0.5)'
};

/**
 * Generate color array for charts
 */
export const generateColors = (count, opacity = 0.8) => {
  const baseColors = [
    `rgba(16, 185, 129, ${opacity})`,   // emerald
    `rgba(59, 130, 246, ${opacity})`,   // blue
    `rgba(236, 72, 153, ${opacity})`,   // pink
    `rgba(245, 158, 11, ${opacity})`,   // amber
    `rgba(139, 92, 246, ${opacity})`,   // violet
    `rgba(34, 197, 94, ${opacity})`,    // green
    `rgba(239, 68, 68, ${opacity})`,    // red
    `rgba(6, 182, 212, ${opacity})`     // cyan
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

/**
 * Data validation utilities
 */
export const validateSensorReading = (reading) => {
  if (!reading || typeof reading !== 'object') return false;
  
  const { heartRate, skinConductance, bodyTemperature } = reading;
  
  // Validate heart rate (30-250 BPM is physiologically possible)
  if (heartRate !== undefined && (isNaN(heartRate) || heartRate < 30 || heartRate > 250)) {
    return false;
  }
  
  // Validate skin conductance (0-2 μS is typical range)
  if (skinConductance !== undefined && (isNaN(skinConductance) || skinConductance < 0 || skinConductance > 2)) {
    return false;
  }
  
  // Validate body temperature (32-42°C is viable range)
  if (bodyTemperature !== undefined && (isNaN(bodyTemperature) || bodyTemperature < 32 || bodyTemperature > 42)) {
    return false;
  }
  
  return true;
};

/**
 * Calculate statistics for arrays of numbers
 */
export const calculateStats = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 };
  }
  
  const validNumbers = numbers.filter(n => !isNaN(n) && n !== null && n !== undefined);
  if (validNumbers.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 };
  }
  
  const sorted = [...validNumbers].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = validNumbers.reduce((sum, n) => sum + n, 0) / validNumbers.length;
  
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    avg: Number(avg.toFixed(2)),
    median: Number(median.toFixed(2))
  };
};

export default {
  formatTime,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatFileSize,
  formatPercentage,
  formatCurrency,
  formatNumber,
  formatSensorData,
  formatDeviceStatus,
  formatUserRole,
  capitalizeWords,
  truncateText,
  isValidEmail,
  formatPhoneNumber,
  colorPalette,
  generateColors,
  validateSensorReading,
  calculateStats
};