import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Users,
  Calendar,
  BarChart3,
  CheckCircle,
  AlertCircle,
  FileDown,
  FileSpreadsheet,
  X,
  Search,
  Filter,
  Loader,
} from "lucide-react";
import { reportService } from "../services/reportService";
import { psychologistService } from "../services/psychologistService";
import ProfilePicture from "./ProfilePicture";

const ReportGeneration = ({ psychologistId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState("individual"); // 'individual' or 'batch'
  const [exportFormat, setExportFormat] = useState("pdf"); // 'pdf' or 'csv'
  const [generating, setGenerating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  // Load patients assigned to this psychologist
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const patientsData = await psychologistService.getPsychologistPatients(
          psychologistId
        );
        console.log(
          "ReportGeneration: Loaded patients with avatar data:",
          patientsData.map((p) => ({
            name: p.name,
            avatar_url: p.avatar_url,
            id: p.id,
          }))
        );
        setPatients(patientsData);
      } catch (error) {
        console.error("Error loading patients:", error);
        setError("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    if (psychologistId) {
      loadPatients();
    }
  }, [psychologistId]);

  // Filter patients based on search term
  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    const name = (
      patient.name ||
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim()
    ).toLowerCase();
    const email = (patient.email || "").toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  // Toggle patient selection
  const togglePatientSelection = (patientId) => {
    setSelectedPatients((prev) => {
      if (prev.includes(patientId)) {
        return prev.filter((id) => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  // Select all filtered patients
  const selectAllPatients = () => {
    const allFilteredIds = filteredPatients.map((p) => p.id);
    setSelectedPatients(allFilteredIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPatients([]);
  };

  // Generate preview of report data
  const generatePreview = async (patientId) => {
    try {
      setGenerating(true);
      const reportData = await reportService.generatePatientReportData(
        patientId,
        psychologistId
      );
      setPreviewData(reportData);
      setShowReportModal(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      setError("Failed to generate report preview");
    } finally {
      setGenerating(false);
    }
  };

  // Generate and download individual report
  const generateIndividualReport = async (patientId) => {
    try {
      setGenerating(true);
      setError(null);

      const reportData = await reportService.generatePatientReportData(
        patientId,
        psychologistId
      );

      if (exportFormat === "pdf") {
        await reportService.exportPatientDataPDF(reportData);
      } else {
        await reportService.exportPatientDataCSV(reportData);
      }

      // Show success message
      const patient = patients.find((p) => p.id === patientId);
      alert(
        `Report generated successfully for ${patient?.name || patient?.id}!`
      );
    } catch (error) {
      console.error("Error generating individual report:", error);
      setError(`Failed to generate report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Generate batch report
  const generateBatchReport = async () => {
    if (selectedPatients.length === 0) {
      setError("Please select at least one patient");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      await reportService.generateBatchPatientReport(
        selectedPatients,
        psychologistId,
        exportFormat
      );

      alert(
        `Batch report generated successfully for ${selectedPatients.length} patients!`
      );
    } catch (error) {
      console.error("Error generating batch report:", error);
      setError(`Failed to generate batch report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Report Generation
                </h1>
                <p className="text-sm text-gray-600">
                  Generate comprehensive patient reports
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Format:</span>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Report Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Report Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setReportType("individual")}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                reportType === "individual"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText
                  className={`h-6 w-6 ${
                    reportType === "individual"
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Individual Reports
                  </h3>
                  <p className="text-sm text-gray-600">
                    Generate detailed reports for single patients
                  </p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setReportType("batch")}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                reportType === "batch"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users
                  className={`h-6 w-6 ${
                    reportType === "batch"
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <h3 className="font-medium text-gray-900">Batch Reports</h3>
                  <p className="text-sm text-gray-600">
                    Generate summary reports for multiple patients
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Patient Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Patients ({filteredPatients.length} available)
              </h2>
              {reportType === "batch" && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedPatients.length} selected
                  </span>
                  <button
                    onClick={selectAllPatients}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-6">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No patients found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      reportType === "batch" &&
                      selectedPatients.includes(patient.id)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {reportType === "batch" && (
                          <input
                            type="checkbox"
                            checked={selectedPatients.includes(patient.id)}
                            onChange={() => togglePatientSelection(patient.id)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                        )}
                        <ProfilePicture
                          patient={patient}
                          size={40}
                          className=""
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {patient.name ||
                              `${patient.first_name || ""} ${
                                patient.last_name || ""
                              }`.trim() ||
                              "Unnamed Patient"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {patient.email || "No email"}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {patient.id}
                          </p>
                        </div>
                      </div>

                      {reportType === "individual" && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => generatePreview(patient.id)}
                            disabled={generating}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => generateIndividualReport(patient.id)}
                            disabled={generating}
                            className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generating ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                <span className="text-sm">Generate</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Batch Report Actions */}
          {reportType === "batch" && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedPatients.length > 0
                    ? `${selectedPatients.length} patient${
                        selectedPatients.length !== 1 ? "s" : ""
                      } selected for batch report`
                    : "Select patients to generate a batch report"}
                </div>
                <button
                  onClick={generateBatchReport}
                  disabled={selectedPatients.length === 0 || generating}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {exportFormat === "pdf" ? (
                        <FileDown className="h-4 w-4" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                      <span>Generate Batch Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Preview Modal */}
      {showReportModal && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Report Preview
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                {/* Patient Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Patient Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {previewData.patient.name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">ID:</span>{" "}
                      {previewData.patient.id}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {previewData.patient.email || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Summary Statistics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {previewData.stats.totalSessions}
                      </div>
                      <div className="text-xs text-blue-800">
                        Total Sessions
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-600">
                        {previewData.stats.totalMoodEntries}
                      </div>
                      <div className="text-xs text-green-800">Mood Entries</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {previewData.stats.avgMoodScore}/10
                      </div>
                      <div className="text-xs text-purple-800">
                        Avg Mood Score
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {previewData.stats.avgStressLevel}/10
                      </div>
                      <div className="text-xs text-orange-800">
                        Avg Stress Level
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-red-600">
                        {previewData.stats.totalAnxietyAttacks}
                      </div>
                      <div className="text-xs text-red-800">
                        Anxiety Attacks
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-yellow-600">
                        {previewData.stats.attackRatePerWeek}
                      </div>
                      <div className="text-xs text-yellow-800">
                        Attacks/Week
                      </div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <div className="text-sm font-bold text-indigo-600">
                        {previewData.stats.improvementTrend}
                      </div>
                      <div className="text-xs text-indigo-800">Trend</div>
                    </div>
                  </div>
                </div>

                {/* Monthly Attack Analysis */}
                {previewData.stats.totalAnxietyAttacks > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Anxiety Attack Analysis
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">
                          Month with Most Attacks:
                        </span>
                        <span className="text-gray-900">
                          {previewData.stats.mostAttacksMonth} (
                          {previewData.stats.monthlyAttackData[
                            previewData.stats.mostAttacksMonth
                          ] || 0}
                          )
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">
                          Month with Least Attacks:
                        </span>
                        <span className="text-gray-900">
                          {previewData.stats.leastAttacksMonth} (
                          {previewData.stats.monthlyAttackData[
                            previewData.stats.leastAttacksMonth
                          ] || 0}
                          )
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stress Distribution */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Stress Level Distribution
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">
                        {previewData.stats.stressDistribution?.low || 0}
                      </div>
                      <div className="text-xs text-green-800">
                        Low Stress Days
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {previewData.stats.stressDistribution?.medium || 0}
                      </div>
                      <div className="text-xs text-yellow-800">
                        Medium Stress Days
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-red-600">
                        {previewData.stats.stressDistribution?.high || 0}
                      </div>
                      <div className="text-xs text-red-800">
                        High Stress Days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Recent Mood Logs
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {previewData.moodLogs?.slice(0, 5).map((log, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-3 text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">
                              {log.mood || "N/A"}
                            </span>
                            <span className="text-gray-600 ml-2">
                              Stress: {log.stress_level || "N/A"}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {log.log_date
                              ? new Date(log.log_date).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        {log.symptoms &&
                          Array.isArray(log.symptoms) &&
                          log.symptoms.length > 0 && (
                            <div className="text-gray-600 mt-1">
                              Symptoms: {log.symptoms.join(", ")}
                            </div>
                          )}
                      </div>
                    )) || (
                      <p className="text-gray-500 text-sm">
                        No mood logs available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setShowReportModal(false);
                    if (exportFormat === "pdf") {
                      await reportService.exportPatientDataPDF(previewData);
                    } else {
                      await reportService.exportPatientDataCSV(previewData);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGeneration;
