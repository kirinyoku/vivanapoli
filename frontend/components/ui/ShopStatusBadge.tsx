'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import { getShopStatus, ShopStatus } from '@/lib/opening-hours';

export default function ShopStatusBadge({
  isManualClosed = false,
  openTime = '14:00',
  closeTime = '22:00',
}: {
  isManualClosed?: boolean;
  openTime?: string;
  closeTime?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ShopStatus | null>(null);

  // 1. Initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Update status when mounted or props change, and periodically
  useEffect(() => {
    if (!mounted) return;

    const update = () => setStatus(getShopStatus(openTime, closeTime, isManualClosed));
    update();

    // Update every minute to keep the status fresh
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [mounted, isManualClosed, openTime, closeTime]);

  if (!mounted || !status) {
    return (
      <Badge variant="outline" className="opacity-50">
        Laster status...
      </Badge>
    );
  }

  const variant = status.status === 'open' ? 'success' : 'hot';

  return (
    <Badge variant={variant} className="transition-all duration-500">
      {status.message}
    </Badge>
  );
}
