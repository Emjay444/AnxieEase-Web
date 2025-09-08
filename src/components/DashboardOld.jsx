import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  TrendingUp,
  Bell,
  Search,
  Filter,
  Plus,
  MessageSquare,
  Clock,
  Heart,
  Brain,
  Activity,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  BarChart3,
  Settings,
} from "lucide-react";
import { Line } from "react-chartjs-2";

const DashboardNew = () => {
  const { user, signOut, hasAdminPrivileges } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Mock data
  const [stats, setStats] = useState({
    totalPatients: 28,
    todayAppointments: 5,
    weeklyProgress: "+12%",
    avgAnxietyLevel: 4.2,
  });

  const [patients, setPatients] = useState([
    {
      id: 1,
      name: "Alice Johnson",
      age: 28,
      email: "alice.j@email.com",
      nextAppointment: "2024-09-01T10:00:00",
      lastSession: "2024-08-28T14:00:00",
      anxietyLevel: 3.2,
      progress: "improving",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b332aa27?w=150",
      recentMoods: [3, 4, 2, 3, 2, 4, 3],
      notes: "Shows significant improvement in anxiety management",
    },
    {
      id: 2,
      name: "Robert Chen",
      age: 34,
      email: "robert.c@email.com",
      nextAppointment: "2024-09-02T09:00:00",
      lastSession: "2024-08-29T11:00:00",
      anxietyLevel: 5.8,
      progress: "stable",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      recentMoods: [5, 6, 5, 4, 5, 6, 5],
      notes: "Consistent engagement in therapy sessions",
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      age: 25,
      email: "maria.r@email.com",
      nextAppointment: "2024-09-03T15:00:00",
      lastSession: "2024-08-30T16:00:00",
      anxietyLevel: 2.1,
      progress: "excellent",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      recentMoods: [2, 1, 2, 2, 1, 2, 1],
      notes: "Excellent progress with mindfulness techniques",
    },
  ]);

  const [upcomingAppointments, setUpcomingAppointments] = useState([
    {
      id: 1,
      patientName: "Alice Johnson",
      time: "10:00 AM",
      date: "Today",
      type: "Follow-up Session",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b332aa27?w=150",
    },
    {
      id: 2,
      patientName: "Robert Chen",
      time: "2:00 PM",
      date: "Today",
      type: "Initial Assessment",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  ]);

  // Chart data for anxiety trends
  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Average Anxiety Level",
        data: [6.2, 5.8, 5.1, 4.7, 4.2, 3.8],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const StatCard = ({ title, value, icon: Icon, trend, color = "emerald" }) => {
    const palette = {
      emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
      green: { bg: "bg-green-50", text: "text-green-600" },
      purple: { bg: "bg-purple-50", text: "text-purple-600" },
      orange: { bg: "bg-orange-50", text: "text-orange-600" },
      blue: { bg: "bg-blue-50", text: "text-blue-600" },
      yellow: { bg: "bg-yellow-50", text: "text-yellow-600" },
    };
    const colors = palette[color] || palette.emerald;
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
        </div>
      </div>
    );
  };

  const PatientCard = ({ patient, onClick }) => (
    <div
      onClick={() => onClick(patient)}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={patient.avatar}
            alt={patient.name}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-600">Age {patient.age}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Anxiety Level</span>
          <span
            className={`text-sm font-medium ${
              patient.anxietyLevel <= 3
                ? "text-green-600"
                : patient.anxietyLevel <= 6
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {patient.anxietyLevel}/10
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Progress</span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              patient.progress === "excellent"
                ? "bg-green-100 text-green-800"
                : patient.progress === "improving"
                ? "bg-blue-100 text-blue-800"
                : patient.progress === "stable"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {patient.progress}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          Next: {new Date(patient.nextAppointment).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  const AppointmentCard = ({ appointment }) => (
    <div className="flex items-center p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
      <img
        src={appointment.avatar}
        alt={appointment.patientName}
        className="h-10 w-10 rounded-full object-cover mr-3"
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
        <p className="text-sm text-gray-600">{appointment.type}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
        <p className="text-xs text-gray-500">{appointment.date}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <span className="text-sm text-gray-500">Psychologist Portal</span>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>

              {/* Admin Dashboard Access - Header Button */}
              {hasAdminPrivileges() && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </button>
              )}

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Dr. {user?.name || "Psychologist"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={Calendar}
            color="green"
          />
          <StatCard
            title="Weekly Progress"
            value={stats.weeklyProgress}
            icon={TrendingUp}
            trend="vs last week"
            color="purple"
          />
          <StatCard
            title="Avg Anxiety Level"
            value={stats.avgAnxietyLevel}
            icon={Brain}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Anxiety Trends Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Anxiety Trends
                </h2>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg">
                    6 Weeks
                  </button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                    3 Months
                  </button>
                </div>
              </div>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Patients Grid */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  My Patients
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      aria-label="Search patients"
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onClick={setSelectedPatient}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Appointments */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Today's Appointments
                </h3>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>

              <button className="w-full mt-4 py-2 px-4 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium">
                View All Appointments
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                  <Plus className="h-5 w-5 text-emerald-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      New Session Note
                    </p>
                    <p className="text-xs text-gray-600">Add session notes</p>
                  </div>
                </button>

                <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                  <MessageSquare className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Send Message
                    </p>
                    <p className="text-xs text-gray-600">Message a patient</p>
                  </div>
                </button>

                <button className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Generate Report
                    </p>
                    <p className="text-xs text-gray-600">
                      Patient progress report
                    </p>
                  </div>
                </button>

                {/* Admin Dashboard Access - Show only if user has admin privileges */}
                {hasAdminPrivileges() && (
                  <button 
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <Settings className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        Admin Dashboard
                      </p>
                      <p className="text-xs text-gray-600">
                        Manage system & users
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>

              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Session completed with Alice Johnson
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    New mood log from Robert Chen
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    Appointment reminder sent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Detail Modal (if selected) */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Patient Details
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedPatient.avatar}
                  alt={selectedPatient.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedPatient.name}
                  </h4>
                  <p className="text-gray-600">Age {selectedPatient.age}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  {selectedPatient.email}
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  Next:{" "}
                  {new Date(
                    selectedPatient.nextAppointment
                  ).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2">Recent Notes</h5>
                <p className="text-sm text-gray-600">{selectedPatient.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardNew;
