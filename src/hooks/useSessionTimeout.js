import { useEffect, useCallback, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds (back to original)
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout (back to original)

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development";

export const useSessionTimeout = () => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [warningTimeRemaining, setWarningTimeRemaining] = useState(0);

  // Activity handler (safe version that doesn't trigger auth changes)
  const handleActivity = useCallback(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();
    setShowWarning(false);

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning timer (13 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      if (isDevelopment) {
        console.log("Session will expire in 2 minutes due to inactivity");
      }
      setShowWarning(true);
      setWarningTimeRemaining(WARNING_TIME);
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer (15 minutes)
    timeoutRef.current = setTimeout(() => {
      if (isDevelopment) {
        console.log("Session expired due to inactivity");
      }
      setShowWarning(false);
      signOut();
    }, SESSION_TIMEOUT);
  }, [user, signOut, isDevelopment]);

  useEffect(() => {
    if (user) {
      // Events that indicate user activity
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ];

      // Throttle the activity handler to avoid excessive timer resets
      let throttleTimeout = null;
      const throttledActivityHandler = () => {
        if (!throttleTimeout) {
          handleActivity();
          throttleTimeout = setTimeout(() => {
            throttleTimeout = null;
          }, 1000); // Throttle to once per second
        }
      };

      // Add event listeners
      events.forEach((event) => {
        document.addEventListener(event, throttledActivityHandler, true);
      });

      // Initialize timer (safe version)
      handleActivity();

      // Cleanup
      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, throttledActivityHandler, true);
        });

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        if (throttleTimeout) {
          clearTimeout(throttleTimeout);
        }
      };
    }
  }, [user, handleActivity]);

  // Disable focus/visibility handlers to prevent tab switching issues
  // Session timeout will only reset on actual user activity (mouse/keyboard)
  useEffect(() => {
    if (isDevelopment) {
      console.log(
        "🔒 [DEV] Focus/visibility handlers disabled to prevent tab reload issues"
      );
    }
    // No focus/visibility event listeners - only mouse/keyboard activity resets timer
  }, [user, isDevelopment]);

  const handleExtendSession = useCallback(() => {
    handleActivity();
  }, [handleActivity]);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    signOut();
  }, [signOut]);

  return {
    showWarning,
    warningTimeRemaining,
    handleExtendSession,
    handleLogout,
    getTimeUntilExpiry: () => {
      if (!user) return null;
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, SESSION_TIMEOUT - elapsed);
    },
  };
};
