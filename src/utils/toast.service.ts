/**
 * Toast Notification Service
 * 
 * Provides iOS-style toast notifications for user feedback.
 * Uses react-native-toast-message for consistent, native-feeling toasts.
 */

import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
}

/**
 * Show a toast notification
 * 
 * @param options - Toast configuration
 */
export function showToast(options: ToastOptions | string): void {
  // Allow simple string usage: showToast('Message')
  if (typeof options === 'string') {
    Toast.show({
      type: 'info',
      text1: options,
      position: 'top',
      visibilityTime: 3000,
    });
    return;
  }

  const {
    type = 'info',
    title,
    message,
    duration = 3000,
    position = 'top',
  } = options;

  Toast.show({
    type,
    text1: title,
    text2: message,
    position,
    visibilityTime: duration,
    topOffset: position === 'top' ? 60 : undefined,
    bottomOffset: position === 'bottom' ? 100 : undefined,
  });
}

/**
 * Show success toast
 */
export function showSuccess(message: string, title?: string): void {
  showToast({
    type: 'success',
    title: title || 'Success',
    message,
  });
}

/**
 * Show error toast
 */
export function showError(message: string, title?: string): void {
  showToast({
    type: 'error',
    title: title || 'Error',
    message,
  });
}

/**
 * Show info toast
 */
export function showInfo(message: string, title?: string): void {
  showToast({
    type: 'info',
    title: title || 'Info',
    message,
  });
}

