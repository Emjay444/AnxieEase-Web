import { useState, useEffect, memo } from "react";

const AddDoctorModal = memo(({ show, onClose, onSave, isLoading = false }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    birthdate: "",
    licenseNumber: "",
    email: "",
    contact: "",
    sex: "",
    dateRegistered: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [validationSummary, setValidationSummary] = useState([]);

  useEffect(() => {
    // Reset form when modal is opened
    if (show) {
      setFormData({
        firstName: "",
        lastName: "",
        middleName: "",
        birthdate: "",
        licenseNumber: "",
        email: "",
        contact: "",
        sex: "",
        dateRegistered: new Date().toISOString().split("T")[0],
      });
      setErrors({});
      setStep(1);
      setValidationSummary([]);
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Apply phone number formatting for contact field
    if (name === "contact") {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Strip all non-numeric characters
    const phoneNumber = value.replace(/\D/g, "");

    // Format based on length
    if (phoneNumber.length < 4) {
      return phoneNumber;
    } else if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
        3,
        6
      )}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const summaryErrors = [];

    // Step 1 validation
    if (step === 1 || step === 2) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First Name is required";
        summaryErrors.push("First Name is required");
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last Name is required";
        summaryErrors.push("Last Name is required");
      }

      if (!formData.birthdate) {
        newErrors.birthdate = "Birthdate is required";
        summaryErrors.push("Birthdate is required");
      } else {
        const birthDate = new Date(formData.birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        if (age < 18) {
          newErrors.birthdate = "Must be at least 18 years old";
          summaryErrors.push("Must be at least 18 years old");
        } else if (age > 100) {
          newErrors.birthdate = "Invalid birthdate";
          summaryErrors.push("Invalid birthdate");
        }
      }

      if (!formData.sex) {
        newErrors.sex = "Gender is required";
        summaryErrors.push("Gender is required");
      }
    }

    // Step 2 validation
    if (step === 2) {
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = "License Number is required";
        summaryErrors.push("License Number is required");
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
        summaryErrors.push("Email is required");
      } else if (
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
      ) {
        newErrors.email = "Please enter a valid email address";
        summaryErrors.push("Please enter a valid email address");
      }

      if (!formData.contact.trim()) {
        newErrors.contact = "Contact Number is required";
        summaryErrors.push("Contact Number is required");
      } else if (formData.contact.replace(/\D/g, "").length < 10) {
        newErrors.contact = "Please enter a valid contact number";
        summaryErrors.push("Please enter a valid contact number");
      }
    }

    setErrors(newErrors);
    setValidationSummary(summaryErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Combine the names for the full name and calculate age
      const birthDate = new Date(formData.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      // Construct the full name consistently with how we'll parse it in the profile view
      const fullData = {
        ...formData,
        name: `${formData.firstName}${
          formData.middleName ? " " + formData.middleName : ""
        } ${formData.lastName}`.trim(),
        // Store the individual name components to make it easier to display correctly in profile
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        age: age,
        licenseNumber: formData.licenseNumber,
      };
      onSave(fullData);
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-doctor-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 id="modal-title">Create Doctor Account</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {validationSummary.length > 0 && (
            <div
              className="validation-summary"
              role="alert"
              aria-live="assertive"
            >
              <p>Please correct the following errors:</p>
              <ul>
                {validationSummary.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-legend">
            Fields marked with <span className="required-marker">*</span> are
            required
          </div>

          <form
            onSubmit={step === 1 ? handleContinue : handleSubmit}
            className="add-doctor-form"
          >
            {step === 1 && (
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="firstName">
                      First Name<span className="required-marker">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? "error" : ""}
                      placeholder="Enter first name"
                      aria-required="true"
                      aria-invalid={errors.firstName ? "true" : "false"}
                    />
                    {errors.firstName && (
                      <div className="field-error" role="alert">
                        {errors.firstName}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="middleName">
                      Middle Name{" "}
                      <span className="optional-marker">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      placeholder="Enter middle name"
                      aria-required="false"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">
                      Last Name<span className="required-marker">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? "error" : ""}
                      placeholder="Enter last name"
                      aria-required="true"
                      aria-invalid={errors.lastName ? "true" : "false"}
                    />
                    {errors.lastName && (
                      <div className="field-error" role="alert">
                        {errors.lastName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="birthdate">
                      Date of Birth<span className="required-marker">*</span>
                    </label>
                    <input
                      type="date"
                      id="birthdate"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      className={errors.birthdate ? "error" : ""}
                      aria-required="true"
                      aria-invalid={errors.birthdate ? "true" : "false"}
                      aria-describedby="birthdate-format"
                    />
                    <div id="birthdate-format" className="field-hint">
                      Format: MM/DD/YYYY
                    </div>
                    {errors.birthdate && (
                      <div className="field-error" role="alert">
                        {errors.birthdate}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="sex">
                      Gender<span className="required-marker">*</span>
                    </label>
                    <select
                      id="sex"
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      className={errors.sex ? "error" : ""}
                      aria-required="true"
                      aria-invalid={errors.sex ? "true" : "false"}
                    >
                      <option value="" disabled>
                        Select gender
                      </option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                    {errors.sex && (
                      <div className="field-error" role="alert">
                        {errors.sex}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-section">
                <h3 className="section-title">Professional Information</h3>
                <div className="form-group">
                  <label htmlFor="licenseNumber">
                    License Number<span className="required-marker">*</span>
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className={errors.licenseNumber ? "error" : ""}
                    placeholder="Enter medical license number"
                    aria-required="true"
                    aria-invalid={errors.licenseNumber ? "true" : "false"}
                  />
                  {errors.licenseNumber && (
                    <div className="field-error" role="alert">
                      {errors.licenseNumber}
                    </div>
                  )}
                </div>

                <h3 className="section-title">Contact Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="contact">
                      Contact Number<span className="required-marker">*</span>
                    </label>
                    <input
                      type="tel"
                      id="contact"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      className={errors.contact ? "error" : ""}
                      placeholder="(123) 456-7890"
                      aria-required="true"
                      aria-invalid={errors.contact ? "true" : "false"}
                    />
                    {errors.contact && (
                      <div className="field-error" role="alert">
                        {errors.contact}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      Email<span className="required-marker">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? "error" : ""}
                      placeholder="Enter email address"
                      aria-required="true"
                      aria-invalid={errors.email ? "true" : "false"}
                    />
                    {errors.email && (
                      <div className="field-error" role="alert">
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="modal-footer">
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="save-button">
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="back-button"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <div className="right-buttons">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="save-button"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="button-icon animate-spin">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeDasharray="15.708 15.708"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            className="button-icon"
                          >
                            <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                          </svg>
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
      <style>
        {`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 0;
          box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #eaecef;
          border-radius: 12px 12px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #7f8c8d;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background-color: #e9ecef;
          color: #34495e;
        }

        .close-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
        }

        .modal-body {
          padding: 24px;
        }

        .form-legend {
          margin-bottom: 20px;
          font-size: 0.875rem;
          color: #6c757d;
        }

        .required-marker {
          color: #dc3545;
          margin-left: 4px;
        }

        .optional-marker {
          font-size: 0.875rem;
          color: #6c757d;
          font-weight: normal;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #343a40;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eaecef;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        label {
          font-weight: 500;
          color: #2c3e50;
          font-size: 0.95rem;
        }

        input, select {
          padding: 10px 12px;
          border: 1px solid #dcdfe6;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
          background-color: #fff;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #409eff;
          box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
        }

        input.error, select.error {
          border-color: #dc3545;
        }

        input.error:focus, select.error:focus {
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
        }

        .field-error {
          color: #dc3545;
          font-size: 12px;
        }
        
        .field-hint {
          color: #6c757d;
          font-size: 12px;
        }
        
        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eaecef;
        }

        .right-buttons {
          display: flex;
          gap: 10px;
        }

        .back-button,
        .cancel-button,
        .save-button {
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .back-button {
          background: #f8f9fa;
          border: 1px solid #dcdfe6;
          color: #606266;
        }

        .back-button:hover {
          background: #e9ecef;
        }

        .cancel-button {
          background: #f8f9fa;
          border: 1px solid #dcdfe6;
          color: #606266;
        }

        .cancel-button:hover {
          background: #e9ecef;
        }

        .save-button {
          background: #409eff;
          border: none;
          color: white;
        }

        .save-button:hover {
          background: #66b1ff;
        }

        .button-icon {
          margin-right: 4px;
        }

        .validation-summary {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .validation-summary p {
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 8px;
        }

        .validation-summary ul {
          margin: 0;
          padding-left: 24px;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-footer {
            flex-direction: column;
          }
          
          .right-buttons {
            width: 100%;
            justify-content: flex-end;
          }
        }
        `}
      </style>
    </div>
  );
});

export default AddDoctorModal;
