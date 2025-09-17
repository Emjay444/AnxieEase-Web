import { clsx } from "clsx";

/**
 * Utility function to combine class names conditionally
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Format date to a readable string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Date(date).toLocaleDateString("en-US", defaultOptions);
}

/**
 * Format time to a readable string
 */
export function formatTime(date, options = {}) {
  const defaultOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  return new Date(date).toLocaleTimeString("en-US", defaultOptions);
}

/**
 * Format date and time to a readable string
 */
export function formatDateTime(date) {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  return formatDate(date);
}

/**
 * Truncate text to a certain length
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Generate full name from individual name fields
 */
export function getFullName(person) {
  if (!person) return "Unknown";

  // If there's already a name field, use it
  if (person.name) return person.name;

  // Otherwise, construct from individual fields
  const parts = [];
  if (person.first_name) parts.push(person.first_name);
  if (person.middle_name) parts.push(person.middle_name);
  if (person.last_name) parts.push(person.last_name);

  const fullName = parts.join(" ").trim();

  // Fallback to email prefix if no name available
  return fullName || person.email?.split("@")[0] || "Unknown";
}

/**
 * Generate initials from a name
 */
export function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
}

/**
 * Get status color based on status type
 */
export function getStatusColor(status) {
  const statusColors = {
    active: "text-green-700 bg-green-100",
    inactive: "text-gray-700 bg-gray-100",
    pending: "text-yellow-700 bg-yellow-100",
    suspended: "text-red-700 bg-red-100",
    excellent: "text-green-700 bg-green-100",
    improving: "text-blue-700 bg-blue-100",
    stable: "text-yellow-700 bg-yellow-100",
    declining: "text-red-700 bg-red-100",
  };

  return statusColors[status.toLowerCase()] || "text-gray-700 bg-gray-100";
}

/**
 * Get anxiety level color
 */
export function getAnxietyLevelColor(level) {
  if (level <= 3) return "text-green-600";
  if (level <= 6) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Debounce function for search inputs
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate random avatar URL or initials
 */
export function generateAvatar(name, size = 150) {
  // Create a more reliable avatar using multiple fallback services
  const initials = getInitials(name);
  const encodedName = encodeURIComponent(name || "User");

  // Use DiceBear as primary (more reliable than ui-avatars)
  // Fallback to ui-avatars if needed
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedName}&backgroundColor=10b981&textColor=ffffff&fontSize=40`;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Generate a random ID
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
