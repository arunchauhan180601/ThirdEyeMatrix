export {};

declare global {
  interface ThirdEyePixelClient {
    track?: (eventName: string, properties?: Record<string, unknown>, options?: Record<string, unknown>) => void;
    page?: (properties?: Record<string, unknown>) => void;
    identify?: (identity: Record<string, unknown>) => void;
    trackCheckoutEvent?: (stage: string, properties?: Record<string, unknown>) => void;
    flush?: () => void;
    getState?: () => {
      visitorId: string | null;
      sessionId: string | null;
      utm: Record<string, unknown> | null;
      identity: Record<string, unknown> | null;
    };
  }

  interface Window {
    google: any;
    ThirdEyePixel?: ThirdEyePixelClient;
  }
}
