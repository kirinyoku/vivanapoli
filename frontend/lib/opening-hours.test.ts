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
    // Set time to 12:00 (before 14:00)
    const date = new Date('2024-01-01T12:00:00Z'); // Note: UTC, but we check Norway time
    // Force set time to 12:00 in Norway timezone for testing
    vi.setSystemTime(new Date(2024, 0, 1, 12, 0)); 
    
    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('closed');
    expect(result.message).toContain('Åpner 14:00');
  });

  it('should return "open" during business hours', () => {
    // Set time to 16:00
    vi.setSystemTime(new Date(2024, 0, 1, 16, 0));
    
    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('open');
    expect(result.message).toContain('Åpent til 22:00');
  });

  it('should return "closing_soon" 20 minutes before closing', () => {
    // Set time to 21:40 (20 mins before 22:00)
    vi.setSystemTime(new Date(2024, 0, 1, 21, 40));
    
    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('closing_soon');
    expect(result.message).toContain('Stenger snart');
  });

  it('should return "closed" after closing time', () => {
    // Set time to 23:00
    vi.setSystemTime(new Date(2024, 0, 1, 23, 0));
    
    const result = getShopStatus(settings.openTime, settings.closeTime);
    expect(result.status).toBe('closed');
    expect(result.message).toContain('Åpner i morgen 14:00');
  });

  it('should return "closed" if isManualClosed is true', () => {
    vi.setSystemTime(new Date(2024, 0, 1, 16, 0)); // During open hours
    
    const result = getShopStatus(settings.openTime, settings.closeTime, true);
    expect(result.status).toBe('closed');
    expect(result.message).toBe('Stengt for øyeblikket');
  });
});
