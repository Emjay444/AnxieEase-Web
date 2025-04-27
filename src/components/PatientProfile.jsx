import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { usePatient } from '../contexts/PatientContext';
import { formatDate, formatPatientDataForCharts } from '../utils/apiHelpers';
import { validateNoteContent } from '../utils/validation';
import LogoutButton from './LogoutButton';

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

  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState('vitals');
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
    navigate('/dashboard');
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!validateNoteContent(newNote)) {
      alert('Note content must be at least 5 characters');
      return;
    }
    
    try {
      await addNote(patientId, newNote);
      setNewNote('');
    } catch (error) {
      console.error('Add note error:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setEditNoteContent(note.note_content);
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    
    if (!validateNoteContent(editNoteContent)) {
      alert('Note content must be at least 5 characters');
      return;
    }
    
    try {
      await updateNote(editingNote, editNoteContent);
      setEditingNote(null);
      setEditNoteContent('');
    } catch (error) {
      console.error('Update note error:', error);
      alert('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Delete note error:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditNoteContent('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading patient data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleBackClick}>Back to Dashboard</button>
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="not-found-container">
        <h2>Patient Not Found</h2>
        <p>The requested patient could not be found.</p>
        <button onClick={handleBackClick}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="patient-profile-container">
      <header className="profile-header">
        <button className="back-button" onClick={handleBackClick}>
          &larr; Back to Dashboard
        </button>
        <h1>Patient Profile: {currentPatient.name}</h1>
        <LogoutButton />
      </header>

      <div className="patient-info">
        <div className="patient-id">ID: {currentPatient.id}</div>
        {/* Add more patient info here */}
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'vitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('vitals')}
        >
          Vitals & Graphs
        </button>
        <button
          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
        <button
          className={`tab-button ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Session Logs
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'vitals' && (
          <div className="vitals-tab">
            <div className="vitals-summary">
              <div className="vital-card">
                <h3>Current Mood</h3>
                <div className="vital-value">{currentPatient.mood || 'N/A'}</div>
              </div>
              <div className="vital-card">
                <h3>Current Stress</h3>
                <div className="vital-value">{currentPatient.stress || 'N/A'}</div>
              </div>
              <div className="vital-card">
                <h3>Current Symptoms</h3>
                <div className="vital-value">{currentPatient.symptoms || 'N/A'}</div>
              </div>
            </div>

            <div className="charts-container">
              {chartData?.mood && (
                <div className="chart-wrapper">
                  <h3>Mood Over Time</h3>
                  <Line data={chartData.mood} />
                </div>
              )}
              
              {chartData?.stress && (
                <div className="chart-wrapper">
                  <h3>Stress Over Time</h3>
                  <Line data={chartData.stress} />
                </div>
              )}
              
              {chartData?.symptoms && (
                <div className="chart-wrapper">
                  <h3>Symptoms Over Time</h3>
                  <Line data={chartData.symptoms} />
                </div>
              )}
              
              {!chartData?.mood && !chartData?.stress && !chartData?.symptoms && (
                <div className="no-chart-data">
                  No historical data available for this patient
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-tab">
            <div className="add-note-form">
              <h3>Add New Note</h3>
              <form onSubmit={handleAddNote}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  rows={4}
                  required
                ></textarea>
                <button type="submit">Add Note</button>
              </form>
            </div>

            <div className="notes-list">
              <h3>Patient Notes</h3>
              
              {patientNotes.length === 0 ? (
                <div className="no-notes">No notes available for this patient</div>
              ) : (
                <div className="notes-container">
                  {patientNotes.map(note => (
                    <div key={note.id} className="note-card">
                      {editingNote === note.id ? (
                        <form onSubmit={handleUpdateNote} className="edit-note-form">
                          <textarea
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            rows={4}
                            required
                          ></textarea>
                          <div className="edit-note-actions">
                            <button type="submit">Save</button>
                            <button type="button" onClick={handleCancelEdit}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="note-content">{note.note_content}</div>
                          <div className="note-meta">
                            <div className="note-date">
                              {formatDate(note.created_at)}
                            </div>
                            <div className="note-actions">
                              <button
                                onClick={() => handleEditNote(note)}
                                className="edit-button"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="delete-button"
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

        {activeTab === 'sessions' && (
          <div className="sessions-tab">
            <h3>Session History</h3>
            
            {sessionLogs.length === 0 ? (
              <div className="no-sessions">No session logs available for this patient</div>
            ) : (
              <div className="sessions-list">
                {sessionLogs.map(session => (
                  <div key={session.id} className="session-card">
                    <div className="session-header">
                      <h4>Session on {formatDate(session.session_date)}</h4>
                    </div>
                    <div className="session-summary">
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
  );
};

export default PatientProfile;
