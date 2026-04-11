export interface DayHours {
  open: string; // HH:mm
  close: string; // HH:mm
  closed?: boolean;
}

export interface WeeklyHours {
  [key: number]: DayHours; // 0 (Sunday) to 6 (Saturday)
}

export const OPENING_HOURS: WeeklyHours = {
  1: { open: '14:00', close: '22:00' }, // Monday
  2: { open: '14:00', close: '22:00' }, // Tuesday
  3: { open: '14:00', close: '22:00' }, // Wednesday
  4: { open: '14:00', close: '22:00' }, // Thursday
  5: { open: '14:00', close: '22:00' }, // Friday
  6: { open: '14:00', close: '22:00' }, // Saturday
  0: { open: '14:00', close: '22:00' }, // Sunday
};

export type StatusType = 'open' | 'closed' | 'closing_soon';

export interface ShopStatus {
  status: StatusType;
  message: string;
}

export function getShopStatus(isManualClosed: boolean = false): ShopStatus {
  if (isManualClosed) {
    return { status: 'closed', message: 'Stengt for øyeblikket' };
  }

  // Use Norway's timezone (Central European Time)
  const now = new Date();
  const norwayTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) => norwayTime.find(p => p.type === type)?.value;
  
  const weekdayStr = getPart('weekday') || 'Sun';
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
  };
  
  const weekday = dayMap[weekdayStr];
  const hours = parseInt(getPart('hour') || '0');
  const minutes = parseInt(getPart('minute') || '0');
  const currentTimeInMinutes = hours * 60 + minutes;

  const todayHours = OPENING_HOURS[weekday];

  if (todayHours.closed) {
    return { status: 'closed', message: 'Stengt i dag' };
  }

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  
  const openTimeInMinutes = openH * 60 + openM;
  const closeTimeInMinutes = closeH * 60 + closeM;

  if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
    // If less than 30 minutes until closing
    if (closeTimeInMinutes - currentTimeInMinutes <= 30) {
      return { status: 'closing_soon', message: `Stenger snart (${todayHours.close})` };
    }
    return { status: 'open', message: `Åpent til ${todayHours.close}` };
  }

  // If closed, check when it opens next
  if (currentTimeInMinutes < openTimeInMinutes) {
    return { status: 'closed', message: `Stengt - Åpner ${todayHours.open}` };
  }

  // If already closed today, check tomorrow
  const nextDay = (weekday + 1) % 7;
  const tomorrowHours = OPENING_HOURS[nextDay];
  return { 
    status: 'closed', 
    message: tomorrowHours.closed 
      ? 'Stengt - Åpner mandag' 
      : `Stengt - Åpner i morgen ${tomorrowHours.open}` 
  };
}
