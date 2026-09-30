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
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '!' : '?';

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
// controllers return `{ message: "..." }` on 400/409/etc, e.g. "Email 'x' is
// already in use") so callers can show the actual reason instead of a generic
// "failed to save" - falls back to `fallback` if the body isn't in that shape.
export const extractApiErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text);
      if (data && typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
    } catch {
      // Not JSON - use the raw text as-is.
    }
    return text;
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
