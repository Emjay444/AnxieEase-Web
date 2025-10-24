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

      // Session logs table doesn't exist - removed to prevent 404 errors
      // const sessionLogs = await patientService.getPatientSessionLogs(patientId);

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
        // sessionLogs removed - table doesn't exist
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
      logsPerWeek: 0,
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

      // Calculate mood logging consistency (logs per week)
      stats.logsPerWeek = ((moodLogs?.length || 0) / weeks).toFixed(1);

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
      // sessionLogs, // Removed - table doesn't exist
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

    // Session logs removed - table doesn't exist in database

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

  // Export patient data as PDF - Compact single-page design with AnxieEase branding
  async exportPatientDataPDF(reportData) {
    const {
      patient,
      moodLogs,
      patientNotes,
      // sessionLogs, // Removed - table doesn't exist
      appointments,
      stats,
    } = reportData;

    // Create new PDF document
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // AnxieEase brand colors - Emerald Green Theme
    const primaryGreen = [16, 185, 129]; // Emerald-500
    const darkGreen = [5, 150, 105]; // Emerald-600
    const lightGreen = [209, 250, 229]; // Emerald-50
    const textColor = [31, 41, 55]; // Gray-800
    const lightBg = [249, 250, 251]; // Gray-50

    // Header with AnxieEase branding - Emerald Green
    pdf.setFillColor(...primaryGreen);
    pdf.rect(0, 0, pageWidth, 35, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("AnxieEase", margin, 15);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Patient Progress Report", margin, 22);
    pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 30, 22);

    yPosition = 40;

    // Patient Info Section - Compact with Age and Sex
    pdf.setTextColor(...textColor);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("PATIENT", margin, yPosition);
    pdf.setFont("helvetica", "normal");
    const patientName =
      patient.name ||
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
      "N/A";
    pdf.text(patientName, margin + 25, yPosition);

    // Calculate age and display sex
    let age = "N/A";
    if (patient.birth_date || patient.date_of_birth) {
      const birthDate = new Date(patient.birth_date || patient.date_of_birth);
      const today = new Date();
      age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    }
    const sex = patient.sex || patient.gender || "N/A";
    pdf.text(`Age: ${age} | Sex: ${sex}`, pageWidth - margin - 45, yPosition);
    yPosition += 5;

    // Divider line
    pdf.setDrawColor(...primaryGreen);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Key Metrics in 2 columns
    const colWidth = contentWidth / 2;
    const col1X = margin;
    const col2X = margin + colWidth;
    // Track the section top and use fixed panel height so following content never overlaps
    const sectionTop = yPosition;
    const panelHeight = 48;

    // Left column - Overview metrics
    let leftY = sectionTop;
    pdf.setFillColor(255, 255, 255); // White background
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(
      col1X,
      sectionTop - 4,
      colWidth - 3,
      panelHeight,
      3,
      3,
      "FD"
    );

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textColor);
    pdf.text("Overview", col1X + 3, leftY);
    leftY += 6;

    pdf.setFontSize(8);
    pdf.setTextColor(...textColor);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Sessions Completed: ${stats.totalSessions}`, col1X + 3, leftY);
    leftY += 5;
    pdf.text(`Mood Entries: ${stats.totalMoodEntries}`, col1X + 3, leftY);
    leftY += 5;
    pdf.text(`Most Common Mood: ${stats.mostCommonMood}`, col1X + 3, leftY);
    leftY += 5;
    pdf.text(
      `Last Activity: ${
        stats.lastActivity
          ? new Date(stats.lastActivity).toLocaleDateString()
          : "N/A"
      }`,
      col1X + 3,
      leftY
    );
    leftY += 5;

    // Status moved to the third card below

    // Right column - Anxiety metrics
    let rightY = sectionTop;
    pdf.setFillColor(255, 255, 255); // White background
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(
      col2X,
      sectionTop - 4,
      colWidth - 3,
      panelHeight,
      3,
      3,
      "FD"
    );

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textColor);
    pdf.text("Anxiety Tracking", col2X + 3, rightY);
    rightY += 6;

    pdf.setFontSize(8);
    pdf.setTextColor(...textColor);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Total Anxiety Events: ${stats.totalAnxietyAttacks}`,
      col2X + 3,
      rightY
    );
    rightY += 5;
    pdf.text(
      `Weekly Rate: ${stats.attackRatePerWeek} per week`,
      col2X + 3,
      rightY
    );
    rightY += 5;
    pdf.text(`Peak Month: ${stats.mostAttacksMonth}`, col2X + 3, rightY);
    rightY += 5;
    pdf.text(`Best Month: ${stats.leastAttacksMonth}`, col2X + 3, rightY);

    // Move yPosition to just below the fixed-height panels with comfortable spacing
    yPosition = sectionTop - 4 + panelHeight + 12;

    // Score Cards - 3 columns with clean white design and fixed spacing
    const cardGap = 4; // Gap between cards
    const totalGaps = cardGap * 2; // Two gaps between three cards
    const cardWidth = (contentWidth - totalGaps) / 3; // Equal width for all cards
    const card1X = margin;
    const card2X = margin + cardWidth + cardGap;
    const card3X = margin + (cardWidth + cardGap) * 2;

    // Mood Score Card
    pdf.setFillColor(255, 255, 255); // White
    pdf.setDrawColor(230, 230, 230); // Light gray border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(card1X, yPosition, cardWidth, 24, 3, 3, "FD");
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textColor);
    pdf.text(stats.avgMoodScore, card1X + cardWidth / 2, yPosition + 12, {
      align: "center",
    });
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Average Mood Score", card1X + cardWidth / 2, yPosition + 18, {
      align: "center",
    });
    pdf.setFontSize(6);
    pdf.text("(Scale: 1-10)", card1X + cardWidth / 2, yPosition + 22, {
      align: "center",
    });

    // Stress Level Card
    pdf.setFillColor(255, 255, 255); // White
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(card2X, yPosition, cardWidth, 24, 3, 3, "FD");
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textColor);
    pdf.text(stats.avgStressLevel, card2X + cardWidth / 2, yPosition + 12, {
      align: "center",
    });
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text("Average Stress Level", card2X + cardWidth / 2, yPosition + 18, {
      align: "center",
    });
    pdf.setFontSize(6);
    pdf.text("(Scale: 1-10)", card2X + cardWidth / 2, yPosition + 22, {
      align: "center",
    });

    // Status Card (Replaces Logging Consistency)
    pdf.setFillColor(255, 255, 255); // White
    pdf.setDrawColor(230, 230, 230);
    pdf.roundedRect(card3X, yPosition, cardWidth, 24, 3, 3, "FD");
    const trend = (stats.improvementTrend || "Stable").toLowerCase();
    let friendlyTrend = "Stable";
    if (trend.includes("significantly") && trend.includes("improving"))
      friendlyTrend = "Improving well";
    else if (trend.includes("improving")) friendlyTrend = "Improving";
    else if (trend.includes("declin"))
      friendlyTrend = "Needs support"; // softer wording
    else if (trend.includes("stable")) friendlyTrend = "Stable";

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textColor);
    pdf.text(friendlyTrend, card3X + cardWidth / 2, yPosition + 12, {
      align: "center",
    });
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "Status (overall progress)",
      card3X + cardWidth / 2,
      yPosition + 18,
      { align: "center" }
    );
    pdf.setFontSize(6);
    pdf.text(
      "Based on mood and anxiety trends",
      card3X + cardWidth / 2,
      yPosition + 22,
      { align: "center" }
    );

    // Add more spacing before the next section for readability and to prevent any overlap on dense content
    yPosition += 42;

    // Recent Activity Section - 2 columns
    // Left: Top Symptoms
    leftY = yPosition;
    if (Object.keys(stats.symptomFrequency).length > 0) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...textColor);
      pdf.text("Top Symptoms", col1X, leftY);
      leftY += 6;

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textColor);

      const topSymptoms = Object.entries(stats.symptomFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);

      topSymptoms.forEach(([symptom, frequency]) => {
        const shortSymptom =
          symptom.length > 28 ? symptom.substring(0, 25) + "..." : symptom;
        pdf.text(`• ${shortSymptom} (${frequency}x)`, col1X + 2, leftY);
        leftY += 4.5;
      });
    }

    // Right: Recent Mood Logs
    rightY = yPosition;
    if (moodLogs && moodLogs.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...textColor);
      pdf.text("Recent Mood Logs", col2X, rightY);
      rightY += 6;

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textColor);

      moodLogs.slice(0, 6).forEach((log) => {
        const date = log.log_date
          ? new Date(log.log_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "N/A";
        const mood = (log.mood || "N/A").substring(0, 12);
        pdf.text(`${date}: ${mood}`, col2X + 2, rightY);
        rightY += 4.5;
      });
    }

    yPosition = Math.max(leftY, rightY) + 10;

    // Clinical Notes Summary (Full Width)
    if (patientNotes && patientNotes.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...textColor);
      pdf.text("Latest Clinical Notes", margin, yPosition);
      yPosition += 6;

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textColor);

      const latestNote = patientNotes[0];
      const noteDate = latestNote.created_at
        ? new Date(latestNote.created_at).toLocaleDateString()
        : "N/A";
      const noteContent = (
        latestNote.note_content ||
        latestNote.content ||
        "No content"
      ).substring(0, 150);
      const noteLines = pdf.splitTextToSize(noteContent, contentWidth - 4);

      pdf.text(`Date: ${noteDate}`, margin + 2, yPosition);
      yPosition += 5;
      pdf.text(noteLines.slice(0, 3), margin + 2, yPosition);
      yPosition += noteLines.slice(0, 3).length * 4.5 + 6;
    }

    // Footer with branding
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "italic");
    pdf.text("AnxieEase - Supporting Mental Wellness", margin, pageHeight - 10);
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth - margin - 50,
      pageHeight - 10
    );

    // Confidentiality notice
    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      "Confidential Patient Information - Handle with Care",
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );

    // Save PDF
    const fileName = `anxieease_report_${patient.name || patient.id}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);

    return pdf;
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

      // Compute age and sex for CSV instead of ID
      let age = "N/A";
      const dob = patient.birth_date || patient.date_of_birth;
      if (dob) {
        const d = new Date(dob);
        const now = new Date();
        age = Math.floor((now - d) / (365.25 * 24 * 60 * 60 * 1000));
      }
      const sex = patient.sex || patient.gender || "N/A";

      // Friendly trend wording
      const t = (stats.improvementTrend || "").toLowerCase();
      const friendlyTrend =
        t.includes("significantly") && t.includes("improving")
          ? "Improving well"
          : t.includes("improving")
          ? "Improving"
          : t.includes("declin")
          ? "Needs support"
          : "Stable";

      csvData.push([`PATIENT ${index + 1}: ${patient.name || "Unknown"}`]);
      csvData.push(["Age:", age]);
      csvData.push(["Sex:", sex]);
      csvData.push(["Email:", patient.email || "N/A"]);
      csvData.push(["Total Mood Entries:", stats.totalMoodEntries]);
      csvData.push(["Average Mood Score:", `${stats.avgMoodScore}/10`]);
      csvData.push(["Average Stress Level:", `${stats.avgStressLevel}/10`]);
      csvData.push(["Total Anxiety Attacks:", stats.totalAnxietyAttacks]);
      csvData.push(["Attack Rate (per week):", stats.attackRatePerWeek]);
      csvData.push(["Status:", friendlyTrend]);
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
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Colors matching single report (emerald header, white rest)
    const primaryGreen = [16, 185, 129];
    const textColor = [31, 41, 55];

    // Header
    pdf.setFillColor(...primaryGreen);
    pdf.rect(0, 0, pageWidth, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("AnxieEase", margin, 14);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Batch Patient Report", margin, 20);
    pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 30, 20);
    yPosition = 34;

    // Meta
    pdf.setTextColor(...textColor);
    pdf.setFontSize(9);
    pdf.text(`Total Patients: ${batchData.length}`, margin, yPosition);
    yPosition += 6;

    // Table header with safe column widths that fit inside contentWidth
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.3);

    // Define columns that sum exactly to contentWidth (186mm on A4 with 12mm margins)
    const columns = [
      { key: "patient", title: "Patient", width: 70 },
      { key: "entries", title: "Mood Entries", width: 20 },
      { key: "avgMood", title: "Avg Mood", width: 16 },
      { key: "avgStress", title: "Avg Stress", width: 18 },
      { key: "attacks", title: "Attacks", width: 16 },
      { key: "attackRate", title: "Attack Rate", width: 20 },
      { key: "status", title: "Status", width: 26 },
    ];

    // Compute x positions from widths to avoid clipping at the right margin
    let runningX = margin;
    columns.forEach((c) => {
      c.x = runningX; // left edge for the column
      runningX += c.width;
    });

    // Helper: draw header row
    const drawTableHeader = () => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      columns.forEach((c) => {
        // Add a small left padding inside the column
        pdf.text(c.title, c.x + 1, yPosition);
      });
      yPosition += 5;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;
    };

    drawTableHeader();

    // Helper: truncate text to fit within column width (with ellipsis)
    const truncateToWidth = (str, maxWidth) => {
      let s = String(str ?? "");
      if (pdf.getTextWidth(s) <= maxWidth) return s;
      // Reserve space for ellipsis
      const ellipsis = "…";
      let low = 0,
        high = s.length,
        ans = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = s.slice(0, mid) + ellipsis;
        if (pdf.getTextWidth(candidate) <= maxWidth) {
          ans = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return s.slice(0, ans) + ellipsis;
    };

    // Rows
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const rowHeight = 6;
    batchData.forEach((reportData) => {
      const { patient, stats } = reportData;
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        // Re-draw table header on new page for clarity
        yPosition = margin + 4;
        drawTableHeader();
      }

      const fullName =
        patient.name ||
        `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
      const name = truncateToWidth(fullName, columns[0].width - 2);

      // Friendly status mapping
      const t = (stats.improvementTrend || "").toLowerCase();
      const friendly =
        t.includes("significantly") && t.includes("improving")
          ? "Improving well"
          : t.includes("improving")
          ? "Improving"
          : t.includes("declin")
          ? "Needs support"
          : "Stable";

      // Clip values to avoid wrapping; add small left padding in each cell
      const statusText = truncateToWidth(friendly, columns[6].width - 2);

      // Text placement: left-align text columns; right-align numeric columns
      pdf.text(name, columns[0].x + 1, yPosition);
      pdf.text(
        String(stats.totalMoodEntries || 0),
        columns[1].x + columns[1].width - 1,
        yPosition,
        { align: "right" }
      );
      pdf.text(
        String(stats.avgMoodScore || 0),
        columns[2].x + columns[2].width - 1,
        yPosition,
        { align: "right" }
      );
      pdf.text(
        String(stats.avgStressLevel || 0),
        columns[3].x + columns[3].width - 1,
        yPosition,
        { align: "right" }
      );
      pdf.text(
        String(stats.totalAnxietyAttacks || 0),
        columns[4].x + columns[4].width - 1,
        yPosition,
        { align: "right" }
      );
      pdf.text(
        String(stats.attackRatePerWeek || 0),
        columns[5].x + columns[5].width - 1,
        yPosition,
        { align: "right" }
      );
      pdf.text(statusText, columns[6].x + 1, yPosition);
      yPosition += rowHeight;
    });

    // Footer
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    pdf.text("AnxieEase - Supporting Mental Wellness", margin, pageHeight - 8);
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth - margin - 50,
      pageHeight - 8
    );

    const fileName = `batch_patient_report_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);
    return pdf;
  },
};
