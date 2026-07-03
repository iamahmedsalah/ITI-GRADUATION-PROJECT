export function isChromeBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const vendor = navigator.vendor;
  const isChromium = /Chrome|Chromium/.test(ua) && /Google Inc/.test(vendor);
  const browserNavigator = navigator as Navigator & { brave?: unknown };
  const isNotChrome = /Edge|Edg|OPR|Opera|Vivaldi|YaBrowser|CocCoc/.test(ua) || typeof browserNavigator.brave !== 'undefined';
  return isChromium && !isNotChrome;
}
