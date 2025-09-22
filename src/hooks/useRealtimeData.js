// Custom React hooks for the admin dashboard

import { useState, useEffect, useRef, useCallback } from 'react';
import { realtimeManager, dataAggregator, alertManager } from './realtimeUtils';
import firebaseDeviceService from '../services/firebaseDeviceService';

/**
 * Hook for managing real-time device status updates
 */
export const useDeviceStatus = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    const subscriptionId = realtimeManager.subscribeToDeviceStatus((deviceData) => {
      setDevices(deviceData);
      setLoading(false);
      setError(null);
    });

    return () => {
      realtimeManager.unsubscribe(subscriptionId);
    };
  }, []);

  return { devices, loading, error };
};

/**
 * Hook for real-time sensor data from a specific device
 */
export const useSensorData = (deviceId) => {
  const [sensorData, setSensorData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!deviceId) return;

    const subscriptionId = realtimeManager.subscribeToDeviceSensorData(deviceId, (data) => {
      setSensorData(data);
      setLastUpdate(Date.now());
      setIsConnected(true);
      
      // Add data to aggregator for trend analysis
      dataAggregator.addDataPoint(deviceId, data);
      
      // Check for alerts
      const alerts = alertManager.checkAlerts(deviceId, data);
      if (alerts.length > 0) {
        console.log('Alerts triggered:', alerts);
      }
    });

    // Set connection timeout
    const timeout = setTimeout(() => {
      setIsConnected(false);
    }, 10000); // 10 seconds

    return () => {
      realtimeManager.unsubscribe(subscriptionId);
      clearTimeout(timeout);
    };
  }, [deviceId]);

  return { 
    sensorData, 
    lastUpdate, 
    isConnected,
    movingAverage: (field, window = 10) => dataAggregator.getMovingAverage(deviceId, field, window),
    trend: (field, lookback = 5) => dataAggregator.getTrend(deviceId, field, lookback)
  };
};

/**
 * Hook for managing active sessions
 */
export const useActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriptionId = realtimeManager.subscribeToActiveSessions((sessionData) => {
      setSessions(sessionData);
      setLoading(false);
    });

    return () => {
      realtimeManager.unsubscribe(subscriptionId);
    };
  }, []);

  return { sessions, loading };
};

/**
 * Hook for real-time alerts
 */
export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  useEffect(() => {
    const subscriptionId = realtimeManager.subscribeToAlerts((alertData) => {
      setAlerts(alertData);
      setUnacknowledgedCount(alertData.filter(alert => !alert.acknowledged).length);
    });

    // Also get existing alerts from alert manager
    const existingAlerts = alertManager.getActiveAlerts();
    setAlerts(existingAlerts);
    setUnacknowledgedCount(existingAlerts.filter(alert => !alert.acknowledged).length);

    return () => {
      realtimeManager.unsubscribe(subscriptionId);
    };
  }, []);

  const acknowledgeAlert = useCallback((alertId) => {
    alertManager.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    setUnacknowledgedCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAcknowledged = useCallback(() => {
    alertManager.clearAcknowledgedAlerts();
    setAlerts(prev => prev.filter(alert => !alert.acknowledged));
  }, []);

  return { 
    alerts, 
    unacknowledgedCount, 
    acknowledgeAlert, 
    clearAcknowledged,
    alertHistory: alertManager.getAlertHistory()
  };
};

/**
 * Hook for periodic data refresh
 */
export const usePeriodicRefresh = (callback, interval = 30000, dependencies = []) => {
  const callbackRef = useRef(callback);
  const intervalRef = useRef(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Initial call
    callbackRef.current();

    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, ...dependencies]);

  // Provide manual refresh function
  const refresh = useCallback(() => {
    callbackRef.current();
  }, []);

  return refresh;
};

/**
 * Hook for debounced values (useful for search inputs)
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for local storage with JSON parsing
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

/**
 * Hook for async data fetching with loading states
 */
export const useAsyncData = (asyncFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Async data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for managing pagination
 */
export const usePagination = (totalItems, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Reset to page 1 when total items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

/**
 * Hook for tracking component mount status
 */
export const useIsMounted = () => {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
};

/**
 * Hook for managing modal state
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
};

/**
 * Hook for window dimensions
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Hook for managing form state with validation
 */
export const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field];
      const value = values[field];
      
      if (rule.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = `${field} is required`;
      } else if (rule.pattern && value && !rule.pattern.test(value)) {
        newErrors[field] = rule.message || `${field} format is invalid`;
      } else if (rule.min && value && value.length < rule.min) {
        newErrors[field] = `${field} must be at least ${rule.min} characters`;
      } else if (rule.max && value && value.length > rule.max) {
        newErrors[field] = `${field} must be no more than ${rule.max} characters`;
      } else if (rule.custom && value) {
        const customError = rule.custom(value, values);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

export default {
  useDeviceStatus,
  useSensorData,
  useActiveSessions,
  useAlerts,
  usePeriodicRefresh,
  useDebounce,
  useLocalStorage,
  useAsyncData,
  usePagination,
  useIsMounted,
  useModal,
  useWindowSize,
  useForm
};