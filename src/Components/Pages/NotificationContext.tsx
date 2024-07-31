import React, { createContext, useState, ReactNode } from "react";

interface NotificationContextProps {
  message: string;
  showMessage: (msg: string) => void;
  hideMessage: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [message, setMessage] = useState<string>("");

  const showMessage = (msg: string) => {
    setMessage(msg);
  };

  const hideMessage = () => {
    setMessage("");
  };

  return (
    <NotificationContext.Provider value={{ message, showMessage, hideMessage }}>
      {children}
      {message && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <span>{message}</span>
            <button
              onClick={hideMessage}
              className="ml-4 bg-red-700 px-2 py-1 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
