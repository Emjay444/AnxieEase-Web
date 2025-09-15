import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { usePatient } from "../contexts/PatientContext";
import { formatDate, formatPatientDataForCharts } from "../utils/apiHelpers";
import { validateNoteContent } from "../utils/validation";
import LogoutButton from "./LogoutButton";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PatientProfile = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const {
    currentPatient,
    patientNotes,
    sessionLogs,
    loading,
    error,
    loadPatient,
    addNote,
    updateNote,
    deleteNote,
  } = usePatient();

  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [activeTab, setActiveTab] = useState("vitals");
  const [chartData, setChartData] = useState(null);

  // Load patient data on component mount
  useEffect(() => {
    if (patientId) {
      loadPatient(patientId);
    }
  }, [patientId, loadPatient]);

  // Format patient data for charts
  useEffect(() => {
    if (currentPatient) {
      setChartData(formatPatientDataForCharts(currentPatient));
    }
  }, [currentPatient]);

  const handleBackClick = () => {
    navigate("/dashboard");
  };

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!validateNoteContent(newNote)) {
      alert("Note content must be at least 5 characters");
      return;
    }

    try {
      await addNote(patientId, newNote);
      setNewNote("");
    } catch (error) {
      console.error("Add note error:", error);
      alert("Failed to add note. Please try again.");
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setEditNoteContent(note.note_content);
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();

    if (!validateNoteContent(editNoteContent)) {
      alert("Note content must be at least 5 characters");
      return;
    }

    try {
      await updateNote(editingNote, editNoteContent);
      setEditingNote(null);
      setEditNoteContent("");
    } catch (error) {
      console.error("Update note error:", error);
      alert("Failed to update note. Please try again.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error("Delete note error:", error);
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditNoteContent("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="w-full max-w-lg glass rounded-2xl shadow-xl border border-white/40 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={handleBackClick}
            className="px-4 py-2 rounded-lg text-white btn-gradient"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="w-full max-w-lg glass rounded-2xl shadow-xl border border-white/40 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Patient Not Found
          </h2>
          <p className="text-gray-700 mb-4">
            The requested patient could not be found.
          </p>
          <button
            onClick={handleBackClick}
            className="px-4 py-2 rounded-lg text-white btn-gradient"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-light px-4 sm:px-5 lg:px-6 xl:px-8 py-6">
      <header className="flex items-center justify-between w-full mx-auto mb-6">
        <button
          className="text-emerald-700 hover:underline"
          onClick={handleBackClick}
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Patient Profile: {currentPatient.name}
        </h1>
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </header>

      <div className="w-full mx-auto">
        <div className="mb-4 text-sm text-gray-600">
          ID: {currentPatient.id}
        </div>

        <div className="flex gap-2 mb-4">
          {["vitals", "notes", "sessions"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-full border transition ${
                activeTab === tab
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "vitals"
                ? "Vitals & Graphs"
                : tab === "notes"
                ? "Notes"
                : "Session Logs"}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === "vitals" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass p-4 rounded-xl border border-white/40">
                  <h3 className="text-sm font-medium text-gray-600">
                    Current Mood
                  </h3>
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {currentPatient.mood || "N/A"}
                  </div>
                </div>
                <div className="glass p-4 rounded-xl border border-white/40">
                  <h3 className="text-sm font-medium text-gray-600">
                    Current Stress
                  </h3>
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {currentPatient.stress || "N/A"}
                  </div>
                </div>
                <div className="glass p-4 rounded-xl border border-white/40">
                  <h3 className="text-sm font-medium text-gray-600">
                    Current Symptoms
                  </h3>
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {currentPatient.symptoms || "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {chartData?.mood && (
                  <div className="glass p-4 rounded-xl border border-white/40">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      Mood Over Time
                    </h3>
                    <Line data={chartData.mood} />
                  </div>
                )}
                {chartData?.stress && (
                  <div className="glass p-4 rounded-xl border border-white/40">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      Stress Over Time
                    </h3>
                    <Line data={chartData.stress} />
                  </div>
                )}
                {chartData?.symptoms && (
                  <div className="glass p-4 rounded-xl border border-white/40 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      Symptoms Over Time
                    </h3>
                    <Line data={chartData.symptoms} />
                  </div>
                )}
                {!chartData?.mood &&
                  !chartData?.stress &&
                  !chartData?.symptoms && (
                    <div className="text-sm text-gray-600">
                      No historical data available for this patient
                    </div>
                  )}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6">
              <div className="glass p-4 rounded-xl border border-white/40">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Add New Note
                </h3>
                <form onSubmit={handleAddNote} className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    aria-label="New note contents"
                    rows={4}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white btn-gradient"
                  >
                    Add Note
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Patient Notes
                </h3>
                {patientNotes.length === 0 ? (
                  <div className="text-sm text-gray-600">
                    No notes available for this patient
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientNotes.map((note) => (
                      <div
                        key={note.id}
                        className="glass p-4 rounded-xl border border-white/40"
                      >
                        {editingNote === note.id ? (
                          <form
                            onSubmit={handleUpdateNote}
                            className="space-y-3"
                          >
                            <textarea
                              value={editNoteContent}
                              onChange={(e) =>
                                setEditNoteContent(e.target.value)
                              }
                              rows={4}
                              required
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="px-3 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="text-gray-800 mb-2 whitespace-pre-wrap">
                              {note.note_content}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div>{formatDate(note.created_at)}</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditNote(note)}
                                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">
                Session History
              </h3>
              {sessionLogs.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No session logs available for this patient
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {sessionLogs.map((session) => (
                    <div
                      key={session.id}
                      className="glass p-4 rounded-xl border border-white/40"
                    >
                      <div className="font-medium text-gray-800 mb-1">
                        Session on {formatDate(session.session_date)}
                      </div>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {session.session_summary}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
