import { useState, useEffect, memo } from 'react';

const AddDoctorModal = memo(({ show, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    birthdate: '',
    licenseNumber: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    dateRegistered: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Reset form when modal is opened
    if (show) {
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        birthdate: '',
        licenseNumber: '',
        email: '',
        contact: '',
        password: '',
        confirmPassword: '',
        dateRegistered: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      setShowPassword(false);
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }

    if (!formData.birthdate) {
      newErrors.birthdate = 'Birthdate is required';
    } else {
      const birthDate = new Date(formData.birthdate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        newErrors.birthdate = 'Must be at least 18 years old';
      } else if (age > 100) {
        newErrors.birthdate = 'Invalid birthdate';
      }
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License Number is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact Number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm the password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      const fullData = {
        ...formData,
        name: `${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''} ${formData.lastName}`.trim(),
        age: age
      };
      onSave(fullData);
      onClose();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-doctor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Doctor Account</h2>
          <button className="close-button" onClick={onClose}>×</button>
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
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <div className="field-error">{errors.lastName}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="firstName">First Name*</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <div className="field-error">{errors.firstName}</div>}
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
                  className={errors.birthdate ? 'error' : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.birthdate && <div className="field-error">{errors.birthdate}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="licenseNumber">License Number*</label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className={errors.licenseNumber ? 'error' : ''}
                  placeholder="Enter medical license number"
                />
                {errors.licenseNumber && <div className="field-error">{errors.licenseNumber}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="contact">Contact Number*</label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className={errors.contact ? 'error' : ''}
                  placeholder="Enter contact number"
                />
                {errors.contact && <div className="field-error">{errors.contact}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter work email address"
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password*</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                    placeholder="Create a password"
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <div className="field-error">{errors.password}</div>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="confirmPassword">Confirm Password*</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Confirm the password"
                  />
                </div>
                {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
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
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-body {
          padding: 1rem;
        }

        .name-fields {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .modal-footer {
          padding: 1rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .name-fields {
            grid-template-columns: 1fr;
          }
        }

        .password-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: #666;
        }

        .password-toggle-btn:hover {
          color: #333;
        }

        .field-error {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .form-group input.error {
          border-color: #dc3545;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .save-button {
          background-color: #22c55e;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: background-color 0.2s;
          border: none;
        }

        .save-button:hover {
          background-color: #16a34a;
        }

        .cancel-button {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          border: 1px solid #e2e8f0;
          background: white;
        }

        .cancel-button:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
});

export default AddDoctorModal; 