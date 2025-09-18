import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout

export const useSessionTimeout = () => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [warningTimeRemaining, setWarningTimeRemaining] = useState(0);

  // Reset the timer
  const resetTimer = useCallback(() => {
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
      console.log('Session will expire in 2 minutes due to inactivity');
      setShowWarning(true);
      setWarningTimeRemaining(WARNING_TIME);
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set logout timer (15 minutes)
    timeoutRef.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      setShowWarning(false);
      signOut();
    }, SESSION_TIMEOUT);
  }, [user, signOut]);

  // Activity handler
  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (user) {
      // Events that indicate user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

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
      events.forEach(event => {
        document.addEventListener(event, throttledActivityHandler, true);
      });

      // Initialize timer
      resetTimer();

      // Cleanup
      return () => {
        events.forEach(event => {
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
  }, [user, handleActivity, resetTimer]);

  // Check for activity when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        
        // If more than 15 minutes have passed, sign out
        if (timeSinceLastActivity > SESSION_TIMEOUT) {
          console.log('Session expired while window was not focused');
          signOut();
        } else {
          // Reset timer if still within timeout period
          resetTimer();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, signOut, resetTimer]);

  const handleExtendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    signOut();
  }, [signOut]);

  return {
    resetTimer,
    showWarning,
    warningTimeRemaining,
    handleExtendSession,
    handleLogout,
    getTimeUntilExpiry: () => {
      if (!user) return null;
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, SESSION_TIMEOUT - elapsed);
    }
  };
};