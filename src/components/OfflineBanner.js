import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Just came back online after being offline — show a brief confirmation
      setShowReconnected(true);
      const t = setTimeout(() => { setShowReconnected(false); setWasOffline(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [online, wasOffline]);

  if (!online) {
    return (
      <div className="no-print" style={{
        background: 'var(--gold-pale)', borderBottom: '1px solid var(--gold)',
        color: '#7a5a0a', fontSize: 13, padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontWeight: 500,
      }}>
        <WifiOff size={14} />
        You're offline — changes will be saved locally and synced automatically once you're back online.
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="no-print" style={{
        background: 'var(--green-pale)', borderBottom: '1px solid var(--green)',
        color: 'var(--green)', fontSize: 13, padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontWeight: 500,
      }}>
        <Wifi size={14} />
        Back online — syncing your changes now.
      </div>
    );
  }

  return null;
}
