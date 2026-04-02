/// <reference path="../.astro/types.d.ts" />
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
export {};
