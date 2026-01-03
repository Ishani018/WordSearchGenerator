'use client';

import * as React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  };

  const colors = {
    error: {
      bg: 'bg-red-900/90',
      border: 'border-red-700',
      icon: 'text-red-400',
      text: 'text-red-100',
    },
    warning: {
      bg: 'bg-yellow-900/90',
      border: 'border-yellow-700',
      icon: 'text-yellow-400',
      text: 'text-yellow-100',
    },
    success: {
      bg: 'bg-green-900/90',
      border: 'border-green-700',
      icon: 'text-green-400',
      text: 'text-green-100',
    },
    info: {
      bg: 'bg-blue-900/90',
      border: 'border-blue-700',
      icon: 'text-blue-400',
      text: 'text-blue-100',
    },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type];
            const colorScheme = colors[toast.type];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`${colorScheme.bg} ${colorScheme.border} border-2 rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md pointer-events-auto`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`${colorScheme.icon} h-5 w-5 flex-shrink-0 mt-0.5`} />
                  <p className={`${colorScheme.text} text-sm flex-1`}>{toast.message}</p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`${colorScheme.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

