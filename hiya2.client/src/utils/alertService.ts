import './alertService.css';

export interface PopupOptions {
  type: 'success' | 'error' | 'confirm';
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  autoCloseMs?: number;
}

export interface PopupResult {
  isConfirmed: boolean;
  value?: any;
}

let activeOverlay: HTMLDivElement | null = null;
let activeResolve: ((result: PopupResult) => void) | null = null;
let activeTimer: ReturnType<typeof setTimeout> | null = null;
let activeKeyHandler: ((e: KeyboardEvent) => void) | null = null;

export const closeActivePopup = (isConfirmed = false, value?: any): void => {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }

  if (activeKeyHandler) {
    document.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }

  const resolve = activeResolve;
  activeResolve = null;

  if (resolve) {
    resolve({ isConfirmed, value });
  }
};

export const buildPopup = ({
  type,
  title,
  message = '',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  autoCloseMs = 0,
}: PopupOptions): Promise<PopupResult> => {
  if (typeof document === 'undefined') {
    return Promise.resolve({ isConfirmed: false });
  }

  closeActivePopup(false);

  return new Promise((resolve) => {
    activeResolve = resolve;

    const overlay = document.createElement('div');
    overlay.className = 'pop-show-overlay';

    const popup = document.createElement('div');
    popup.className = `pop-show-popup pop-show-${type}`;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');

    const icon = document.createElement('div');
    icon.className = `pop-show-icon pop-show-icon-${type}`;
    if (type === 'success') {
      icon.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      icon.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      icon.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    const titleNode = document.createElement('h2');
    titleNode.className = 'pop-show-title';
    titleNode.textContent = title;

    const messageNode = document.createElement('div');
    messageNode.className = 'pop-show-message';
    messageNode.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'pop-show-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'pop-show-btn pop-show-confirm-btn';
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener('click', () => closeActivePopup(true, true));

    actions.appendChild(confirmBtn);

    if (showCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'pop-show-btn pop-show-cancel-btn';
      cancelBtn.textContent = cancelText;
      cancelBtn.addEventListener('click', () => closeActivePopup(false, false));
      actions.appendChild(cancelBtn);
    }

    popup.appendChild(icon);
    popup.appendChild(titleNode);
    if (message) {
      popup.appendChild(messageNode);
    }
    popup.appendChild(actions);
    overlay.appendChild(popup);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeActivePopup(false, false);
      }
    });

    activeKeyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeActivePopup(false, false);
      }
    };
    document.addEventListener('keydown', activeKeyHandler);

    document.body.appendChild(overlay);
    activeOverlay = overlay;

    requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
      popup.classList.add('is-visible');
    });

    if (autoCloseMs > 0) {
      activeTimer = setTimeout(() => {
        closeActivePopup(true, true);
      }, autoCloseMs);
    }

    setTimeout(() => confirmBtn.focus(), 0);
  });
};

// Global Toast Container Element
let toastContainer: HTMLDivElement | null = null;

const getToastContainer = (): HTMLDivElement => {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'pop-toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', durationMs = 3000): void => {
  if (typeof document === 'undefined') return;

  const container = getToastContainer();
  
  // Remove any currently displayed toasts to prevent spam / stacking
  const existingToasts = container.querySelectorAll('.pop-toast-item');
  existingToasts.forEach((t) => t.remove());

  const toast = document.createElement('div');
  toast.className = `pop-toast-item pop-toast-${type}`;

  // Check if this is a cart/shopping related toast
  const isCart = message.toLowerCase().includes('cart') || message.includes('🛒');
  const cleanMessage = message.replace(/^[🛒🛍️📦✅❌ℹ️\s]+/, '').trim();

  let iconSvg = '';
  if (isCart) {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`;
  } else if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="pop-toast-icon">${iconSvg}</div>
    <div class="pop-toast-content">
      <div class="pop-toast-msg">${cleanMessage}</div>
    </div>
    <button type="button" class="pop-toast-close" aria-label="Close">&times;</button>
  `;

  const closeBtn = toast.querySelector('.pop-toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toast.classList.add('pop-toast-fadeout');
      setTimeout(() => toast.remove(), 250);
    });
  }

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('pop-toast-visible');
  });

  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.classList.add('pop-toast-fadeout');
      setTimeout(() => toast.remove(), 250);
    }
  }, durationMs);
};

export const showSuccess = async (message = 'Success!', title = 'Success'): Promise<boolean> => {
  const res = await buildPopup({
    type: 'success',
    title,
    message,
    confirmText: 'OK',
    showCancel: false,
  });
  return res.isConfirmed;
};

export const showError = async (message = 'Something went wrong!', title = 'Error'): Promise<boolean> => {
  const res = await buildPopup({
    type: 'error',
    title,
    message,
    confirmText: 'OK',
    showCancel: false,
  });
  return res.isConfirmed;
};

// Pulls the real validation message out of a failed API response (backend
// controllers return `{ message: "..." }` or ASP.NET ModelState `{ errors: { Field: [...] } }`)
// and formats field validations into polite user-friendly "Please enter..." messages.
export const extractApiErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text);
      if (data) {
        // 1. Direct message property
        if (typeof data.message === 'string' && data.message.trim()) {
          let msg = data.message.trim().replace(/^['"]|['"]$/g, '');
          if (msg.toLowerCase().includes('is required') || msg.toLowerCase().includes('are required')) {
            const field = msg.replace(/is required\.?/i, '').replace(/are required\.?/i, '').trim();
            return `Please enter ${field}.`;
          }
          return msg;
        }

        // 2. ASP.NET Standard ModelState Validation Errors
        if (data.errors && typeof data.errors === 'object') {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey && Array.isArray(data.errors[firstKey]) && data.errors[firstKey].length > 0) {
            let firstErr = String(data.errors[firstKey][0]).trim();
            if (firstErr.toLowerCase().includes('is required') || firstErr.toLowerCase().includes('are required')) {
              const fieldName = firstKey.replace(/^.*\./, '');
              return `Please enter ${fieldName}.`;
            }
            return firstErr;
          }
        }

        // 3. Title fallback
        if (typeof data.title === 'string' && data.title.trim() && !data.title.includes('One or more validation errors')) {
          return data.title;
        }
      }
    } catch {
      // Not JSON - clean raw text
    }
    return text.replace(/^['"]|['"]$/g, '').trim();
  } catch {
    return fallback;
  }
};

export const showConfirm = async (
  message: string,
  title = 'Please Confirm',
  confirmButtonText = 'OK',
  cancelButtonText = 'Cancel'
): Promise<boolean> => {
  const result = await buildPopup({
    type: 'confirm',
    title,
    message,
    confirmText: confirmButtonText,
    cancelText: cancelButtonText,
    showCancel: true,
  });
  return result.isConfirmed;
};

export default {
  showConfirm,
  showSuccess,
  showError,
  buildPopup,
  closeActivePopup,
  extractApiErrorMessage,
};
