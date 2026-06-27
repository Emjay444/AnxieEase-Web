import React from "react";

// Full-screen transition shown during login and when switching between
// admin/psychologist views on a dual-access account. `animated-bg`
// hardcodes position:relative, so it can't share an element with the
// `fixed` utility (cascade order would let the custom rule win) - split
// into a fixed outer wrapper and an inner div that just fills it.
const TransitionOverlay = ({ title = "Welcome back!", subtitle }) => (
  <div className="fixed inset-0 z-50 transition-overlay">
    <div className="animated-bg w-full h-full flex items-center justify-center">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <div className="text-center relative z-10">
        <img
          src="/anxieease-logo.png"
          alt="AnxieEase"
          className="mx-auto mb-4 h-20 w-20 drop-shadow-lg transition-logo-pop"
        />
        <h2 className="text-2xl font-bold text-white drop-shadow-lg transition-text">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-emerald-100/90 transition-text">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

export default TransitionOverlay;
