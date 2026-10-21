'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (standalone) {
      setInstalled(true);
      return;
    }

    setIsIos(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!deferred && !isIos)) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    setShowHelp(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          padding: '9px 16px',
          border: '1px solid #2563eb',
          borderRadius: '8px',
          background: '#2563eb',
          color: '#ffffff',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Install app
      </button>

      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '400px',
              width: '100%',
              color: '#0f172a',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: '20px' }}>Install LaunchKit</h2>
            <p style={{ margin: '0 0 16px', color: '#475569', lineHeight: 1.7, fontSize: '14px' }}>
              {isIos
                ? 'In Safari, tap the Share button (the square with an arrow), then choose "Add to Home Screen".'
                : 'Open your browser menu and choose "Install app" or "Add to Home Screen".'}
            </p>
            <p style={{ margin: '0 0 20px', color: '#475569', lineHeight: 1.7, fontSize: '14px' }}>
              LaunchKit will then open full-screen with its own icon, just like a native app.
            </p>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                padding: '10px 22px',
                border: 'none',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
