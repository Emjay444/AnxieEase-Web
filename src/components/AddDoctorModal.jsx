import { useState, useEffect, memo } from "react";

const AddDoctorModal = memo(({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    birthdate: "",
    licenseNumber: "",
    email: "",
    contact: "",
    dateRegistered: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({});

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
        dateRegistered: new Date().toISOString().split("T")[0],
      });
      setErrors({});
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First Name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last Name is required";
    }

    if (!formData.birthdate) {
      newErrors.birthdate = "Birthdate is required";
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
      } else if (age > 100) {
        newErrors.birthdate = "Invalid birthdate";
      }
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = "License Number is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.contact.trim()) {
      newErrors.contact = "Contact Number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      const fullData = {
        ...formData,
        name: `${formData.firstName}${
          formData.middleName ? " " + formData.middleName : ""
        } ${formData.lastName}`.trim(),
        age: age,
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
      >
        <div className="modal-header">
          <h2>Create Doctor Account</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="add-doctor-form">
            <div className="form-section">
              <div className="stacked-fields">
                <div className="form-group">
                  <label htmlFor="lastName">Last Name*</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? "error" : ""}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <div className="field-error">{errors.lastName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="firstName">First Name*</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? "error" : ""}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <div className="field-error">{errors.firstName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="middleName">Middle Name (Optional)</label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter middle name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="birthdate">Birthdate*</label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  className={errors.birthdate ? "error" : ""}
                />
                {errors.birthdate && (
                  <div className="field-error">{errors.birthdate}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="licenseNumber">License Number*</label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className={errors.licenseNumber ? "error" : ""}
                  placeholder="Enter medical license number"
                />
                {errors.licenseNumber && (
                  <div className="field-error">{errors.licenseNumber}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact">Contact Number*</label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className={errors.contact ? "error" : ""}
                  placeholder="Enter contact number"
                />
                {errors.contact && (
                  <div className="field-error">{errors.contact}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <div className="field-error">{errors.email}</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                Send Invitation
              </button>
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
          padding: 20px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          color: #2c3e50;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #7f8c8d;
        }

        .close-button:hover {
          color: #34495e;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .stacked-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        label {
          font-weight: 500;
          color: #2c3e50;
        }

        input {
          padding: 8px 12px;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #409eff;
        }

        input.error {
          border-color: #ff4757;
        }

        .field-error {
          color: #ff4757;
          font-size: 12px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .cancel-button,
        .save-button {
          padding: 8px 20px;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button {
          background: #f7f7f7;
          border: 1px solid #dcdfe6;
          color: #606266;
        }

        .cancel-button:hover {
          background: #ebebeb;
        }

        .save-button {
          background: #409eff;
          border: none;
          color: white;
        }

        .save-button:hover {
          background: #66b1ff;
        }

        @media (max-width: 768px) {
          .stacked-fields {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>
    </div>
  );
});

export default AddDoctorModal;
