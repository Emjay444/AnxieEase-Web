// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Empty field validation
export const isEmptyField = (value) => {
  return value === null || value === undefined || value.trim() === '';
};

// Form validation
export const validateLoginForm = (email, password) => {
  const errors = {};

  if (isEmptyField(email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email format';
  }

  if (isEmptyField(password)) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Patient search validation
export const validateSearchTerm = (term) => {
  return term && term.length >= 2;
};

// Note content validation
export const validateNoteContent = (content) => {
  return !isEmptyField(content) && content.length >= 5;
};
