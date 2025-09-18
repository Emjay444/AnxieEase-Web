// Session Timeout Testing Utility
// This file provides functions to test the session timeout functionality

export const sessionTestUtils = {
  // Reduce session timeout for testing (5 seconds instead of 15 minutes)
  enableTestMode: () => {
    // This would require modifying the hook to accept configuration
    console.log("Test mode would set session timeout to 5 seconds for testing");
  },

  // Force trigger the warning modal
  triggerWarning: () => {
    const event = new CustomEvent("session-warning-test");
    window.dispatchEvent(event);
  },

  // Force trigger session expiry
  triggerExpiry: () => {
    const event = new CustomEvent("session-expiry-test");
    window.dispatchEvent(event);
  },

  // Log current session state
  logSessionState: () => {
    console.log("Session state:", {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  },
};

// Development helper: Add to window object for console testing
if (import.meta.env.DEV) {
  window.sessionTestUtils = sessionTestUtils;
}
