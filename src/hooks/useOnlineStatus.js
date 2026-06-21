import { useState, useEffect } from 'react';

// Tracks browser connectivity. Note: this reflects network reachability,
// not Firestore's own sync state — Firestore queues writes locally
// regardless and syncs automatically once a connection is available.
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
