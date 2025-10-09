import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { patientService } from './patientService';
import { appointmentService } from './appointmentService';
import { anxietyService } from './anxietyService';

export const reportService = {
  // Generate comprehensive patient report data
  async generatePatientReportData(patientId, psychologistId) {
    try {
      console.log('Generating report data for patient:', patientId);
      
      // Get patient basic info
      const patient = await patientService.getPatientById(patientId);
      
      // Get mood logs
      const moodLogs = await patientService.getPatientMoodLogs(patientId);
      
      // Get patient notes
      const patientNotes = await patientService.getPatientNotes(patientId);
      
      // Get session logs
      const sessionLogs = await patientService.getPatientSessionLogs(patientId);
      
      // Get appointments
      const appointments = await appointmentService.getAppointmentsByPatient(patientId);
      
      // Get anxiety data if available
      let anxietyData = null;
      try {
        anxietyData = await anxietyService.getAnxietySummary(patientId);
      } catch (error) {
        console.log('Anxiety data not available:', error.message);
      }

      // Calculate summary statistics
      const stats = this.calculatePatientStats(patient, moodLogs, appointments, anxietyData);
      
      return {
        patient,
        moodLogs,
        patientNotes,
        sessionLogs,
        appointments,
        anxietyData,
        stats,
        generatedAt: new Date().toISOString(),
        psychologistId
      };
    } catch (error) {
      console.error('Error generating patient report data:', error);
      throw error;
    }
  },

  // Calculate summary statistics for the report
  calculatePatientStats(patient, moodLogs, appointments, anxietyData) {
    const stats = {
      totalSessions: appointments ? appointments.filter(apt => apt.status === 'completed').length : 0,
      totalMoodEntries: moodLogs ? moodLogs.length : 0,
      avgMoodScore: 0,
      avgStressLevel: 0,
      totalAnxietyAttacks: 0,
      attackRatePerWeek: 0,
      mostCommonMood: 'N/A',
      stressLevelTrend: 'N/A',
      lastActivity: null,
      improvementTrend: 'Stable',
      monthlyAttackData: {},
      mostAttacksMonth: 'N/A',
      leastAttacksMonth: 'N/A',
      weeklyAttackRate: 0,
      stressDistribution: { low: 0, medium: 0, high: 0 },
      moodDistribution: {},
      symptomFrequency: {}
    };

    // Calculate comprehensive mood and anxiety statistics
    if (moodLogs && moodLogs.length > 0) {
      // Calculate average mood score (convert mood strings to numbers)
      const moodScores = moodLogs.map(log => {
        switch (log.mood?.toLowerCase()) {
          case 'happy': return 9;
          case 'calm': return 8;
          case 'content': return 7;
          case 'neutral': return 5;
          case 'sad': return 3;
          case 'anxious': return 2;
          case 'angry': return 1;
          case 'fearful': return 2;
          default: return 5;
        }
      });
      
      stats.avgMoodScore = (moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length).toFixed(1);
      
      // Calculate stress levels
      const stressScores = [];
      const stressDistribution = { low: 0, medium: 0, high: 0 };
      
      moodLogs.forEach(log => {
        let stressScore = 0;
        const stressLevel = (log.stress_level || '').toLowerCase();
        
        if (stressLevel === 'low' || log.stress_level_value <= 3) {
          stressScore = log.stress_level_value || 2;
          stressDistribution.low++;
        } else if (stressLevel === 'medium' || (log.stress_level_value > 3 && log.stress_level_value <= 6)) {
          stressScore = log.stress_level_value || 5;
          stressDistribution.medium++;
        } else if (stressLevel === 'high' || log.stress_level_value > 6) {
          stressScore = log.stress_level_value || 8;
          stressDistribution.high++;
        } else {
          stressScore = 5; // Default
          stressDistribution.medium++;
        }
        
        stressScores.push(stressScore);
      });
      
      stats.avgStressLevel = stressScores.length > 0 ? 
        (stressScores.reduce((sum, score) => sum + score, 0) / stressScores.length).toFixed(1) : 0;
      stats.stressDistribution = stressDistribution;
      
      // Count anxiety attacks and panic-related symptoms
      let anxietyAttacks = 0;
      const monthlyAttacks = {};
      const symptomFrequency = {};
      
      moodLogs.forEach(log => {
        const logDate = new Date(log.log_date || log.created_at);
        const monthKey = logDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        // Count as anxiety attack if mood is anxious/fearful or has panic symptoms
        const isAnxietyAttack = log.mood?.toLowerCase() === 'anxious' || 
                               log.mood?.toLowerCase() === 'fearful' ||
                               (log.symptoms && Array.isArray(log.symptoms) && 
                                log.symptoms.some(symptom => 
                                  symptom.toLowerCase().includes('panic') ||
                                  symptom.toLowerCase().includes('anxiety') ||
                                  symptom.toLowerCase().includes('shortness of breath') ||
                                  symptom.toLowerCase().includes('racing thoughts') ||
                                  symptom.toLowerCase().includes('rapid heartbeat')
                                ));
        
        if (isAnxietyAttack) {
          anxietyAttacks++;
          monthlyAttacks[monthKey] = (monthlyAttacks[monthKey] || 0) + 1;
        }
        
        // Track symptom frequency
        if (log.symptoms && Array.isArray(log.symptoms)) {
          log.symptoms.forEach(symptom => {
            if (symptom && symptom !== 'None') {
              symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
            }
          });
        }
      });
      
      stats.totalAnxietyAttacks = anxietyAttacks;
      stats.monthlyAttackData = monthlyAttacks;
      stats.symptomFrequency = symptomFrequency;
      
      // Find month with most and least attacks
      if (Object.keys(monthlyAttacks).length > 0) {
        const months = Object.keys(monthlyAttacks);
        stats.mostAttacksMonth = months.reduce((a, b) => monthlyAttacks[a] > monthlyAttacks[b] ? a : b);
        stats.leastAttacksMonth = months.reduce((a, b) => monthlyAttacks[a] < monthlyAttacks[b] ? a : b);
      }
      
      // Calculate weekly attack rate
      const timeSpan = moodLogs.length > 1 ? 
        Math.abs(new Date(moodLogs[0].log_date || moodLogs[0].created_at) - 
                new Date(moodLogs[moodLogs.length - 1].log_date || moodLogs[moodLogs.length - 1].created_at)) 
        : 0;
      const weeks = Math.max(1, timeSpan / (1000 * 60 * 60 * 24 * 7));
      stats.attackRatePerWeek = (anxietyAttacks / weeks).toFixed(1);
      stats.weeklyAttackRate = stats.attackRatePerWeek;
      
      // Find most common mood
      const moodFrequency = {};
      moodLogs.forEach(log => {
        const mood = log.mood || 'Unknown';
        moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
      });
      
      stats.moodDistribution = moodFrequency;
      stats.mostCommonMood = Object.keys(moodFrequency).length > 0 ? 
        Object.keys(moodFrequency).reduce((a, b) => moodFrequency[a] > moodFrequency[b] ? a : b) : 'N/A';

      // Determine improvement trend (comparing first half vs second half of logs)
      if (moodLogs.length >= 4) {
        const halfPoint = Math.floor(moodLogs.length / 2);
        const firstHalfAvg = moodScores.slice(0, halfPoint).reduce((sum, score) => sum + score, 0) / halfPoint;
        const secondHalfAvg = moodScores.slice(halfPoint).reduce((sum, score) => sum + score, 0) / (moodLogs.length - halfPoint);
        
        // Also consider anxiety attack frequency for improvement
        const firstHalfAttacks = moodLogs.slice(0, halfPoint).filter(log => 
          log.mood?.toLowerCase() === 'anxious' || log.mood?.toLowerCase() === 'fearful').length;
        const secondHalfAttacks = moodLogs.slice(halfPoint).filter(log => 
          log.mood?.toLowerCase() === 'anxious' || log.mood?.toLowerCase() === 'fearful').length;
        
        const moodImprovement = secondHalfAvg > firstHalfAvg + 0.5;
        const anxietyImprovement = secondHalfAttacks < firstHalfAttacks;
        
        if (moodImprovement && anxietyImprovement) {
          stats.improvementTrend = 'Significantly Improving';
        } else if (moodImprovement || anxietyImprovement) {
          stats.improvementTrend = 'Improving';
        } else if (secondHalfAvg < firstHalfAvg - 0.5 || secondHalfAttacks > firstHalfAttacks) {
          stats.improvementTrend = 'Declining';
        } else {
          stats.improvementTrend = 'Stable';
        }
      }

      // Get last activity date
      const sortedLogs = [...moodLogs].sort((a, b) => new Date(b.log_date || b.created_at) - new Date(a.log_date || a.created_at));
      if (sortedLogs.length > 0) {
        stats.lastActivity = sortedLogs[0].log_date || sortedLogs[0].created_at;
      }
    }

    // Include anxiety service data if available
    if (anxietyData) {
      stats.totalAnxietyAttacks = Math.max(stats.totalAnxietyAttacks, anxietyData.totalAttacks || 0);
      if (anxietyData.attackRatePerWeek) {
        stats.attackRatePerWeek = anxietyData.attackRatePerWeek;
        stats.weeklyAttackRate = anxietyData.attackRatePerWeek;
      }
    }

    return stats;
  },

  // Export patient data as CSV
  async exportPatientDataCSV(reportData) {
    const { patient, moodLogs, patientNotes, sessionLogs, appointments, stats } = reportData;
    
    // Prepare CSV data structure
    const csvData = [];
    
    // Add patient info header
    csvData.push(['PATIENT REPORT']);
    csvData.push(['Generated:', new Date().toLocaleString()]);
    csvData.push(['Patient Name:', patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()]);
    csvData.push(['Patient ID:', patient.id]);
    csvData.push(['Email:', patient.email || 'N/A']);
    csvData.push([]);

    // Add summary statistics
    csvData.push(['SUMMARY STATISTICS']);
    csvData.push(['Total Sessions:', stats.totalSessions]);
    csvData.push(['Total Mood Entries:', stats.totalMoodEntries]);
    csvData.push(['Average Mood Score:', `${stats.avgMoodScore}/10`]);
    csvData.push(['Average Stress Level:', `${stats.avgStressLevel}/10`]);
    csvData.push(['Most Common Mood:', stats.mostCommonMood]);
    csvData.push(['Total Anxiety Attacks:', stats.totalAnxietyAttacks]);
    csvData.push(['Attack Rate (per week):', stats.attackRatePerWeek]);
    csvData.push(['Improvement Trend:', stats.improvementTrend]);
    csvData.push(['Month with Most Attacks:', `${stats.mostAttacksMonth} (${stats.monthlyAttackData[stats.mostAttacksMonth] || 0} attacks)`]);
    csvData.push(['Month with Least Attacks:', `${stats.leastAttacksMonth} (${stats.monthlyAttackData[stats.leastAttacksMonth] || 0} attacks)`]);
    csvData.push(['Last Activity:', stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'N/A']);
    csvData.push([]);

    // Add stress level distribution
    csvData.push(['STRESS LEVEL DISTRIBUTION']);
    csvData.push(['Low Stress Days:', stats.stressDistribution.low]);
    csvData.push(['Medium Stress Days:', stats.stressDistribution.medium]);
    csvData.push(['High Stress Days:', stats.stressDistribution.high]);
    csvData.push([]);

    // Add monthly attack breakdown
    if (Object.keys(stats.monthlyAttackData).length > 0) {
      csvData.push(['MONTHLY ANXIETY ATTACKS']);
      csvData.push(['Month', 'Number of Attacks']);
      Object.entries(stats.monthlyAttackData)
        .sort(([,a], [,b]) => b - a) // Sort by attack count, highest first
        .forEach(([month, count]) => {
          csvData.push([month, count]);
        });
      csvData.push([]);
    }

    // Add top symptoms
    if (Object.keys(stats.symptomFrequency).length > 0) {
      csvData.push(['MOST COMMON SYMPTOMS']);
      csvData.push(['Symptom', 'Frequency']);
      Object.entries(stats.symptomFrequency)
        .sort(([,a], [,b]) => b - a) // Sort by frequency, highest first
        .slice(0, 10) // Top 10 symptoms
        .forEach(([symptom, frequency]) => {
          csvData.push([symptom, frequency]);
        });
      csvData.push([]);
    }

    // Add mood logs
    if (moodLogs && moodLogs.length > 0) {
      csvData.push(['MOOD LOGS']);
      csvData.push(['Date', 'Mood', 'Stress Level', 'Symptoms', 'Notes']);
      
      moodLogs.forEach(log => {
        csvData.push([
          log.log_date ? new Date(log.log_date).toLocaleDateString() : 'N/A',
          log.mood || 'N/A',
          log.stress_level || 'N/A',
          Array.isArray(log.symptoms) ? log.symptoms.join('; ') : (log.symptoms || 'None'),
          log.notes || ''
        ]);
      });
      csvData.push([]);
    }

    // Add appointments
    if (appointments && appointments.length > 0) {
      csvData.push(['APPOINTMENTS']);
      csvData.push(['Date', 'Time', 'Status', 'Type', 'Notes']);
      
      appointments.forEach(apt => {
        const aptDate = apt.appointment_date || apt.requestedDate || apt.requestDate;
        csvData.push([
          aptDate ? new Date(aptDate).toLocaleDateString() : 'N/A',
          aptDate ? new Date(aptDate).toLocaleTimeString() : 'N/A',
          apt.status || 'N/A',
          apt.appointment_type || 'Consultation',
          apt.psychologist_response || apt.notes || ''
        ]);
      });
      csvData.push([]);
    }

    // Add patient notes
    if (patientNotes && patientNotes.length > 0) {
      csvData.push(['PATIENT NOTES']);
      csvData.push(['Date', 'Note', 'Psychologist']);
      
      patientNotes.forEach(note => {
        csvData.push([
          note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A',
          note.note_content || note.content || '',
          note.psychologists?.name || 'Unknown'
        ]);
      });
      csvData.push([]);
    }

    // Add session logs
    if (sessionLogs && sessionLogs.length > 0) {
      csvData.push(['SESSION LOGS']);
      csvData.push(['Date', 'Duration (min)', 'Summary']);
      
      sessionLogs.forEach(session => {
        csvData.push([
          session.session_date ? new Date(session.session_date).toLocaleDateString() : 'N/A',
          session.session_duration || 'N/A',
          session.session_notes || session.session_summary || ''
        ]);
      });
    }

    // Convert to CSV string
    const csv = Papa.unparse(csvData);
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `patient_report_${patient.name || patient.id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return csv;
  },

  // Export patient data as PDF
  async exportPatientDataPDF(reportData) {
    const { patient, moodLogs, patientNotes, sessionLogs, appointments, stats } = reportData;
    
    // Create new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    
    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to check if new page is needed
    const checkNewPage = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Report', margin, yPosition);
    yPosition += 15;

    // Patient information
    pdf.setFontSize(14);
    pdf.text('Patient Information', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`Name: ${patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Patient ID: ${patient.id}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Email: ${patient.email || 'N/A'}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Report Generated: ${new Date().toLocaleString()}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Summary Statistics
    checkNewPage(80);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Statistics', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`Total Sessions: ${stats.totalSessions}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Total Mood Entries: ${stats.totalMoodEntries}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Average Mood Score: ${stats.avgMoodScore}/10`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Average Stress Level: ${stats.avgStressLevel}/10`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Most Common Mood: ${stats.mostCommonMood}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Total Anxiety Attacks: ${stats.totalAnxietyAttacks}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Attack Rate (per week): ${stats.attackRatePerWeek}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Improvement Trend: ${stats.improvementTrend}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Last Activity: ${stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'N/A'}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Anxiety Attack Analysis
    if (stats.totalAnxietyAttacks > 0) {
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Anxiety Attack Analysis', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(`Month with Most Attacks: ${stats.mostAttacksMonth} (${stats.monthlyAttackData[stats.mostAttacksMonth] || 0} attacks)`, margin, yPosition, pageWidth - 2 * margin);
      yPosition = addWrappedText(`Month with Least Attacks: ${stats.leastAttacksMonth} (${stats.monthlyAttackData[stats.leastAttacksMonth] || 0} attacks)`, margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;

      // Monthly breakdown
      if (Object.keys(stats.monthlyAttackData).length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Monthly Attack Breakdown:', margin, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        Object.entries(stats.monthlyAttackData)
          .sort(([,a], [,b]) => b - a)
          .forEach(([month, count]) => {
            checkNewPage(5);
            yPosition = addWrappedText(`${month}: ${count} attacks`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
          });
        yPosition += 5;
      }
    }

    // Stress Level Distribution
    checkNewPage(30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Stress Level Distribution', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`Low Stress Days: ${stats.stressDistribution.low}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`Medium Stress Days: ${stats.stressDistribution.medium}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition = addWrappedText(`High Stress Days: ${stats.stressDistribution.high}`, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Top Symptoms
    if (Object.keys(stats.symptomFrequency).length > 0) {
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Most Common Symptoms', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const topSymptoms = Object.entries(stats.symptomFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
      
      topSymptoms.forEach(([symptom, frequency], index) => {
        checkNewPage(5);
        yPosition = addWrappedText(`${index + 1}. ${symptom}: ${frequency} times`, margin, yPosition, pageWidth - 2 * margin, 9);
      });
      yPosition += 10;
    }

    // Mood Logs Section
    if (moodLogs && moodLogs.length > 0) {
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recent Mood Logs', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      // Take last 10 mood logs
      const recentMoodLogs = moodLogs.slice(0, 10);
      recentMoodLogs.forEach((log, index) => {
        checkNewPage(25);
        const date = log.log_date ? new Date(log.log_date).toLocaleDateString() : 'N/A';
        yPosition = addWrappedText(`${index + 1}. ${date} - Mood: ${log.mood || 'N/A'}, Stress: ${log.stress_level || 'N/A'}`, margin, yPosition, pageWidth - 2 * margin, 9);
        
        if (log.symptoms && Array.isArray(log.symptoms) && log.symptoms.length > 0) {
          yPosition = addWrappedText(`   Symptoms: ${log.symptoms.join(', ')}`, margin, yPosition, pageWidth - 2 * margin, 8);
        }
        
        if (log.notes && log.notes.trim()) {
          yPosition = addWrappedText(`   Notes: ${log.notes}`, margin, yPosition, pageWidth - 2 * margin, 8);
        }
        yPosition += 3;
      });
      yPosition += 5;
    }

    // Appointments Section
    if (appointments && appointments.length > 0) {
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Appointments', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      appointments.slice(0, 10).forEach((apt, index) => {
        checkNewPage(20);
        const aptDate = apt.appointment_date || apt.requestedDate || apt.requestDate;
        const date = aptDate ? new Date(aptDate).toLocaleDateString() : 'N/A';
        const time = aptDate ? new Date(aptDate).toLocaleTimeString() : 'N/A';
        
        yPosition = addWrappedText(`${index + 1}. ${date} at ${time} - Status: ${apt.status || 'N/A'}`, margin, yPosition, pageWidth - 2 * margin, 9);
        
        if (apt.psychologist_response || apt.notes) {
          yPosition = addWrappedText(`   Notes: ${apt.psychologist_response || apt.notes}`, margin, yPosition, pageWidth - 2 * margin, 8);
        }
        yPosition += 3;
      });
      yPosition += 5;
    }

    // Patient Notes Section
    if (patientNotes && patientNotes.length > 0) {
      checkNewPage(60);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Notes', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      patientNotes.slice(0, 5).forEach((note, index) => {
        checkNewPage(30);
        const date = note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A';
        const psychologist = note.psychologists?.name || 'Unknown';
        
        yPosition = addWrappedText(`${index + 1}. ${date} (by ${psychologist}):`, margin, yPosition, pageWidth - 2 * margin, 9);
        yPosition = addWrappedText(`${note.note_content || note.content || 'No content'}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 8);
        yPosition += 5;
      });
    }

    // Save PDF
    const fileName = `patient_report_${patient.name || patient.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return pdf;
  },

  // Generate batch report for multiple patients
  async generateBatchPatientReport(patientIds, psychologistId, format = 'pdf') {
    try {
      const batchData = [];
      
      for (const patientId of patientIds) {
        const reportData = await this.generatePatientReportData(patientId, psychologistId);
        batchData.push(reportData);
      }

      if (format === 'csv') {
        return this.exportBatchPatientDataCSV(batchData);
      } else {
        return this.exportBatchPatientDataPDF(batchData);
      }
    } catch (error) {
      console.error('Error generating batch report:', error);
      throw error;
    }
  },

  // Export batch data as CSV
  async exportBatchPatientDataCSV(batchData) {
    const csvData = [];
    
    // Add batch report header
    csvData.push(['BATCH PATIENT REPORT']);
    csvData.push(['Generated:', new Date().toLocaleString()]);
    csvData.push(['Total Patients:', batchData.length]);
    csvData.push([]);

    // Add each patient's data
    batchData.forEach((reportData, index) => {
      const { patient, stats } = reportData;
      
      csvData.push([`PATIENT ${index + 1}: ${patient.name || patient.id}`]);
      csvData.push(['Patient ID:', patient.id]);
      csvData.push(['Email:', patient.email || 'N/A']);
      csvData.push(['Total Sessions:', stats.totalSessions]);
      csvData.push(['Total Mood Entries:', stats.totalMoodEntries]);
      csvData.push(['Average Mood Score:', `${stats.avgMoodScore}/10`]);
      csvData.push(['Average Stress Level:', `${stats.avgStressLevel}/10`]);
      csvData.push(['Most Common Mood:', stats.mostCommonMood]);
      csvData.push(['Total Anxiety Attacks:', stats.totalAnxietyAttacks]);
      csvData.push(['Attack Rate (per week):', stats.attackRatePerWeek]);
      csvData.push(['Improvement Trend:', stats.improvementTrend]);
      csvData.push(['Month with Most Attacks:', `${stats.mostAttacksMonth} (${stats.monthlyAttackData[stats.mostAttacksMonth] || 0})`]);
      csvData.push(['Month with Least Attacks:', `${stats.leastAttacksMonth} (${stats.monthlyAttackData[stats.leastAttacksMonth] || 0})`]);
      csvData.push([]);
    });

    // Convert to CSV and download
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `batch_patient_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return csv;
  },

  // Export batch data as PDF
  async exportBatchPatientDataPDF(batchData) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Batch Patient Report', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Total Patients: ${batchData.length}`, margin, yPosition);
    yPosition += 15;

    // Summary table
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Overview', margin, yPosition);
    yPosition += 10;

    // Table headers
    pdf.setFontSize(7);
    pdf.text('Patient Name', margin, yPosition);
    pdf.text('Sessions', margin + 45, yPosition);
    pdf.text('Mood Entries', margin + 65, yPosition);
    pdf.text('Avg Mood', margin + 90, yPosition);
    pdf.text('Attacks', margin + 110, yPosition);
    pdf.text('Attack Rate', margin + 130, yPosition);
    pdf.text('Trend', margin + 155, yPosition);
    yPosition += 5;

    // Table data
    batchData.forEach((reportData) => {
      const { patient, stats } = reportData;
      
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFont('helvetica', 'normal');
      const patientName = (patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()).substring(0, 20);
      pdf.text(patientName, margin, yPosition);
      pdf.text(stats.totalSessions.toString(), margin + 45, yPosition);
      pdf.text(stats.totalMoodEntries.toString(), margin + 65, yPosition);
      pdf.text(stats.avgMoodScore.toString(), margin + 90, yPosition);
      pdf.text(stats.totalAnxietyAttacks.toString(), margin + 110, yPosition);
      pdf.text(stats.attackRatePerWeek.toString(), margin + 130, yPosition);
      pdf.text(stats.improvementTrend.substring(0, 10), margin + 155, yPosition);
      yPosition += 5;
    });

    // Save PDF
    const fileName = `batch_patient_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return pdf;
  }
};