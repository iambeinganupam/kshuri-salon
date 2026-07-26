// Wraps Google Identity Services (GIS) for One-Tap + button sign-in.
// Dynamically loads the GIS script and returns a prompt/cancel pair.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: string;
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
            }
          ) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, done: () => void) => void;
        };
      };
    };
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptLoaded = false;
let scriptLoading = false;
const callbacks: Array<() => void> = [];

function loadGISScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) { resolve(); return; }
    if (scriptLoading) { callbacks.push(resolve); return; }

    scriptLoading = true;
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

export interface UseGoogleOAuthOptions {
  clientId: string;
  onSuccess: (credential: string) => void | Promise<void>;
  onError?: (err: unknown) => void;
}

export function useGoogleOAuth({ clientId, onSuccess, onError }: UseGoogleOAuthOptions) {
  const initAndPrompt = async () => {
    try {
      await loadGISScript();
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            await onSuccess(credential);
          } catch (err) {
            onError?.(err);
          }
        },
        auto_select: false,
      });
      window.google!.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap was blocked/skipped — caller can show fallback
          onError?.(new Error('ONE_TAP_DISMISSED'));
        }
      });
    } catch (err) {
      onError?.(err);
    }
  };

  const renderButton = async (container: HTMLElement) => {
    try {
      await loadGISScript();
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            await onSuccess(credential);
          } catch (err) {
            onError?.(err);
          }
        },
      });
      window.google!.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 400,
      });
    } catch (err) {
      onError?.(err);
    }
  };

  return { initAndPrompt, renderButton };
}
