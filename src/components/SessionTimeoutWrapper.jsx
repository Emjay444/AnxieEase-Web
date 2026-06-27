import React from "react";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
import SessionWarningModal from "./SessionWarningModal";

const SessionTimeoutWrapper = ({ children }) => {
  // Initialize session timeout for all authenticated users
  const {
    showWarning,
    warningSecondsLeft,
    handleExtendSession,
    handleLogout,
  } = useSessionTimeout();

  return (
    <>
      {children}
      <SessionWarningModal
        show={showWarning}
        secondsLeft={warningSecondsLeft}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  );
};

export default SessionTimeoutWrapper;
