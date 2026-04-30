/** Possible shop statuses — used by `ShopStatusBadge` to pick the Badge variant. */
export type StatusType = 'open' | 'closed' | 'closing_soon';

export interface ShopStatus {
  status: StatusType;
  message: string;
}

/**
 * Calculates the current shop status based on Norway local time (Europe/Oslo).
 *
 * The function uses `Intl.DateTimeFormat` with the `Europe/Oslo` timezone to
 * determine the current time, which correctly handles DST transitions and
 * does not depend on the server's or client's system timezone setting.
 *
 * Three-state logic:
 *  - `open` — within business hours and more than 30 min until closing
 *  - `closing_soon` — within business hours but 30 min or less until closing
 *  - `closed` — outside business hours (shows "Åpner" or "Åpner i morgen")
 *
 * @param openTime - Opening time in HH:mm (default "14:00")
 * @param closeTime - Closing time in HH:mm (default "22:00")
 * @param isManualClosed - Admin override that forces "closed" regardless of schedule
 */
export function getShopStatus(
  openTime: string = '14:00',
  closeTime: string = '22:00',
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

  const getPart = (type: string) =>
    norwayTime.find((p) => p.type === type)?.value;

  const hours = parseInt(getPart('hour') || '0');
  const minutes = parseInt(getPart('minute') || '0');
  const currentTimeInMinutes = hours * 60 + minutes;

  const [openH, openM] = strOpen.split(':').map(Number);
  const [closeH, closeM] = strClose.split(':').map(Number);

  const openTimeInMinutes = (openH || 0) * 60 + (openM || 0);
  const closeTimeInMinutes = (closeH || 0) * 60 + (closeM || 0);

  if (
    currentTimeInMinutes >= openTimeInMinutes &&
    currentTimeInMinutes < closeTimeInMinutes
  ) {
    // If less than 30 minutes until closing
    if (closeTimeInMinutes - currentTimeInMinutes <= 30) {
      return { status: 'closing_soon', message: `Stenger snart (${strClose})` };
    }
    return { status: 'open', message: `Åpent til ${strClose}` };
  }

  // Before opening time → shows opening time ("Åpner 14:00")
  if (currentTimeInMinutes < openTimeInMinutes) {
    return { status: 'closed', message: `Stengt - Åpner ${strOpen}` };
  }

  // After closing time → shows next day's opening ("Åpner i morgen 14:00")
  return {
    status: 'closed',
    message: `Stengt - Åpner i morgen ${strOpen}`,
  };
}
