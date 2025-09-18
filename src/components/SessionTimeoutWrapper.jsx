import React from "react";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
import SessionWarningModal from "./SessionWarningModal";

const SessionTimeoutWrapper = ({ children }) => {
  // Initialize session timeout for all authenticated users
  const {
    showWarning,
    warningTimeRemaining,
    handleExtendSession,
    handleLogout,
  } = useSessionTimeout();

  return (
    <>
      {children}
      <SessionWarningModal
        show={showWarning}
        timeRemaining={warningTimeRemaining}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </>
  );
};

export default SessionTimeoutWrapper;
