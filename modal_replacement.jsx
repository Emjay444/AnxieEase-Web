{
  /* Schedule Appointment Modal with Date/Time Pickers */
}
{
  pendingScheduleRequest && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Schedule Appointment
          </h3>
          <button
            onClick={() => {
              setPendingScheduleRequest(null);
              setSelectedSlot(null);
              setScheduledDate("");
              setScheduledTime("");
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700">
            <div className="font-medium">Request</div>
            <div>{pendingScheduleRequest.patientName}</div>
            <div className="text-gray-500">
              {pendingScheduleRequest.message}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {scheduledDate && scheduledTime && (
            <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-800">
              <div className="font-medium">Selected Appointment</div>
              <div>
                {new Date(
                  `${scheduledDate}T${scheduledTime}`
                ).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(
                  `${scheduledDate}T${scheduledTime}`
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setPendingScheduleRequest(null);
              setSelectedSlot(null);
              setScheduledDate("");
              setScheduledTime("");
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSchedule}
            disabled={!scheduledDate || !scheduledTime}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
