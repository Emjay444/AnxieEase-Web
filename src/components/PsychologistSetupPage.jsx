import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { psychologistAuthService } from "../services/psychologistAuthService";
import { psychologistService } from "../services/psychologistService";
import { psychologistSetupService } from "../services/psychologistSetupService";
import { immediatePasswordService } from "../services/immediatePasswordService";
import { directPasswordService } from "../services/directPasswordService";
import { supabase } from "../services/supabaseClient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";

const PsychologistSetupPage = () => {
  const { email, inviteCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: email || "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [passwordPreUpdated, setPasswordPreUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [source, setSource] = useState("invite");
  const [flowType, setFlowType] = useState("account_creation");

  // Password requirements checker
  const getPasswordRequirements = (pwd) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
  };

  // Check if all password requirements are met
  const isPasswordValid = (pwd) => {
    const requirements = getPasswordRequirements(pwd);
    return Object.values(requirements).every(req => req);
  };

  // After success, auto-redirect to login (except for verification which already redirects)
  useEffect(() => {
    if (showSuccessModal && flowType !== "email_verification") {
      const t = setTimeout(() => {
        navigate("/login");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [showSuccessModal, flowType, navigate]);

  useEffect(() => {
    const initializeSetup = async () => {
      try {
        console.log("🔧 Initializing psychologist setup...");
        console.log("🔗 Current URL:", window.location.href);
        console.log("🔑 URL Hash:", window.location.hash);

        // Mark that we're in the setup flow so other parts of the app avoid auto-signout checks
        try {
          localStorage.setItem("isInPsychologistSetupFlow", "true");
        } catch (_) {}

        // Handle magic link auth callback first (parse access_token from URL hash)
        let authCallbackData = null;
        let callbackError = null;

        if (
          window.location.hash &&
          window.location.hash.includes("access_token")
        ) {
          console.log("🔐 Processing magic link callback from URL hash...");

          // Parse the hash parameters manually since getSessionFromUrl is deprecated
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const expiresAt = hashParams.get("expires_at");

          if (accessToken && refreshToken) {
            // Persist tokens for later recovery in case the page reloads before submit
            try {
              localStorage.setItem("setupAccessToken", accessToken);
              localStorage.setItem("setupRefreshToken", refreshToken);
              if (expiresAt) localStorage.setItem("setupExpiresAt", expiresAt);
            } catch (_) {}

            // Set the session using the parsed tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            authCallbackData = data;
            callbackError = error;
            console.log("🔐 Magic link callback result:", { data, error });
          } else {
            console.log(
              "🔍 Hash present but no tokens found, checking existing session..."
            );
            const { data, error } = await supabase.auth.getSession();
            authCallbackData = data;
            callbackError = error;
          }

          // Clean the hash from the URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname + window.location.search
          );
        } else {
          console.log("🔍 No hash detected, checking existing session...");
          let { data, error } = await supabase.auth.getSession();
          authCallbackData = data;
          callbackError = error;
          console.log("🔍 Existing session result:", { data, error });

          // If no session, try to restore from stored magic-link tokens
          if (!data?.session) {
            try {
              const storedAccess = localStorage.getItem("setupAccessToken");
              const storedRefresh = localStorage.getItem("setupRefreshToken");
              if (storedAccess && storedRefresh) {
                console.log(
                  "🔄 Restoring session from stored magic-link tokens..."
                );
                const restore = await supabase.auth.setSession({
                  access_token: storedAccess,
                  refresh_token: storedRefresh,
                });
                authCallbackData = restore?.data;
                callbackError = restore?.error || null;
                console.log("🔄 Restore result:", restore);
              }
            } catch (e) {
              console.log("Restore failed:", e?.message);
            }
          }
        }

        if (callbackError) {
          console.error("❌ Auth callback error:", callbackError);
        }

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlEmail = urlParams.get("email");
        const urlPsychId = urlParams.get("psychologist_id");
        const urlSource = urlParams.get("source");
        const urlFlow = urlParams.get("flow");

        if (urlSource) setSource(urlSource);
        if (urlFlow) setFlowType(urlFlow);

        console.log("🔍 Detected flow type:", urlFlow || "account_creation");
        console.log("🔍 Detected source:", urlSource || "invite");

        // Handle email verification flow - just verify and redirect
        if (urlFlow === "email_verification") {
          console.log("📧 Email verification flow detected");

          // If we have a valid session from the magic link, the email is verified
          if (authCallbackData?.session) {
            console.log(
              "✅ Email verified successfully for:",
              authCallbackData.session.user.email
            );

            // Show success and redirect
            setShowSuccessModal(true);
            setTimeout(() => {
              navigate("/login");
            }, 3000);
            setLoading(false);
            return;
          }
        }

        let workingEmail = null;
        let psychologistId = null;

        // Try to get session and email from multiple sources
        const currentSession = authCallbackData?.session;

        if (currentSession && currentSession.user.email) {
          workingEmail = currentSession.user.email;
          setSessionData(currentSession);

          console.log("Found active session for:", workingEmail);

          // Debug: Log session details
          console.log("🔍 DEBUG: Active session details:", {
            userId: currentSession.user.id,
            email: currentSession.user.email,
            hasValidSession: !!currentSession.access_token,
          });

          // Store session data for persistence
          localStorage.setItem("setupEmail", workingEmail);

          // Store the complete session object for later use
          if (currentSession.access_token && currentSession.refresh_token) {
            // Store the session data in a way that won't be affected by auth state changes
            const sessionForSetup = {
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
              user: {
                id: currentSession.user.id,
                email: currentSession.user.email,
              },
              expires_at: currentSession.expires_at,
            };
            localStorage.setItem(
              "psychologistSetupSession",
              JSON.stringify(sessionForSetup)
            );
            console.log("🔒 Stored complete session for setup persistence");
            // Also keep in state
            setSessionData(sessionForSetup);
          }

          // Try to update psychologist user_id
          try {
            console.log(
              "🔄 Updating psychologist user_id for:",
              workingEmail,
              "->",
              currentSession.user.id
            );
            const updateResult =
              await psychologistService.updatePsychologistUserId(
                workingEmail,
                currentSession.user.id
              );
            console.log(
              "✅ Successfully updated psychologist user_id:",
              updateResult
            );
          } catch (updateError) {
            console.error(
              "❌ Failed to update psychologist user_id:",
              updateError
            );
            // Don't fail the entire flow just because of this - psychologist might still exist
          }

          // Debug: Verify session is still available after setup
          console.log("🔍 DEBUG: Session after user_id update:", {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
            email: currentSession?.user?.email,
          });
        } else {
          // Fallback to URL params or localStorage
          workingEmail = urlEmail || localStorage.getItem("setupEmail");
          psychologistId =
            urlPsychId || localStorage.getItem("setupPsychologistId");

          console.log(
            "No active session found, using fallback email:",
            workingEmail
          );
        }

        // Set the email in the form
        setFormData((prev) => ({
          ...prev,
          email: workingEmail || "",
        }));

        // Store email for later use even if session is lost
        if (workingEmail) {
          localStorage.setItem("setupEmail", workingEmail);
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Setup initialization error:", error);

        // Try to recover email from localStorage as last resort
        const storedEmail = localStorage.getItem("setupEmail");
        if (storedEmail) {
          console.log("🔄 Recovering email from localStorage:", storedEmail);
          setFormData((prev) => ({
            ...prev,
            email: storedEmail,
          }));

          // If we have a stored email, don't show the full error - allow them to try setup
          setLoading(false);
          return;
        }

        // Only show error if we couldn't recover any email
        console.error("❌ Could not recover setup session or email");
        setErrors({
          general:
            "Setup session could not be verified. This might happen if:\n" +
            "• The setup link has expired (links expire after 24 hours)\n" +
            "• You're already logged in as another user\n" +
            "• The link was already used\n\n" +
            "Please request a new setup link from your administrator or try opening the link in a private/incognito browser window.",
        });
        setLoading(false);
      }
    };

    initializeSetup();
  }, [email, inviteCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isPasswordValid(formData.password)) {
      newErrors.password = "Password does not meet all requirements";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Debug: Check current session state before submit
      console.log("🔍 DEBUG: Session state at form submit:", {
        sessionData: !!sessionData,
        sessionUserId: sessionData?.user?.id,
        sessionEmail: sessionData?.user?.email,
      });

      // Also check what supabase says about current session
      const { data: currentCheck } = await supabase.auth.getSession();
      console.log("🔍 DEBUG: Current supabase session at submit:", {
        hasSession: !!currentCheck?.session,
        userId: currentCheck?.session?.user?.id,
        email: currentCheck?.session?.user?.email,
      });

      // If AuthContext signed out the user but we have stored tokens, don't restore here
      // Instead, pass the session data directly to the service
      if (!currentCheck?.session && sessionData?.access_token) {
        console.log(
          "🔄 Session not active, will pass stored session to service..."
        );
      }

      // Try direct API approach first (bypasses session issues)
      if (
        (sessionData?.access_token &&
          sessionData?.refresh_token &&
          sessionData?.user?.id) ||
        (localStorage.getItem("setupAccessToken") &&
          localStorage.getItem("setupRefreshToken"))
      ) {
        console.log("🔄 Attempting direct API setup completion...");
        try {
          const access =
            sessionData?.access_token ||
            localStorage.getItem("setupAccessToken");
          const refresh =
            sessionData?.refresh_token ||
            localStorage.getItem("setupRefreshToken");
          const userId =
            sessionData?.user?.id || currentCheck?.session?.user?.id;
          await directPasswordService.completeSetupDirectly(
            formData.email,
            formData.password,
            access,
            refresh,
            userId
          );

          console.log("✅ Setup completed successfully via direct API");

          // Clear setup data from localStorage
          await psychologistSetupService.cleanupSetupSession();

          // Clear password update flags
          immediatePasswordService.clearPasswordUpdatedFlag();

          // Success! Show success modal
          setShowSuccessModal(true);
          return; // Exit early on success
        } catch (directError) {
          console.error("❌ Direct API setup failed:", directError);
          // Fall back to regular service
        }
      }

      // Fallback: Use the regular setup service
      console.log("🔄 Falling back to regular setup service...");

      // Check if password was already updated, if so, skip password update in service
      if (passwordPreUpdated) {
        console.log(
          "✅ Password was already updated, proceeding with account activation only"
        );
      }

      // Use the dedicated setup service to complete setup
      await psychologistSetupService.completeSetup(
        formData.email,
        passwordPreUpdated ? null : formData.password, // Pass null if already updated
        sessionData,
        flowType
      );

      // Clear setup data from localStorage
      await psychologistSetupService.cleanupSetupSession();

      // Clear password update flags
      immediatePasswordService.clearPasswordUpdatedFlag();

      // Success! Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Setup error:", error);
      setErrors({
        general:
          error.message ||
          "Failed to complete account setup. Please try again.",
      });
    } finally {
      setLoading(false);
      // Clear the setup flow flag once we're done interacting
      try {
        localStorage.removeItem("isInPsychologistSetupFlow");
      } catch (_) {}
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle password input and update immediately if we have a session
  const handlePasswordChange = async (e) => {
    const newPassword = e.target.value;
    setFormData((prev) => ({ ...prev, password: newPassword }));

    // If password is at least 6 characters and we have session data, update immediately
    if (newPassword.length >= 6 && sessionData && !passwordPreUpdated) {
      try {
        console.log("🔄 Attempting immediate password update...");
        await immediatePasswordService.updatePasswordImmediately(
          newPassword,
          formData.email
        );
        setPasswordPreUpdated(true);
        console.log("✅ Password updated immediately during typing");
      } catch (error) {
        console.warn(
          "⚠️ Immediate password update failed, will try again on submit:",
          error.message
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative">
      {/* Floating shapes for enhanced animation */}
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with AnxieEase branding */}
        <div className="text-center mb-8">
          <img
            src="/anxieease-logo.png"
            alt="AnxieEase"
            className="mx-auto mb-3 h-16 w-16 drop-shadow-lg logo-breathe"
          />
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Anxie<span className="text-emerald-300">Ease</span>
          </h1>
          <p className="mt-1 text-emerald-100/90 drop-shadow-sm">
            {flowType === "password_reset"
              ? "Set a new password to secure your account"
              : flowType === "account_creation"
              ? "Complete your psychologist account setup"
              : "Set up your account"}
          </p>
        </div>

        {/* Setup Form */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Email Info */}
          <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  {flowType === "password_reset"
                    ? "Resetting password for:"
                    : "Setting up account for:"}
                </p>
                <p className="text-sm text-emerald-600 font-semibold">
                  {formData.email}
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              {flowType === "password_reset"
                ? "This secure link lets you set a new password."
                : "This email was invited by an administrator"}
            </p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-4 border rounded-lg flex items-center gap-2 bg-red-50 border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <span className="text-red-700">{errors.general}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field (disabled) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => {
                    handleInputChange(e);
                    handlePasswordChange(e);
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Password Requirements List */}
              {formData.password && (
                <div className="mt-3 p-3 bg-white/50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                  <ul className="space-y-1">
                    {[
                      { key: 'length', text: 'At least 8 characters' },
                      { key: 'uppercase', text: 'One uppercase letter (A-Z)' },
                      { key: 'lowercase', text: 'One lowercase letter (a-z)' },
                      { key: 'number', text: 'One number (0-9)' },
                      { key: 'special', text: 'One special character (!@#$%^&*)' }
                    ].map(requirement => {
                      const isValid = getPasswordRequirements(formData.password)[requirement.key];
                      return (
                        <li key={requirement.key} className="flex items-center text-sm">
                          <span className={`mr-2 font-bold ${isValid ? 'text-green-500' : 'text-gray-400'}`}>
                            {isValid ? '✓' : '○'}
                          </span>
                          <span className={isValid ? 'text-green-700 font-medium' : 'text-gray-600'}>
                            {requirement.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                  placeholder="Confirm your password"
                />
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center text-sm">
                  <span className={`mr-2 font-bold ${
                    formData.password === formData.confirmPassword ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formData.password === formData.confirmPassword ? '✓' : '✗'}
                  </span>
                  <span className={formData.password === formData.confirmPassword ? 'text-green-700 font-medium' : 'text-red-600'}>
                    {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
              
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid(formData.password) || formData.password !== formData.confirmPassword}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition duration-200 ${
                loading || !isPasswordValid(formData.password) || formData.password !== formData.confirmPassword
                  ? "bg-gray-400 cursor-not-allowed"
                  : "btn-gradient hover:shadow-lg transform hover:scale-[1.02]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="text-sm font-semibold text-emerald-800 mb-2">
              🔐 Setup Instructions:
            </h4>
            <ul className="text-xs text-emerald-700 space-y-1">
              <li>• Create a secure password (minimum 8 characters with uppercase, lowercase, numbers, and special characters)</li>
              <li>• You'll be able to log in after completing setup</li>
              <li>• If you encounter issues, contact your administrator</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

          {/* Modal content */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20">
            <div className="p-8">
              {/* Success icon and title */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {flowType === "email_verification"
                    ? "📧 Email Verified!"
                    : "🎉 Setup Complete!"}
                </h3>
                <p className="text-gray-600">
                  {flowType === "email_verification"
                    ? "Your new email address has been successfully verified."
                    : "Your psychologist account has been successfully set up."}
                </p>
              </div>

              {/* Success message */}
              <div className="mb-8">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-emerald-800">
                      <p className="font-medium mb-2">
                        {flowType === "email_verification"
                          ? "Email Change Complete:"
                          : "What's Next:"}
                      </p>
                      <ul className="space-y-1">
                        {flowType === "email_verification" ? (
                          <>
                            <li>✅ Your email address has been updated</li>
                            <li>
                              ✅ You can continue using your account normally
                            </li>
                            <li>✅ Use your new email for future logins</li>
                          </>
                        ) : (
                          <>
                            <li>✅ Your account is now active</li>
                            <li>
                              ✅ You can log in with your email and password
                            </li>
                            <li>
                              ✅ Start managing your patients and appointments
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/login");
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Continue to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychologistSetupPage;
