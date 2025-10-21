import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Papa from "papaparse";
import { patientService } from "./patientService";
import { appointmentService } from "./appointmentService";
import { anxietyService } from "./anxietyService";

export const reportService = {
  // Generate comprehensive patient report data
  async generatePatientReportData(patientId, psychologistId) {
    try {
      console.log("Generating report data for patient:", patientId);

      // Get patient basic info
      const patient = await patientService.getPatientById(patientId);

      // Get mood logs
      const moodLogs = await patientService.getPatientMoodLogs(patientId);

      // Get patient notes
      const patientNotes = await patientService.getPatientNotes(patientId);

      // Get session logs
      const sessionLogs = await patientService.getPatientSessionLogs(patientId);

      // Get appointments
      const appointments = await appointmentService.getAppointmentsByPatient(
        patientId
      );

      // Get anxiety data if available
      let anxietyData = null;
      try {
        anxietyData = await anxietyService.getAnxietySummary(patientId);
      } catch (error) {
        console.log("Anxiety data not available:", error.message);
      }

      // Calculate summary statistics
      const stats = this.calculatePatientStats(
        patient,
        moodLogs,
        appointments,
        anxietyData
      );

      return {
        patient,
        moodLogs,
        patientNotes,
        sessionLogs,
        appointments,
        anxietyData,
        stats,
        generatedAt: new Date().toISOString(),
        psychologistId,
      };
    } catch (error) {
      console.error("Error generating patient report data:", error);
      throw error;
    }
  },

  // Calculate summary statistics for the report
  calculatePatientStats(patient, moodLogs, appointments, anxietyData) {
    const stats = {
      totalSessions: appointments
        ? appointments.filter((apt) => apt.status === "completed").length
        : 0,
      totalMoodEntries: moodLogs ? moodLogs.length : 0,
      avgMoodScore: 0,
      avgStressLevel: 0,
      totalAnxietyAttacks: 0,
      attackRatePerWeek: 0,
      mostCommonMood: "N/A",
      stressLevelTrend: "N/A",
      lastActivity: null,
      improvementTrend: "Stable",
      monthlyAttackData: {},
      mostAttacksMonth: "N/A",
      leastAttacksMonth: "N/A",
      weeklyAttackRate: 0,
      stressDistribution: { low: 0, medium: 0, high: 0 },
      moodDistribution: {},
      symptomFrequency: {},
    };

    // Calculate comprehensive mood and anxiety statistics
    if (moodLogs && moodLogs.length > 0) {
      // Calculate average mood score (convert mood strings to numbers)
      const moodScores = moodLogs.map((log) => {
        switch (log.mood?.toLowerCase()) {
          case "happy":
            return 9;
          case "calm":
            return 8;
          case "content":
            return 7;
          case "neutral":
            return 5;
          case "sad":
            return 3;
          case "anxious":
            return 2;
          case "angry":
            return 1;
          case "fearful":
            return 2;
          default:
            return 5;
        }
      });

      stats.avgMoodScore = (
        moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
      ).toFixed(1);

      // Calculate stress levels
      const stressScores = [];
      const stressDistribution = { low: 0, medium: 0, high: 0 };

      moodLogs.forEach((log) => {
        let stressScore = 0;
        const stressLevel = (log.stress_level || "").toLowerCase();

        if (stressLevel === "low" || log.stress_level_value <= 3) {
          stressScore = log.stress_level_value || 2;
          stressDistribution.low++;
        } else if (
          stressLevel === "medium" ||
          (log.stress_level_value > 3 && log.stress_level_value <= 6)
        ) {
          stressScore = log.stress_level_value || 5;
          stressDistribution.medium++;
        } else if (stressLevel === "high" || log.stress_level_value > 6) {
          stressScore = log.stress_level_value || 8;
          stressDistribution.high++;
        } else {
          stressScore = 5; // Default
          stressDistribution.medium++;
        }

        stressScores.push(stressScore);
      });

      stats.avgStressLevel =
        stressScores.length > 0
          ? (
              stressScores.reduce((sum, score) => sum + score, 0) /
              stressScores.length
            ).toFixed(1)
          : 0;
      stats.stressDistribution = stressDistribution;

      // Count anxiety attacks and panic-related symptoms
      let anxietyAttacks = 0;
      const monthlyAttacks = {};
      const symptomFrequency = {};

      moodLogs.forEach((log) => {
        const logDate = new Date(log.log_date || log.created_at);
        const monthKey = logDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        // Count as anxiety attack if mood is anxious/fearful or has panic symptoms
        const isAnxietyAttack =
          log.mood?.toLowerCase() === "anxious" ||
          log.mood?.toLowerCase() === "fearful" ||
          (log.symptoms &&
            Array.isArray(log.symptoms) &&
            log.symptoms.some(
              (symptom) =>
                symptom.toLowerCase().includes("panic") ||
                symptom.toLowerCase().includes("anxiety") ||
                symptom.toLowerCase().includes("shortness of breath") ||
                symptom.toLowerCase().includes("racing thoughts") ||
                symptom.toLowerCase().includes("rapid heartbeat")
            ));

        if (isAnxietyAttack) {
          anxietyAttacks++;
          monthlyAttacks[monthKey] = (monthlyAttacks[monthKey] || 0) + 1;
        }

        // Track symptom frequency
        if (log.symptoms && Array.isArray(log.symptoms)) {
          log.symptoms.forEach((symptom) => {
            if (symptom && symptom !== "None") {
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
        stats.mostAttacksMonth = months.reduce((a, b) =>
          monthlyAttacks[a] > monthlyAttacks[b] ? a : b
        );
        stats.leastAttacksMonth = months.reduce((a, b) =>
          monthlyAttacks[a] < monthlyAttacks[b] ? a : b
        );
      }

      // Calculate weekly attack rate
      const timeSpan =
        moodLogs.length > 1
          ? Math.abs(
              new Date(moodLogs[0].log_date || moodLogs[0].created_at) -
                new Date(
                  moodLogs[moodLogs.length - 1].log_date ||
                    moodLogs[moodLogs.length - 1].created_at
                )
            )
          : 0;
      const weeks = Math.max(1, timeSpan / (1000 * 60 * 60 * 24 * 7));
      stats.attackRatePerWeek = (anxietyAttacks / weeks).toFixed(1);
      stats.weeklyAttackRate = stats.attackRatePerWeek;

      // Find most common mood
      const moodFrequency = {};
      moodLogs.forEach((log) => {
        const mood = log.mood || "Unknown";
        moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
      });

      stats.moodDistribution = moodFrequency;
      stats.mostCommonMood =
        Object.keys(moodFrequency).length > 0
          ? Object.keys(moodFrequency).reduce((a, b) =>
              moodFrequency[a] > moodFrequency[b] ? a : b
            )
          : "N/A";

      // Determine improvement trend (comparing first half vs second half of logs)
      if (moodLogs.length >= 4) {
        const halfPoint = Math.floor(moodLogs.length / 2);
        const firstHalfAvg =
          moodScores
            .slice(0, halfPoint)
            .reduce((sum, score) => sum + score, 0) / halfPoint;
        const secondHalfAvg =
          moodScores.slice(halfPoint).reduce((sum, score) => sum + score, 0) /
          (moodLogs.length - halfPoint);

        // Also consider anxiety attack frequency for improvement
        const firstHalfAttacks = moodLogs
          .slice(0, halfPoint)
          .filter(
            (log) =>
              log.mood?.toLowerCase() === "anxious" ||
              log.mood?.toLowerCase() === "fearful"
          ).length;
        const secondHalfAttacks = moodLogs
          .slice(halfPoint)
          .filter(
            (log) =>
              log.mood?.toLowerCase() === "anxious" ||
              log.mood?.toLowerCase() === "fearful"
          ).length;

        const moodImprovement = secondHalfAvg > firstHalfAvg + 0.5;
        const anxietyImprovement = secondHalfAttacks < firstHalfAttacks;

        if (moodImprovement && anxietyImprovement) {
          stats.improvementTrend = "Significantly Improving";
        } else if (moodImprovement || anxietyImprovement) {
          stats.improvementTrend = "Improving";
        } else if (
          secondHalfAvg < firstHalfAvg - 0.5 ||
          secondHalfAttacks > firstHalfAttacks
        ) {
          stats.improvementTrend = "Declining";
        } else {
          stats.improvementTrend = "Stable";
        }
      }

      // Get last activity date
      const sortedLogs = [...moodLogs].sort(
        (a, b) =>
          new Date(b.log_date || b.created_at) -
          new Date(a.log_date || a.created_at)
      );
      if (sortedLogs.length > 0) {
        stats.lastActivity = sortedLogs[0].log_date || sortedLogs[0].created_at;
      }
    }

    // Include anxiety service data if available
    if (anxietyData) {
      stats.totalAnxietyAttacks = Math.max(
        stats.totalAnxietyAttacks,
        anxietyData.totalAttacks || 0
      );
      if (anxietyData.attackRatePerWeek) {
        stats.attackRatePerWeek = anxietyData.attackRatePerWeek;
        stats.weeklyAttackRate = anxietyData.attackRatePerWeek;
      }
    }

    return stats;
  },

  // Export patient data as CSV
  async exportPatientDataCSV(reportData) {
    const {
      patient,
      moodLogs,
      patientNotes,
      sessionLogs,
      appointments,
      stats,
    } = reportData;

    // Prepare CSV data structure
    const csvData = [];

    // Add patient info header
    csvData.push(["PATIENT REPORT"]);
    csvData.push(["Generated:", new Date().toLocaleString()]);
    csvData.push([
      "Patient Name:",
      patient.name ||
        `${patient.first_name || ""} ${patient.last_name || ""}`.trim(),
    ]);
    csvData.push(["Patient ID:", patient.id]);
    csvData.push(["Email:", patient.email || "N/A"]);
    csvData.push([]);

    // Add summary statistics
    csvData.push(["SUMMARY STATISTICS"]);
    csvData.push(["Total Sessions:", stats.totalSessions]);
    csvData.push(["Total Mood Entries:", stats.totalMoodEntries]);
    csvData.push(["Average Mood Score:", `${stats.avgMoodScore}/10`]);
    csvData.push(["Average Stress Level:", `${stats.avgStressLevel}/10`]);
    csvData.push(["Most Common Mood:", stats.mostCommonMood]);
    csvData.push(["Total Anxiety Attacks:", stats.totalAnxietyAttacks]);
    csvData.push(["Attack Rate (per week):", stats.attackRatePerWeek]);
    csvData.push(["Improvement Trend:", stats.improvementTrend]);
    csvData.push([
      "Month with Most Attacks:",
      `${stats.mostAttacksMonth} (${
        stats.monthlyAttackData[stats.mostAttacksMonth] || 0
      } attacks)`,
    ]);
    csvData.push([
      "Month with Least Attacks:",
      `${stats.leastAttacksMonth} (${
        stats.monthlyAttackData[stats.leastAttacksMonth] || 0
      } attacks)`,
    ]);
    csvData.push([
      "Last Activity:",
      stats.lastActivity
        ? new Date(stats.lastActivity).toLocaleDateString()
        : "N/A",
    ]);
    csvData.push([]);

    // Add stress level distribution
    csvData.push(["STRESS LEVEL DISTRIBUTION"]);
    csvData.push(["Low Stress Days:", stats.stressDistribution.low]);
    csvData.push(["Medium Stress Days:", stats.stressDistribution.medium]);
    csvData.push(["High Stress Days:", stats.stressDistribution.high]);
    csvData.push([]);

    // Add monthly attack breakdown
    if (Object.keys(stats.monthlyAttackData).length > 0) {
      csvData.push(["MONTHLY ANXIETY ATTACKS"]);
      csvData.push(["Month", "Number of Attacks"]);
      Object.entries(stats.monthlyAttackData)
        .sort(([, a], [, b]) => b - a) // Sort by attack count, highest first
        .forEach(([month, count]) => {
          csvData.push([month, count]);
        });
      csvData.push([]);
    }

    // Add top symptoms
    if (Object.keys(stats.symptomFrequency).length > 0) {
      csvData.push(["MOST COMMON SYMPTOMS"]);
      csvData.push(["Symptom", "Frequency"]);
      Object.entries(stats.symptomFrequency)
        .sort(([, a], [, b]) => b - a) // Sort by frequency, highest first
        .slice(0, 10) // Top 10 symptoms
        .forEach(([symptom, frequency]) => {
          csvData.push([symptom, frequency]);
        });
      csvData.push([]);
    }

    // Add mood logs
    if (moodLogs && moodLogs.length > 0) {
      csvData.push(["MOOD LOGS"]);
      csvData.push(["Date", "Mood", "Stress Level", "Symptoms", "Notes"]);

      moodLogs.forEach((log) => {
        csvData.push([
          log.log_date ? new Date(log.log_date).toLocaleDateString() : "N/A",
          log.mood || "N/A",
          log.stress_level || "N/A",
          Array.isArray(log.symptoms)
            ? log.symptoms.join("; ")
            : log.symptoms || "None",
          log.notes || "",
        ]);
      });
      csvData.push([]);
    }

    // Add appointments
    if (appointments && appointments.length > 0) {
      csvData.push(["APPOINTMENTS"]);
      csvData.push(["Date", "Time", "Status", "Type", "Notes"]);

      appointments.forEach((apt) => {
        const aptDate =
          apt.appointment_date || apt.requestedDate || apt.requestDate;
        csvData.push([
          aptDate ? new Date(aptDate).toLocaleDateString() : "N/A",
          aptDate ? new Date(aptDate).toLocaleTimeString() : "N/A",
          apt.status || "N/A",
          apt.appointment_type || "Consultation",
          apt.psychologist_response || apt.notes || "",
        ]);
      });
      csvData.push([]);
    }

    // Add patient notes
    if (patientNotes && patientNotes.length > 0) {
      csvData.push(["PATIENT NOTES"]);
      csvData.push(["Date", "Note", "Psychologist"]);

      patientNotes.forEach((note) => {
        csvData.push([
          note.created_at
            ? new Date(note.created_at).toLocaleDateString()
            : "N/A",
          note.note_content || note.content || "",
          note.psychologists?.name || "Unknown",
        ]);
      });
      csvData.push([]);
    }

    // Add session logs
    if (sessionLogs && sessionLogs.length > 0) {
      csvData.push(["SESSION LOGS"]);
      csvData.push(["Date", "Duration (min)", "Summary"]);

      sessionLogs.forEach((session) => {
        csvData.push([
          session.session_date
            ? new Date(session.session_date).toLocaleDateString()
            : "N/A",
          session.session_duration || "N/A",
          session.session_notes || session.session_summary || "",
        ]);
      });
    }

    // Convert to CSV string
    const csv = Papa.unparse(csvData);

    // Create and download file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `patient_report_${patient.name || patient.id}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return csv;
  },

  // Export patient data as PDF
  async exportPatientDataPDF(reportData) {
    const {
      patient,
      moodLogs,
      stats,
    } = reportData;

    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 25;
    const margin = 20;
    const lineHeight = 6;

    // Modern clean color palette
    const primaryColor = [16, 185, 129]; // Emerald-500
    const textDark = [55, 65, 81]; // Gray-700
    const textMedium = [107, 114, 128]; // Gray-500
    const textLight = [156, 163, 175]; // Gray-400

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + lines.length * lineHeight;
    };

    // Helper function to check if new page is needed
    const checkNewPage = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 25;
        return true;
      }
      return false;
    };

    // Helper to draw subtle border
    const drawBorder = (x, y, width, height, color = [229, 231, 235], lineWidth = 0.3) => {
      pdf.setDrawColor(...color);
      pdf.setLineWidth(lineWidth);
      pdf.rect(x, y, width, height);
    };

    // Helper to add clean section header
    const addSectionHeader = (title) => {
      checkNewPage(20);
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, margin, yPosition);
      
      // Minimal underline accent
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.8);
      pdf.line(margin, yPosition + 2, margin + 45, yPosition + 2);
      
      yPosition += 14;
      pdf.setTextColor(...textDark);
    };

    // Clean minimal header
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, 40, "F");
    
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("Patient Report", margin, 18);
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textMedium);
    pdf.text(`${new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })} • ${new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}`, margin, 28);
    
    // Subtle separator
    pdf.setDrawColor(...textLight);
    pdf.setLineWidth(0.2);
    pdf.line(margin, 34, pageWidth - margin, 34);
    
    yPosition = 48;
    pdf.setTextColor(...textDark);

    // Patient Information - Clean white card with minimal border
    checkNewPage(32);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 28, "F");
    drawBorder(margin, yPosition, pageWidth - 2 * margin, 28);
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text("Patient Information", margin + 4, yPosition + 7);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textDark);
    
    const patientName = patient.name || `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Unnamed Patient";
    pdf.text(patientName, margin + 4, yPosition + 15);
    
    pdf.setFontSize(9);
    pdf.setTextColor(...textMedium);
    pdf.text(`${patient.email || "N/A"}`, margin + 4, yPosition + 22);
    
    yPosition += 38;

    // Summary Statistics Section
    addSectionHeader("Summary Statistics");
    
    // Clean statistics grid - white boxes with subtle borders
    const statsData = [
      { label: "Sessions", value: stats.totalSessions, color: [59, 130, 246] },
      { label: "Mood Entries", value: stats.totalMoodEntries, color: [16, 185, 129] },
      { label: "Avg Mood", value: `${stats.avgMoodScore}/10`, color: [168, 85, 247] },
      { label: "Avg Stress", value: `${stats.avgStressLevel}/10`, color: [249, 115, 22] },
    ];
    
    const boxWidth = (pageWidth - 2 * margin - 12) / 2;
    const boxHeight = 24;
    let xPos = margin;
    let row = 0;
    
    statsData.forEach((stat, index) => {
      if (index % 2 === 0 && index > 0) {
        row++;
        xPos = margin;
      }
      
      const yPos = yPosition + (row * (boxHeight + 6));
      
      // White background with border
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xPos, yPos, boxWidth, boxHeight, "F");
      drawBorder(xPos, yPos, boxWidth, boxHeight);
      
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...stat.color);
      pdf.text(String(stat.value), xPos + 4, yPos + 12);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textMedium);
      pdf.text(stat.label, xPos + 4, yPos + 19);
      
      xPos += boxWidth + 6;
    });
    
    yPosition += (Math.ceil(statsData.length / 2) * (boxHeight + 6)) + 8;

    // Additional stats row
    const additionalStats = [
      { label: "Common Mood", value: stats.mostCommonMood, color: [236, 72, 153] },
      { label: "Anxiety Attacks", value: stats.totalAnxietyAttacks, color: [239, 68, 68] },
      { label: "Attack Rate/Week", value: stats.attackRatePerWeek, color: [234, 179, 8] },
    ];
    
    xPos = margin;
    row = 0;
    
    additionalStats.forEach((stat, index) => {
      if (index % 2 === 0 && index > 0) {
        row++;
        xPos = margin;
      }
      
      const yPos = yPosition + (row * (boxHeight + 6));
      checkNewPage(30);
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xPos, yPos, boxWidth, boxHeight, "F");
      drawBorder(xPos, yPos, boxWidth, boxHeight);
      
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...stat.color);
      pdf.text(String(stat.value), xPos + 4, yPos + 12);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textMedium);
      pdf.text(stat.label, xPos + 4, yPos + 19);
      
      xPos += boxWidth + 6;
    });
    
    yPosition += (Math.ceil(additionalStats.length / 2) * (boxHeight + 6)) + 8;

    // Improvement Trend - Clean inline display
    checkNewPage(16);
    const trendColor = stats.improvementTrend === "Improving" ? [16, 185, 129] : 
                       stats.improvementTrend === "Worsening" ? [239, 68, 68] : 
                       [107, 114, 128];
    
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 14, "F");
    drawBorder(margin, yPosition, pageWidth - 2 * margin, 14);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textDark);
    pdf.text("Trend:", margin + 4, yPosition + 6);
    
    pdf.setTextColor(...trendColor);
    pdf.text(stats.improvementTrend, margin + 22, yPosition + 6);
    
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textMedium);
    pdf.text(`Last: ${stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }) : "N/A"}`, margin + 4, yPosition + 11);
    
    yPosition += 22;

    // Anxiety Attack Analysis
    if (stats.totalAnxietyAttacks > 0) {
      addSectionHeader("Anxiety Attack Analysis");
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 22, "F");
      drawBorder(margin, yPosition, pageWidth - 2 * margin, 22);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...textDark);
      pdf.text("Most Attacks:", margin + 4, yPosition + 7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textMedium);
      pdf.text(`${stats.mostAttacksMonth} (${stats.monthlyAttackData[stats.mostAttacksMonth] || 0} attacks)`, margin + 30, yPosition + 7);
      
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...textDark);
      pdf.text("Least Attacks:", margin + 4, yPosition + 14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textMedium);
      pdf.text(`${stats.leastAttacksMonth} (${stats.monthlyAttackData[stats.leastAttacksMonth] || 0} attacks)`, margin + 30, yPosition + 14);
      
      yPosition += 26;
      
      // Monthly breakdown - condensed
      if (Object.keys(stats.monthlyAttackData).length > 0) {
        checkNewPage(30);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...textDark);
        pdf.text("Monthly Breakdown", margin, yPosition);
        yPosition += 7;

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textMedium);
        Object.entries(stats.monthlyAttackData)
          .sort(([, a], [, b]) => b - a)
          .forEach(([month, count]) => {
            checkNewPage(5);
            pdf.text(`${month}: ${count}`, margin + 2, yPosition);
            yPosition += 5;
          });
        yPosition += 6;
      }
    }

    // Stress Level Distribution - Clean horizontal layout
    addSectionHeader("Stress Distribution");
    
    const stressBoxWidth = (pageWidth - 2 * margin - 10) / 3;
    const stressBoxHeight = 26;
    const stressData = [
      { label: "Low", value: stats.stressDistribution.low, color: [16, 185, 129] },
      { label: "Medium", value: stats.stressDistribution.medium, color: [234, 179, 8] },
      { label: "High", value: stats.stressDistribution.high, color: [239, 68, 68] },
    ];
    
    xPos = margin;
    stressData.forEach((item) => {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xPos, yPosition, stressBoxWidth, stressBoxHeight, "F");
      drawBorder(xPos, yPosition, stressBoxWidth, stressBoxHeight);
      
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...item.color);
      pdf.text(String(item.value), xPos + stressBoxWidth / 2, yPosition + 13, { align: "center" });
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textMedium);
      pdf.text(item.label, xPos + stressBoxWidth / 2, yPosition + 20, { align: "center" });
      
      xPos += stressBoxWidth + 5;
    });
    
    yPosition += stressBoxHeight + 12;

    // Top Symptoms - Clean list
    if (Object.keys(stats.symptomFrequency).length > 0) {
      addSectionHeader("Common Symptoms");

      const topSymptoms = Object.entries(stats.symptomFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

      topSymptoms.forEach(([symptom, frequency], index) => {
        checkNewPage(6);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textDark);
        pdf.text(`${index + 1}. ${symptom}`, margin, yPosition);
        
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...primaryColor);
        pdf.text(`${frequency}×`, margin + 75, yPosition);
        
        yPosition += 5.5;
      });
      yPosition += 8;
    }

    // Mood Logs Section - Clean table-like layout
    if (moodLogs && moodLogs.length > 0) {
      addSectionHeader("Recent Mood Logs");

      const recentMoodLogs = moodLogs.slice(0, 10);
      recentMoodLogs.forEach((log, index) => {
        // Estimate row height first to decide page break cleanly
        const date = log.log_date
          ? new Date(log.log_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "N/A";

        const symptomsText = log.symptoms && Array.isArray(log.symptoms) && log.symptoms.length
          ? log.symptoms.join(", ")
          : "";
        const symptomLines = symptomsText
          ? pdf.splitTextToSize(symptomsText, pageWidth - 2 * margin - 4).slice(0, 1)
          : [];
        const rowHeight = 12 + (symptomLines.length ? 5 : 0) + 4; // header + optional symptoms + padding

        checkNewPage(rowHeight + 6);

        const startY = yPosition;

        // Alternating row background sized to content
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251); // very light gray
          pdf.rect(margin, startY - 2, pageWidth - 2 * margin, rowHeight, "F");
        }

        // Left column: Date (small) + Mood (bold)
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textDark);
        pdf.text(date, margin + 2, startY + 2);

        pdf.setFont("helvetica", "bold");
        pdf.text(log.mood || "N/A", margin + 2, startY + 8);

        // Right column: Stress, right-aligned
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...textMedium);
        pdf.text(`Stress: ${log.stress_level || "N/A"}`, pageWidth - margin, startY + 2, { align: "right" });

        // Symptoms line (light)
        if (symptomLines.length) {
          pdf.setFontSize(8);
          pdf.setTextColor(...textLight);
          pdf.text(symptomLines, margin + 2, startY + 14);
        }

        // Advance to next row with a small gap
        yPosition = startY + rowHeight + 2;
      });
    }

    // Clean minimal footer
    pdf.setFontSize(7);
    pdf.setTextColor(...textLight);
    pdf.text(`Generated ${new Date().toLocaleString("en-US", { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, pageHeight - 8);
    pdf.text("AnxieEase", pageWidth / 2, pageHeight - 8, { align: "center" });

    // Save the PDF
    const fileName = `patient_report_${patient.name?.replace(/\s+/g, "_") || patient.id}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);
  },

  // Generate batch report for multiple patients
  async generateBatchPatientReport(patientIds, psychologistId, format = "pdf") {
    try {
      const batchData = [];

      for (const patientId of patientIds) {
        const reportData = await this.generatePatientReportData(
          patientId,
          psychologistId
        );
        batchData.push(reportData);
      }

      if (format === "csv") {
        return this.exportBatchPatientDataCSV(batchData);
      } else {
        return this.exportBatchPatientDataPDF(batchData);
      }
    } catch (error) {
      console.error("Error generating batch report:", error);
      throw error;
    }
  },

  // Export batch data as CSV
  async exportBatchPatientDataCSV(batchData) {
    const csvData = [];

    // Add batch report header
    csvData.push(["BATCH PATIENT REPORT"]);
    csvData.push(["Generated:", new Date().toLocaleString()]);
    csvData.push(["Total Patients:", batchData.length]);
    csvData.push([]);

    // Add each patient's data
    batchData.forEach((reportData, index) => {
      const { patient, stats } = reportData;

      csvData.push([`PATIENT ${index + 1}: ${patient.name || patient.id}`]);
      csvData.push(["Patient ID:", patient.id]);
      csvData.push(["Email:", patient.email || "N/A"]);
      csvData.push(["Total Sessions:", stats.totalSessions]);
      csvData.push(["Total Mood Entries:", stats.totalMoodEntries]);
      csvData.push(["Average Mood Score:", `${stats.avgMoodScore}/10`]);
      csvData.push(["Average Stress Level:", `${stats.avgStressLevel}/10`]);
      csvData.push(["Most Common Mood:", stats.mostCommonMood]);
      csvData.push(["Total Anxiety Attacks:", stats.totalAnxietyAttacks]);
      csvData.push(["Attack Rate (per week):", stats.attackRatePerWeek]);
      csvData.push(["Improvement Trend:", stats.improvementTrend]);
      csvData.push([
        "Month with Most Attacks:",
        `${stats.mostAttacksMonth} (${
          stats.monthlyAttackData[stats.mostAttacksMonth] || 0
        })`,
      ]);
      csvData.push([
        "Month with Least Attacks:",
        `${stats.leastAttacksMonth} (${
          stats.monthlyAttackData[stats.leastAttacksMonth] || 0
        })`,
      ]);
      csvData.push([]);
    });

    // Convert to CSV and download
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `batch_patient_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return csv;
  },

  // Export batch data as PDF
  async exportBatchPatientDataPDF(batchData) {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;

    // Title
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Batch Patient Report", margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Total Patients: ${batchData.length}`, margin, yPosition);
    yPosition += 15;

    // Summary table
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary Overview", margin, yPosition);
    yPosition += 10;

    // Table headers
    pdf.setFontSize(7);
    pdf.text("Patient Name", margin, yPosition);
    pdf.text("Sessions", margin + 45, yPosition);
    pdf.text("Mood Entries", margin + 65, yPosition);
    pdf.text("Avg Mood", margin + 90, yPosition);
    pdf.text("Attacks", margin + 110, yPosition);
    pdf.text("Attack Rate", margin + 130, yPosition);
    pdf.text("Trend", margin + 155, yPosition);
    yPosition += 5;

    // Table data
    batchData.forEach((reportData) => {
      const { patient, stats } = reportData;

      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFont("helvetica", "normal");
      const patientName = (
        patient.name ||
        `${patient.first_name || ""} ${patient.last_name || ""}`.trim()
      ).substring(0, 20);
      pdf.text(patientName, margin, yPosition);
      pdf.text(stats.totalSessions.toString(), margin + 45, yPosition);
      pdf.text(stats.totalMoodEntries.toString(), margin + 65, yPosition);
      pdf.text(stats.avgMoodScore.toString(), margin + 90, yPosition);
      pdf.text(stats.totalAnxietyAttacks.toString(), margin + 110, yPosition);
      pdf.text(stats.attackRatePerWeek.toString(), margin + 130, yPosition);
      pdf.text(
        stats.improvementTrend.substring(0, 10),
        margin + 155,
        yPosition
      );
      yPosition += 5;
    });

    // Save PDF
    const fileName = `batch_patient_report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);

    return pdf;
  },
};
