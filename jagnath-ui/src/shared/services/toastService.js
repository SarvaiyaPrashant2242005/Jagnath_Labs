/**
 * @file toastService.js
 * @description Centralized Toast notification service for dispatching and subscribing to toast notifications.
 */

// Event listener store for toast subscribers
const listeners = new Set();

export const toastService = {
  /**
   * Subscribe to toast events.
   * @param {Function} listener - Callback (toast: { message, type }) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Trigger a toast notification.
   * @param {string} message - Toast message text
   * @param {'success' | 'error' | 'warning' | 'info'} [type='success'] - Toast variant
   */
  show(message, type = 'success') {
    const toastData = { message, type, id: Date.now() };
    listeners.forEach(listener => {
      try {
        listener(toastData);
      } catch (err) {
        console.error('Error in toast listener:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:toast', { detail: toastData })
      );
    }
  },

  success(message) {
    this.show(message, 'success');
  },

  error(message) {
    this.show(message, 'error');
  },

  warning(message) {
    this.show(message, 'warning');
  },

  info(message) {
    this.show(message, 'info');
  }
};

/**
 * Direct export for quick toast triggers:
 * triggerToast('Item created successfully!', 'success');
 */
export const triggerToast = (message, type = 'success') => {
  toastService.show(message, type);
};

export default toastService;
