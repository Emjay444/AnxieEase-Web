import { useEffect, useCallback, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity
const WARNING_TIME = 2 * 60 * 1000; // show warning 2 minutes before timeout
export const WARNING_SECONDS = WARNING_TIME / 1000;

// Broadcasts activity across tabs (same origin, via the storage event) so
// an idle tab doesn't sign out a session the user is actively using in a
// different tab.
const ACTIVITY_STORAGE_KEY = "anxieease_lastActivity";

const isDevelopment = import.meta.env.DEV;

export const useSessionTimeout = () => {
  const { user, signOut } = useAuth();
  const userId = user?.id; // primitive - stable across token refreshes,
  // unlike `user` itself, which is a new object on every refresh

  const preWarningTimerRef = useRef(null);
  const warningIntervalRef = useRef(null);
  const showWarningRef = useRef(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(WARNING_SECONDS);

  // Set synchronously alongside setShowWarning (not via a separate effect
  // watching `showWarning`) so the DOM activity handler below always reads
  // the current value immediately - no render-cycle gap where it's stale.
  const setShowWarningSynced = useCallback((value) => {
    showWarningRef.current = value;
    setShowWarning(value);
  }, []);

  const clearTimers = useCallback(() => {
    if (preWarningTimerRef.current) {
      clearTimeout(preWarningTimerRef.current);
      preWarningTimerRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
  }, []);

  // The single place that actually ends the session. Both the warning
  // countdown reaching zero and the modal's "Logout Now" button funnel
  // through here - there is no second, independent timer racing it.
  const performLogout = useCallback(async () => {
    clearTimers();
    setShowWarningSynced(false);
    if (isDevelopment) {
      console.log("Session expired due to inactivity");
    }
    try {
      await signOut();
    } catch (err) {
      console.error("Auto-logout sign-out failed:", err?.message);
    }
  }, [signOut, clearTimers, setShowWarningSynced]);

  // Enter the warning stage: a single ticking interval owns the visible
  // countdown AND the decision to log out at zero.
  const startWarningCountdown = useCallback(() => {
    clearTimers();
    if (isDevelopment) {
      console.log("Session will expire in 2 minutes due to inactivity");
    }
    setShowWarningSynced(true);
    let secondsLeft = WARNING_SECONDS;
    setWarningSecondsLeft(secondsLeft);

    warningIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        performLogout();
        return;
      }
      setWarningSecondsLeft(secondsLeft);
    }, 1000);
  }, [clearTimers, performLogout, setShowWarningSynced]);

  // Back to "active" stage: no warning showing, schedule the pre-warning
  // timer for SESSION_TIMEOUT - WARNING_TIME from now.
  const resetToActiveStage = useCallback(() => {
    clearTimers();
    setShowWarningSynced(false);
    preWarningTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, SESSION_TIMEOUT - WARNING_TIME);
  }, [clearTimers, startWarningCountdown, setShowWarningSynced]);

  // `broadcast` writes to localStorage so other tabs see this activity too.
  // Pass false when reacting to another tab's broadcast, to avoid an
  // infinite ping-pong of storage writes between tabs.
  const recordActivity = useCallback(
    (broadcast = true) => {
      if (!userId) return;
      if (broadcast) {
        try {
          localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()));
        } catch (_) {
          // localStorage unavailable (e.g. private mode) - cross-tab sync
          // degrades gracefully to per-tab only.
        }
      }
      resetToActiveStage();
    },
    [userId, resetToActiveStage]
  );

  useEffect(() => {
    if (!userId) {
      clearTimers();
      setShowWarningSynced(false);
      return;
    }

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    let throttleTimeout = null;
    const handleDomActivity = () => {
      // Once the warning is up, require an explicit "Stay Logged In" click
      // (handleExtendSession) instead of letting incidental mouse movement
      // toward the modal silently dismiss a security warning.
      if (showWarningRef.current) return;
      if (!throttleTimeout) {
        recordActivity(true);
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, handleDomActivity, true);
    });

    // Another tab recorded activity - the session is demonstrably alive,
    // so treat it the same as local activity (including dismissing a
    // warning showing in this idle tab).
    const handleStorageActivity = (e) => {
      if (e.key === ACTIVITY_STORAGE_KEY) {
        recordActivity(false);
      }
    };
    window.addEventListener("storage", handleStorageActivity);

    // Start the cycle for this mount/user.
    resetToActiveStage();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleDomActivity, true);
      });
      window.removeEventListener("storage", handleStorageActivity);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      clearTimers();
    };
    // `recordActivity`/`resetToActiveStage`/`clearTimers` are stable across
    // re-renders (they only change identity if `userId` or `signOut`
    // itself changes), so this effect - and the timers it starts - aren't
    // reset by unrelated AuthProvider re-renders such as a token refresh.
  }, [userId, recordActivity, resetToActiveStage, clearTimers, setShowWarningSynced]);

  const handleExtendSession = useCallback(() => {
    recordActivity(true);
  }, [recordActivity]);

  const handleLogout = useCallback(() => {
    performLogout();
  }, [performLogout]);

  return {
    showWarning,
    warningSecondsLeft,
    handleExtendSession,
    handleLogout,
  };
};
