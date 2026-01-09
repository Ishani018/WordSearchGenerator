'use client';

import * as React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertDialogProps extends AlertOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  };

  const colors = {
    error: {
      bg: 'bg-white',
      border: 'border-red-300',
      icon: 'text-red-600',
      title: 'text-black',
      text: 'text-black',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-yellow-300',
      icon: 'text-yellow-600',
      title: 'text-black',
      text: 'text-black',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    success: {
      bg: 'bg-white',
      border: 'border-green-300',
      icon: 'text-green-600',
      title: 'text-black',
      text: 'text-black',
      button: 'bg-green-600 hover:bg-green-700',
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-300',
      icon: 'text-blue-600',
      title: 'text-black',
      text: 'text-black',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  // Format message with line breaks
  const formattedMessage = message.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < message.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <div
          className={`${colorScheme.bg} ${colorScheme.border} border-2 rounded-lg shadow-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6">
            <div className={`${colorScheme.icon} flex-shrink-0`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className={`${colorScheme.title} text-lg font-semibold mb-2`}>
                  {title}
                </h3>
              )}
              <p className={`${colorScheme.text} text-sm leading-relaxed`}>
                {formattedMessage}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`${colorScheme.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 pb-6">
            {cancelText && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-gray-300 hover:bg-gray-100 text-black"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              className={`${colorScheme.button} text-white`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

