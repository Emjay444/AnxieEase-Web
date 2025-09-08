import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { X, Plus, Clock, User, Phone, Mail, MessageSquare } from "lucide-react";
import { appointmentService } from "../services/appointmentService";

const localizer = momentLocalizer(moment);

const FullCalendar = ({
  isOpen = false,
  onClose,
  inline = false,
  userId,
  reloadKey,
  selectable = false,
  onSlotSelect,
}) => {
  const [appointments, setAppointments] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDayAppointments, setShowDayAppointments] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hideExpired, setHideExpired] = useState(false);

  useEffect(() => {
    const active = inline || isOpen;
    if (active) {
      loadAppointments();
    }
  }, [isOpen, inline, userId, reloadKey]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      let data = [];
      if (userId) {
        // Prefer scoped fetching for the current user
        data = await appointmentService.getAppointmentsByPsychologist(userId);
      } else if (appointmentService.getAppointments) {
        // Fallback if a generic getter exists
        data = await appointmentService.getAppointments();
      }

      // Transform appointments for calendar format
      const calendarEvents = (data || []).map((appt) => {
        const startRaw =
          appt.appointment_date || appt.requestedDate || appt.requestedDatetime;
        const start = startRaw ? new Date(startRaw) : new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const title =
          appt.patient_name || appt.patientName || "Patient Consultation";
        return {
          id: appt.id,
          title,
          start,
          end,
          resource: {
            patientName: appt.patient_name || appt.patientName,
            patientEmail: appt.patient_email || appt.patientEmail,
            status: appt.status,
            notes: appt.notes,
            reason: appt.reason || "No reason provided",
            type: appt.appointment_type || appt.type || "Consultation",
          },
        };
      });

      setAppointments(calendarEvents);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleSelectSlot = (slotInfo) => {
    // Open expand modal for the selected day
    setSelectedDay(slotInfo.start);
    setShowDayAppointments(true);
    if (onSlotSelect) onSlotSelect(slotInfo);
  };

  const handleCloseEventDetails = () => {
    setShowEventDetails(false);
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = "#059669"; // emerald-600 (default scheduled/others)
    let borderColor = "#047857"; // emerald-700

    const status = (event.resource?.status || "").toString().toLowerCase();

    if (status === "completed") {
      backgroundColor = "#6b7280"; // gray-500
      borderColor = "#4b5563"; // gray-600
    } else if (status === "expired") {
      backgroundColor = "#6b7280"; // gray-500 (same base as completed)
      borderColor = "#9ca3af"; // gray-400 to differentiate slightly
    } else if (
      status === "cancelled" ||
      status === "canceled" ||
      status === "declined"
    ) {
      backgroundColor = "#dc2626"; // red-600
      borderColor = "#b91c1c"; // red-700
    } else if (status === "pending") {
      backgroundColor = "#d97706"; // amber-600
      borderColor = "#b45309"; // amber-700
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "12px",
      },
    };
  };

  const active = inline || isOpen;
  if (!active) return null;

  // Derived list honoring the hideExpired toggle
  const eventsToShow = hideExpired
    ? (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return appointments.filter((e) => {
          const s = (e.resource?.status || "").toLowerCase().trim();
          if (s === "expired" || s === "completed") return false;
          if (s === "declined" || s === "cancelled" || s === "canceled") {
            const start = e.start instanceof Date ? e.start : new Date(e.start);
            return !(start < todayStart);
          }
          return true;
        });
      })()
    : appointments;

  if (inline) {
    return (
      <div className="w-full">
        <div className="h-[650px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={eventsToShow}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day", "agenda"]}
              defaultView="month"
              popup
              selectable={selectable}
              onSelectSlot={handleSelectSlot}
              tooltipAccessor={(event) => {
                const status = event.resource?.status;
                const statusText = status
                  ? ` (${status.charAt(0).toUpperCase() + status.slice(1)})`
                  : "";
                return `${event.title} - ${event.resource?.type}${statusText}`;
              }}
              messages={{
                next: "Next",
                previous: "Previous",
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
                agenda: "Agenda",
                date: "Date",
                time: "Time",
                event: "Event",
                noEventsInRange: "No appointments in this date range",
                showMore: (total) => `+${total} more`,
              }}
            />
          )}
        </div>
        <div className="pt-4">
          <div className="flex items-center gap-6 text-sm justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-600 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span>Expired</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
            <label className="flex items-center gap-2 select-none">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hideExpired}
                onChange={(e) => setHideExpired(e.target.checked)}
              />
              <span>Hide past (completed / expired / declined)</span>
            </label>
          </div>
        </div>

        {/* Event Details Modal (overlay on top of page) */}
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Appointment Details
                </h3>
                <button
                  onClick={handleCloseEventDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedEvent.resource?.patientName}
                    </p>
                    <p className="text-sm text-gray-600">Patient</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {moment(selectedEvent.start).format("MMMM Do, YYYY")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Requested time:{" "}
                      {moment(selectedEvent.start).format("h:mm A")}
                    </p>
                  </div>
                </div>

                {selectedEvent.resource?.reason && (
                  <div className="flex items-start gap-3">
                    <MessageSquare
                      className="text-emerald-600 mt-0.5"
                      size={20}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Reason</p>
                      <p className="text-sm text-gray-600">
                        {selectedEvent.resource.reason}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.resource?.patientEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="text-emerald-600" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedEvent.resource.patientEmail}
                      </p>
                      <p className="text-sm text-gray-600">Email</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selectedEvent.resource?.status === "completed"
                        ? "bg-gray-500"
                        : selectedEvent.resource?.status === "expired"
                        ? "bg-gray-400"
                        : selectedEvent.resource?.status === "cancelled"
                        ? "bg-red-600"
                        : selectedEvent.resource?.status === "pending"
                        ? "bg-amber-600"
                        : "bg-emerald-600"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {selectedEvent.resource?.status || "scheduled"}
                    </p>
                    <p className="text-sm text-gray-600">Status</p>
                  </div>
                </div>

                {selectedEvent.resource?.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Notes:
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedEvent.resource.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCloseEventDetails}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {(() => {
                  const status = (
                    selectedEvent?.resource?.status || ""
                  ).toLowerCase();
                  if (status === "pending" || status === "requested") {
                    return (
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={async () => {
                            await appointmentService.updateAppointmentStatus(
                              selectedEvent.id,
                              "declined",
                              "Declined by psychologist"
                            );
                            await loadAppointments();
                            setShowEventDetails(false);
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={async () => {
                            await appointmentService.updateAppointmentStatus(
                              selectedEvent.id,
                              "scheduled",
                              "Accepted by psychologist"
                            );
                            await loadAppointments();
                            setShowEventDetails(false);
                          }}
                          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Accept
                        </button>
                      </div>
                    );
                  }
                  if (status === "scheduled") {
                    return (
                      <button
                        onClick={() => {
                          alert(
                            "Reschedule flow to be implemented with reason input."
                          );
                        }}
                        className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Reschedule
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-7xl h[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Appointment Calendar
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your appointments and schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* Calendar */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={eventsToShow}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              onSelectEvent={handleSelectEvent}
              selectable
              onSelectSlot={handleSelectSlot}
              view={view}
              date={currentDate}
              onView={(v) => setView(v)}
              onNavigate={(date) => setCurrentDate(date)}
              onDrillDown={(date) => {
                setView("day");
                setCurrentDate(date);
              }}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day", "agenda"]}
              defaultView="month"
              popup
              onShowMore={(events, date) => {
                // Open expand modal for this date
                setSelectedDay(date);
                setShowDayAppointments(true);
              }}
              tooltipAccessor={(event) => {
                const status = event.resource?.status;
                const statusText = status
                  ? ` (${status.charAt(0).toUpperCase() + status.slice(1)})`
                  : "";
                return `${event.title} - ${event.resource?.type}${statusText}`;
              }}
              messages={{
                next: "Next",
                previous: "Previous",
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
                agenda: "Agenda",
                date: "Date",
                time: "Time",
                event: "Event",
                noEventsInRange: "No appointments in this date range",
                showMore: (total) => `+${total} more`,
              }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <div className="flex items-center gap-6 text-sm justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-600 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span>Expired</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Cancelled</span>
              </div>
            </div>
            <label className="flex items-center gap-2 select-none">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hideExpired}
                onChange={(e) => setHideExpired(e.target.checked)}
              />
              <span>Hide past (completed / expired / declined)</span>
            </label>
          </div>
        </div>

        {/* Day Appointments Expand Modal */}
        {showDayAppointments && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDay
                    ? moment(selectedDay).format("MMMM Do, YYYY")
                    : "Appointments"}
                </h3>
                <button
                  onClick={() => setShowDayAppointments(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-auto">
                {(() => {
                  const day = selectedDay
                    ? moment(selectedDay).startOf("day")
                    : null;
                  const dayEvents = eventsToShow.filter(
                    (evt) => day && moment(evt.start).isSame(day, "day")
                  );
                  if (!dayEvents.length) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        No appointments on this date
                      </div>
                    );
                  }
                  return dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(evt);
                        setShowEventDetails(true);
                        setShowDayAppointments(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {evt.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {moment(evt.start).format("h:mm A")} -{" "}
                            {moment(evt.end).format("h:mm A")}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded capitalize ${
                            (evt.resource?.status || "").toLowerCase() ===
                            "pending"
                              ? "bg-amber-100 text-amber-700"
                              : (evt.resource?.status || "").toLowerCase() ===
                                "expired"
                              ? "bg-gray-100 text-gray-600"
                              : (evt.resource?.status || "").toLowerCase() ===
                                "completed"
                              ? "bg-gray-100 text-gray-700"
                              : (evt.resource?.status || "").toLowerCase() ===
                                "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {evt.resource?.status || "scheduled"}
                        </span>
                      </div>
                      {evt.resource?.reason && (
                        <p className="text-xs text-gray-500 mt-1">
                          {evt.resource.reason}
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDayAppointments(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal for modal mode */}
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Appointment Details
                </h3>
                <button
                  onClick={handleCloseEventDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedEvent.resource?.patientName}
                    </p>
                    <p className="text-sm text-gray-600">Patient</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="text-emerald-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {moment(selectedEvent.start).format("MMMM Do, YYYY")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {moment(selectedEvent.start).format("h:mm A")} -{" "}
                      {moment(selectedEvent.end).format("h:mm A")}
                    </p>
                  </div>
                </div>

                {selectedEvent.resource?.patientEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="text-emerald-600" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedEvent.resource.patientEmail}
                      </p>
                      <p className="text-sm text-gray-600">Email</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selectedEvent.resource?.status === "completed"
                        ? "bg-gray-500"
                        : selectedEvent.resource?.status === "expired"
                        ? "bg-gray-400"
                        : selectedEvent.resource?.status === "cancelled"
                        ? "bg-red-600"
                        : selectedEvent.resource?.status === "pending"
                        ? "bg-amber-600"
                        : "bg-emerald-600"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {selectedEvent.resource?.status || "scheduled"}
                    </p>
                    <p className="text-sm text-gray-600">Status</p>
                  </div>
                </div>

                {selectedEvent.resource?.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Notes:
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedEvent.resource.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCloseEventDetails}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  Edit Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullCalendar;
