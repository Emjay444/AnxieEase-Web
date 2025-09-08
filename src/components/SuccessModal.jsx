import React from "react";
import { CheckCircle, Mail, AlertTriangle, X } from "lucide-react";

const SuccessModal = ({
  isOpen,
  onClose,
  title,
  message,
  details,
  type = "success",
}) => {
  if (!isOpen) return null;

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Mail,
  };

  const colors = {
    success: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
    info: "text-blue-600 bg-blue-100",
  };

  const Icon = icons[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity"></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div
                className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${colors[type]} sm:mx-0 sm:h-10 sm:w-10`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                  {details && (
                    <div className="mt-3 space-y-2">
                      {details.map((detail, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div
                            className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${
                              detail.type === "warning"
                                ? "bg-yellow-400"
                                : detail.type === "info"
                                ? "bg-blue-400"
                                : "bg-green-400"
                            }`}
                          ></div>
                          <p
                            className={`text-sm ${
                              detail.type === "warning"
                                ? "text-yellow-700"
                                : detail.type === "info"
                                ? "text-blue-700"
                                : "text-gray-600"
                            }`}
                          >
                            {detail.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors sm:ml-3 sm:w-auto"
              onClick={onClose}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
