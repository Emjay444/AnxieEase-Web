import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Users,
  Smartphone,
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { adminService } from '../../services/adminService';
import deviceService from '../../services/deviceService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [deviceStats, setDeviceStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedYear]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [analytics, utilization] = await Promise.all([
        adminService.getAnalyticsData(selectedYear),
        deviceService.getDeviceUtilizationStats(timeRange)
      ]);
      
      setAnalyticsData(analytics);
      setDeviceStats(utilization);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const userRegistrationChartData = {
    labels: analyticsData ? Object.keys(analyticsData.monthlyRegistrations) : [],
    datasets: [
      {
        label: 'New Users',
        data: analyticsData ? Object.values(analyticsData.monthlyRegistrations) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 4,
      }
    ]
  };

  const genderDistributionData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [
      {
        data: analyticsData ? [
          analyticsData.genderDistribution.male,
          analyticsData.genderDistribution.female,
          analyticsData.genderDistribution.other
        ] : [0, 0, 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderWidth: 0,
      }
    ]
  };

  const ageDistributionData = {
    labels: ['18-25', '26-35', '36-45', '46+'],
    datasets: [
      {
        label: 'Users',
        data: analyticsData ? Object.values(analyticsData.ageDistribution) : [0, 0, 0, 0],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      }
    ]
  };

  const deviceUtilizationData = {
    labels: ['Active', 'Available', 'Inactive'],
    datasets: [
      {
        data: deviceStats ? [
          deviceStats.activeDevices,
          deviceStats.availableDevices,
          deviceStats.totalDevices - deviceStats.activeDevices - deviceStats.availableDevices
        ] : [0, 0, 0],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)', 
          'rgba(156, 163, 175, 0.8)'
        ],
        borderWidth: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
        }
      },
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-600 dark:text-green-400 font-medium">{trend}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Insights into user engagement, device utilization, and system performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analyticsData?.totalPatients || 0}
          icon={Users}
          color="bg-blue-500"
          subtitle="Registered patients"
          trend="+12%"
        />
        <StatCard
          title="Device Utilization"
          value={`${deviceStats?.utilizationRate || 0}%`}
          icon={Smartphone}
          color="bg-emerald-500"
          subtitle={`${deviceStats?.activeDevices || 0}/${deviceStats?.totalDevices || 0} active`}
          trend="+8%"
        />
        <StatCard
          title="Avg Assignment Duration"
          value={`${deviceStats?.averageAssignmentDuration || 0}d`}
          icon={Clock}
          color="bg-purple-500"
          subtitle="Days per assignment"
          trend="+3%"
        />
        <StatCard
          title="Monthly Growth"
          value={analyticsData?.monthlyRegistrations ? 
            Object.values(analyticsData.monthlyRegistrations).reduce((a, b) => a + b, 0) : 0}
          icon={TrendingUp}
          color="bg-orange-500"
          subtitle="New registrations"
          trend="+15%"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Registration Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={userRegistrationChartData} options={chartOptions} />
          </div>
        </div>

        {/* Device Utilization */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Device Utilization</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Doughnut data={deviceUtilizationData} options={doughnutOptions} />
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gender Distribution</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Pie data={genderDistributionData} options={doughnutOptions} />
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Age Distribution</h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={ageDistributionData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Status Overview */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Status Overview</h3>
          <div className="space-y-3">
            {deviceStats && Object.entries(deviceStats.devicesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'active' ? 'bg-green-400' :
                    status === 'available' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{status}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Assignments This Period</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {deviceStats?.assignmentsInPeriod || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Average Age</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analyticsData?.ageHistogram ? 
                  Math.round(
                    Object.entries(analyticsData.ageHistogram).reduce((sum, [age, count]) => 
                      sum + (parseInt(age) * count), 0
                    ) / Object.values(analyticsData.ageHistogram).reduce((a, b) => a + b, 0)
                  ) : 0} years
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Most Active Month</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analyticsData?.monthlyRegistrations ? 
                  Object.entries(analyticsData.monthlyRegistrations)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">User Engagement</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">85%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">System Uptime</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">99.8%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.8%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">Data Accuracy</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">96%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;