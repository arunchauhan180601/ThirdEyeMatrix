'use client';

import { useEffect } from 'react';

type ThirdEyePixelLoaderProps = {
  apiBase?: string;
};

const SCRIPT_ID = 'third-eye-pixel-script';

const ThirdEyePixelLoader = ({ apiBase }: ThirdEyePixelLoaderProps) => {
  useEffect(() => {
    const base = apiBase || process.env.NEXT_PUBLIC_PIXEL_BASE_URL;

    if (!base) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'ThirdEyePixelLoader: NEXT_PUBLIC_PIXEL_BASE_URL is not defined. Tracking pixel will not be loaded.'
        );
      }
      return;
    }

    const normalizedBase = base.replace(/\/$/, '');
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.setAttribute('data-api-base', normalizedBase);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${normalizedBase}/pixel/thirdeye-pixel.js`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.dataset.apiBase = normalizedBase;

    const sessionTimeout = process.env.NEXT_PUBLIC_PIXEL_SESSION_TIMEOUT_MINUTES;
    if (sessionTimeout) {
      script.dataset.sessionTimeoutMinutes = sessionTimeout;
    }

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [apiBase]);

  return null;
};

export default ThirdEyePixelLoader;

