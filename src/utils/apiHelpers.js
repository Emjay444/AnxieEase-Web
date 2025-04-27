// Format error messages from Supabase
export const formatErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Handle Supabase auth errors
  if (error.message) {
    // Common Supabase auth error messages
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Please confirm your email before logging in';
    }
    if (error.message.includes('Rate limit')) {
      return 'Too many attempts. Please try again later';
    }
    
    return error.message;
  }
  
  return 'An error occurred. Please try again';
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format patient data for charts
export const formatPatientDataForCharts = (patientData) => {
  if (!patientData) return null;
  
  // Assuming patientData has mood, stress, and symptoms arrays
  // Each with timestamp and value properties
  
  const formatDataset = (dataArray, label, color) => {
    if (!dataArray || !Array.isArray(dataArray)) return null;
    
    const sortedData = [...dataArray].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    return {
      labels: sortedData.map(item => formatDate(item.timestamp)),
      datasets: [
        {
          label,
          data: sortedData.map(item => item.value),
          borderColor: color,
          backgroundColor: `${color}33`, // Add transparency
          tension: 0.3,
        }
      ]
    };
  };
  
  return {
    mood: formatDataset(patientData.mood, 'Mood', '#4CAF50'),
    stress: formatDataset(patientData.stress, 'Stress', '#F44336'),
    symptoms: formatDataset(patientData.symptoms, 'Symptoms', '#2196F3'),
  };
};
