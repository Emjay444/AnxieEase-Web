// Real-time data subscription and management utilities

import firebaseDeviceService from '../services/firebaseDeviceService';

/**
 * Real-time subscription manager for handling multiple data streams
 */
class RealtimeSubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
  }

  /**
   * Subscribe to device status updates
   */
  subscribeToDeviceStatus(callback) {
    const subscriptionId = 'device-status';
    
    if (this.subscriptions.has(subscriptionId)) {
      this.unsubscribe(subscriptionId);
    }

    const unsubscribe = firebaseDeviceService.subscribeToDeviceStatuses(callback);
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    return subscriptionId;
  }

  /**
   * Subscribe to sensor data for specific device
   */
  subscribeToDeviceSensorData(deviceId, callback) {
    const subscriptionId = `sensor-${deviceId}`;
    
    if (this.subscriptions.has(subscriptionId)) {
      this.unsubscribe(subscriptionId);
    }

    const unsubscribe = firebaseDeviceService.subscribeToSensorData(deviceId, callback);
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    return subscriptionId;
  }

  /**
   * Subscribe to active sessions
   */
  subscribeToActiveSessions(callback) {
    const subscriptionId = 'active-sessions';
    
    if (this.subscriptions.has(subscriptionId)) {
      this.unsubscribe(subscriptionId);
    }

    const unsubscribe = firebaseDeviceService.subscribeToActiveSessions(callback);
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    return subscriptionId;
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(callback) {
    const subscriptionId = 'alerts';
    
    if (this.subscriptions.has(subscriptionId)) {
      this.unsubscribe(subscriptionId);
    }

    const unsubscribe = firebaseDeviceService.subscribeToAlerts(callback);
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from specific subscription
   */
  unsubscribe(subscriptionId) {
    const unsubscribe = this.subscriptions.get(subscriptionId);
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll() {
    this.subscriptions.forEach((unsubscribe, subscriptionId) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.subscriptions.clear();
    this.listeners.clear();
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

/**
 * Data aggregation utilities for real-time streams
 */
export class DataAggregator {
  constructor(maxDataPoints = 100) {
    this.maxDataPoints = maxDataPoints;
    this.dataStreams = new Map();
  }

  /**
   * Add data point to stream
   */
  addDataPoint(streamId, data) {
    if (!this.dataStreams.has(streamId)) {
      this.dataStreams.set(streamId, []);
    }

    const stream = this.dataStreams.get(streamId);
    stream.push({
      ...data,
      timestamp: data.timestamp || Date.now()
    });

    // Keep only the most recent data points
    if (stream.length > this.maxDataPoints) {
      stream.splice(0, stream.length - this.maxDataPoints);
    }

    this.dataStreams.set(streamId, stream);
  }

  /**
   * Get data stream
   */
  getDataStream(streamId) {
    return this.dataStreams.get(streamId) || [];
  }

  /**
   * Get latest data point from stream
   */
  getLatestData(streamId) {
    const stream = this.getDataStream(streamId);
    return stream.length > 0 ? stream[stream.length - 1] : null;
  }

  /**
   * Calculate moving average for numeric field
   */
  getMovingAverage(streamId, field, windowSize = 10) {
    const stream = this.getDataStream(streamId);
    if (stream.length === 0) return 0;

    const recentData = stream.slice(-windowSize);
    const validValues = recentData
      .map(point => point[field])
      .filter(value => !isNaN(value) && value !== null && value !== undefined);

    if (validValues.length === 0) return 0;

    return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
  }

  /**
   * Get trend direction for numeric field
   */
  getTrend(streamId, field, lookbackPoints = 5) {
    const stream = this.getDataStream(streamId);
    if (stream.length < lookbackPoints) return 'stable';

    const recentData = stream.slice(-lookbackPoints);
    const values = recentData
      .map(point => point[field])
      .filter(value => !isNaN(value) && value !== null && value !== undefined);

    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (percentChange > 5) return 'increasing';
    if (percentChange < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Clear data stream
   */
  clearDataStream(streamId) {
    this.dataStreams.delete(streamId);
  }

  /**
   * Clear all data streams
   */
  clearAllDataStreams() {
    this.dataStreams.clear();
  }

  /**
   * Get summary statistics for all streams
   */
  getSummaryStats() {
    const stats = {};
    this.dataStreams.forEach((stream, streamId) => {
      stats[streamId] = {
        count: stream.length,
        oldestTimestamp: stream.length > 0 ? stream[0].timestamp : null,
        newestTimestamp: stream.length > 0 ? stream[stream.length - 1].timestamp : null
      };
    });
    return stats;
  }
}

/**
 * Alert detection and management
 */
export class AlertManager {
  constructor() {
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Add alert rule
   */
  addAlertRule(ruleId, rule) {
    this.alertRules.set(ruleId, {
      ...rule,
      id: ruleId,
      enabled: true,
      lastTriggered: null
    });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId) {
    this.alertRules.delete(ruleId);
    this.activeAlerts.delete(ruleId);
  }

  /**
   * Check data against all alert rules
   */
  checkAlerts(deviceId, sensorData) {
    const alerts = [];

    this.alertRules.forEach((rule, ruleId) => {
      if (!rule.enabled) return;

      const alertTriggered = this.evaluateRule(rule, sensorData);
      
      if (alertTriggered) {
        const alert = {
          id: `${ruleId}-${Date.now()}`,
          ruleId,
          deviceId,
          type: rule.type,
          severity: rule.severity || 'warning',
          message: rule.message || `${rule.type} threshold exceeded`,
          value: sensorData[rule.field],
          threshold: rule.threshold,
          timestamp: Date.now(),
          acknowledged: false
        };

        alerts.push(alert);
        this.activeAlerts.set(alert.id, alert);
        this.addToHistory(alert);
        
        // Update last triggered time
        rule.lastTriggered = Date.now();
      }
    });

    return alerts;
  }

  /**
   * Evaluate single alert rule
   */
  evaluateRule(rule, data) {
    const value = data[rule.field];
    if (value === null || value === undefined || isNaN(value)) return false;

    switch (rule.operator) {
      case 'greater_than':
        return value > rule.threshold;
      case 'less_than':
        return value < rule.threshold;
      case 'equal':
        return value === rule.threshold;
      case 'not_equal':
        return value !== rule.threshold;
      case 'between':
        return value >= rule.minThreshold && value <= rule.maxThreshold;
      case 'outside':
        return value < rule.minThreshold || value > rule.maxThreshold;
      default:
        return false;
    }
  }

  /**
   * Add alert to history
   */
  addToHistory(alert) {
    this.alertHistory.unshift(alert);
    
    // Keep history size manageable
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
    }
  }

  /**
   * Clear acknowledged alerts
   */
  clearAcknowledgedAlerts() {
    this.activeAlerts.forEach((alert, alertId) => {
      if (alert.acknowledged) {
        this.activeAlerts.delete(alertId);
      }
    });
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(0, limit);
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  /**
   * Start timing an operation
   */
  startTimer(operationId) {
    this.startTimes.set(operationId, performance.now());
  }

  /**
   * End timing and record metric
   */
  endTimer(operationId, metadata = {}) {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.startTimes.delete(operationId);

    const metric = {
      operationId,
      duration,
      timestamp: Date.now(),
      ...metadata
    };

    if (!this.metrics.has(operationId)) {
      this.metrics.set(operationId, []);
    }

    const operationMetrics = this.metrics.get(operationId);
    operationMetrics.push(metric);

    // Keep only recent metrics (last 100 per operation)
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }

    return metric;
  }

  /**
   * Get performance statistics for operation
   */
  getStats(operationId) {
    const metrics = this.metrics.get(operationId) || [];
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      operationId,
      count: metrics.length,
      averageDuration: avg,
      minDuration: min,
      maxDuration: max,
      lastExecution: metrics[metrics.length - 1]
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats() {
    const stats = {};
    this.metrics.forEach((_, operationId) => {
      stats[operationId] = this.getStats(operationId);
    });
    return stats;
  }
}

// Create singleton instances
export const realtimeManager = new RealtimeSubscriptionManager();
export const dataAggregator = new DataAggregator();
export const alertManager = new AlertManager();
export const performanceMonitor = new PerformanceMonitor();

// Set up default alert rules
alertManager.addAlertRule('heart-rate-high', {
  type: 'heart_rate_high',
  field: 'heartRate',
  operator: 'greater_than',
  threshold: 120,
  severity: 'warning',
  message: 'Heart rate above normal range'
});

alertManager.addAlertRule('heart-rate-critical', {
  type: 'heart_rate_critical',
  field: 'heartRate',
  operator: 'greater_than',
  threshold: 150,
  severity: 'critical',
  message: 'Heart rate critically high'
});

alertManager.addAlertRule('skin-conductance-high', {
  type: 'skin_conductance_high',
  field: 'skinConductance',
  operator: 'greater_than',
  threshold: 0.8,
  severity: 'warning',
  message: 'Skin conductance elevated'
});

alertManager.addAlertRule('temperature-high', {
  type: 'temperature_high',
  field: 'bodyTemperature',
  operator: 'greater_than',
  threshold: 38.0,
  severity: 'warning',
  message: 'Body temperature elevated'
});

export default {
  realtimeManager,
  dataAggregator,
  alertManager,
  performanceMonitor,
  RealtimeSubscriptionManager,
  DataAggregator,
  AlertManager,
  PerformanceMonitor
};