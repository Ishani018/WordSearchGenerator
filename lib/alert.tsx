'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertDialog, AlertOptions } from '@/components/ui/alert-dialog';

interface AlertContextType {
  alert: (options: Omit<AlertOptions, 'onConfirm' | 'onCancel'>) => Promise<void>;
  confirm: (options: Omit<AlertOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
  }>({
    isOpen: false,
    options: { message: '' },
  });

  const alert = useCallback(
    (options: Omit<AlertOptions, 'onConfirm' | 'onCancel'>): Promise<void> => {
      return new Promise((resolve) => {
        setAlertState({
          isOpen: true,
          options: {
            ...options,
            onConfirm: () => resolve(),
            onCancel: () => resolve(),
          },
        });
      });
    },
    []
  );

  const confirm = useCallback(
    (options: Omit<AlertOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
      return new Promise((resolve) => {
        setAlertState({
          isOpen: true,
          options: {
            ...options,
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          },
        });
      });
    },
    []
  );

  const closeAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        {...alertState.options}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}

