export interface Session {
  id: string;
  os: string;
  browser: string;
  browserVersion?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  lastActive: string;
  locationOrTimezone: string;
  isCurrent: boolean;
}

export function detectCurrentSession(): Session {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // OS Detection
  let os = 'Windows 11';
  if (/windows nt 10\.0/i.test(ua)) {
    os = 'Windows 11';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser Detection
  let browser = 'Chrome';
  let browserVersion = '';

  if (/edg\/([0-9.]+)/i.test(ua)) {
    browser = 'Microsoft Edge';
    browserVersion = ua.match(/edg\/([0-9.]+)/i)?.[1] || '';
  } else if (/chrome\/([0-9.]+)/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Google Chrome';
    browserVersion = ua.match(/chrome\/([0-9.]+)/i)?.[1] || '';
  } else if (/safari\/([0-9.]+)/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Apple Safari';
    browserVersion = ua.match(/version\/([0-9.]+)/i)?.[1] || '';
  } else if (/firefox\/([0-9.]+)/i.test(ua)) {
    browser = 'Mozilla Firefox';
    browserVersion = ua.match(/firefox\/([0-9.]+)/i)?.[1] || '';
  } else if (/opr\/([0-9.]+)/i.test(ua)) {
    browser = 'Opera';
    browserVersion = ua.match(/opr\/([0-9.]+)/i)?.[1] || '';
  }

  // Device Type Detection
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    deviceType = 'mobile';
  }

  // Timezone Detection
  let timezone = 'Asia/Kolkata';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) timezone = tz;
  } catch (e) {
    timezone = 'Asia/Kolkata';
  }

  return {
    id: 'session-curr-' + Date.now().toString(36),
    os,
    browser,
    browserVersion: browserVersion ? `v${browserVersion.split('.')[0]}` : '',
    deviceType,
    lastActive: 'Active Now',
    locationOrTimezone: timezone,
    isCurrent: true,
  };
}
