import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getShopStatus } from './opening-hours';

describe('getShopStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const settings = {
    openTime: '14:00',
    closeTime: '22:00',
  };

  it('should return "closed" before opening time', () => {
    // Set time to 12:00 Oslo (11:00 UTC in Jan)
    vi.setSystemTime(new Date('2024-01-01T11:00:00Z')); 

    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('closed');
    expect(result.message).toContain('Åpner 14:00');
  });

  it('should return "open" during business hours', () => {
    // Set time to 16:00 Oslo (15:00 UTC in Jan)
    vi.setSystemTime(new Date('2024-01-01T15:00:00Z'));

    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('open');
    expect(result.message).toContain('Åpent til 22:00');
  });

  it('should return "closing_soon" 20 minutes before closing', () => {
    // Set time to 21:40 Oslo (20:40 UTC in Jan)
    vi.setSystemTime(new Date('2024-01-01T20:40:00Z'));

    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('closing_soon');
    expect(result.message).toContain('Stenger snart');
  });

  it('should return "closed" after closing time', () => {
    // Set time to 23:00 Oslo (22:00 UTC in Jan)
    vi.setSystemTime(new Date('2024-01-01T22:00:00Z'));

    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('closed');
    expect(result.message).toContain('Åpner i morgen 14:00');
  });

  it('should return "closed" if isManualClosed is true', () => {
    vi.setSystemTime(new Date('2024-01-01T15:00:00Z')); // During open hours (16:00 Oslo)

    const result = getShopStatus(settings.openTime, settings.closeTime, true);
    expect(result.status).toBe('closed');
    expect(result.message).toBe('Stengt for øyeblikket');
  });
});
