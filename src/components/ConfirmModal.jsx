import React from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // warning | danger | success
}) => {
  if (!isOpen) return null;

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    danger: AlertTriangle,
  };

  const accent = {
    success: {
      ring: "text-green-600 bg-green-100",
      btn: "bg-green-600 hover:bg-green-500 text-white",
    },
    warning: {
      ring: "text-yellow-600 bg-yellow-100",
      btn: "bg-yellow-600 hover:bg-yellow-500 text-white",
    },
    danger: {
      ring: "text-red-600 bg-red-100",
      btn: "bg-red-600 hover:bg-red-500 text-white",
    },
  }[type] || {
    ring: "text-yellow-600 bg-yellow-100",
    btn: "bg-yellow-600 hover:bg-yellow-500 text-white",
  };

  const Icon = icons[type] || AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity"></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div
                className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${accent.ring} sm:mx-0 sm:h-10 sm:w-10`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto ${accent.btn}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            {cancelText ? (
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
                onClick={onCancel}
              >
                {cancelText}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
