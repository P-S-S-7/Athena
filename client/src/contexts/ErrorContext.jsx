import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { showErrorToast } from '@/utils/toast';

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const errorTimeoutsRef = useRef(new Map());

  const handleError = useCallback((error) => {
    const errorMessage = error?.message ||
                        error?.response?.data?.message ||
                        "An unexpected error occurred";

    const currentTime = Date.now();
    const errorKey = errorMessage;

    if (errorTimeoutsRef.current.has(errorKey)) {
      const lastDisplayTime = errorTimeoutsRef.current.get(errorKey);

      if (currentTime - lastDisplayTime < 2000) {
        console.log("Skipping duplicate error (within 2s):", errorMessage);
        return errorMessage;
      }
    }

    console.log("Displaying error:", errorMessage);
    setTimeout(() => showErrorToast(errorMessage), 10);
    errorTimeoutsRef.current.set(errorKey, currentTime);

    setTimeout(() => {
      if (errorTimeoutsRef.current.get(errorKey) === currentTime) {
        errorTimeoutsRef.current.delete(errorKey);
        console.log("Error tracking removed for:", errorMessage);
      }
    }, 2000);

    console.error("Full API Error:", error);
    return errorMessage;
  }, []);

  const value = {
    handleError
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
