export type StatusType = 'open' | 'closed' | 'closing_soon';

export interface ShopStatus {
  status: StatusType;
  message: string;
}

/**
 * Calculates if the shop is currently open based on Norway's timezone.
 * @param openTime - Opening time in HH:mm format (e.g., "14:00")
 * @param closeTime - Closing time in HH:mm format (e.g., "22:00")
 * @param isManualClosed - Force-closed flag from admin settings
 */
export function getShopStatus(
  openTime: any = '14:00',
  closeTime: any = '22:00',
  isManualClosed: boolean = false
): ShopStatus {
  if (isManualClosed === true) {
    return { status: 'closed', message: 'Stengt for øyeblikket' };
  }

  // Ensure we have strings to split
  const strOpen = typeof openTime === 'string' ? openTime : '14:00';
  const strClose = typeof closeTime === 'string' ? closeTime : '22:00';

  // Use Norway's timezone (Central European Time)
  const now = new Date();
  const norwayTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) => norwayTime.find(p => p.type === type)?.value;

  const hours = parseInt(getPart('hour') || '0');
  const minutes = parseInt(getPart('minute') || '0');
  const currentTimeInMinutes = hours * 60 + minutes;

  const [openH, openM] = strOpen.split(':').map(Number);
  const [closeH, closeM] = strClose.split(':').map(Number);

  const openTimeInMinutes = (openH || 0) * 60 + (openM || 0);
  const closeTimeInMinutes = (closeH || 0) * 60 + (closeM || 0);

  if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
    // If less than 30 minutes until closing
    if (closeTimeInMinutes - currentTimeInMinutes <= 30) {
      return { status: 'closing_soon', message: `Stenger snart (${strClose})` };
    }
    return { status: 'open', message: `Åpent til ${strClose}` };
  }

  // If closed, check when it opens next
  if (currentTimeInMinutes < openTimeInMinutes) {
    return { status: 'closed', message: `Stengt - Åpner ${strOpen}` };
  }

  // If already closed today
  return { 
    status: 'closed', 
    message: `Stengt - Åpner i morgen ${strOpen}` 
  };
}
