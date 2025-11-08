'use client';

import { useCallback } from 'react';

type PixelEventProperties = Record<string, unknown> | undefined;

type PixelAPI = {
  track?: (eventName: string, properties?: PixelEventProperties, options?: Record<string, unknown>) => void;
  page?: (properties?: PixelEventProperties) => void;
  identify?: (identity: Record<string, unknown>) => void;
  trackCheckoutEvent?: (stage: string, properties?: PixelEventProperties) => void;
  flush?: () => void;
};

const getPixel = (): PixelAPI | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.ThirdEyePixel || null;
};

export const useThirdEyePixel = () => {
  const track = useCallback((eventName: string, properties?: PixelEventProperties, options?: Record<string, unknown>) => {
    const pixel = getPixel();
    pixel?.track?.(eventName, properties, options);
  }, []);

  const page = useCallback((properties?: PixelEventProperties) => {
    const pixel = getPixel();
    pixel?.page?.(properties);
  }, []);

  const identify = useCallback((identity: Record<string, unknown>) => {
    const pixel = getPixel();
    pixel?.identify?.(identity);
  }, []);

  const trackCheckoutEvent = useCallback((stage: string, properties?: PixelEventProperties) => {
    const pixel = getPixel();
    pixel?.trackCheckoutEvent?.(stage, properties);
  }, []);

  const flush = useCallback(() => {
    const pixel = getPixel();
    pixel?.flush?.();
  }, []);

  return {
    track,
    page,
    identify,
    trackCheckoutEvent,
    flush,
  };
};

export type UseThirdEyePixel = ReturnType<typeof useThirdEyePixel>;

