export function isChromeBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const vendor = navigator.vendor;
  const isChromium = /Chrome|Chromium/.test(ua) && /Google Inc/.test(vendor);
  const isNotChrome = /Edge|Edg|OPR|Opera|Vivaldi|YaBrowser|CocCoc/.test(ua) || typeof (navigator as any).brave !== 'undefined';
  return isChromium && !isNotChrome;
}
