/**
 * Single fetch point for everything the Health Dashboard widgets need.
 * Widgets pull state from useHealthData() instead of fetching themselves —
 * this keeps API traffic predictable and avoids duplicate requests.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const HealthDataContext = createContext(null);

export function HealthDataProvider({ rangeDays, children }) {
  const [garmin, setGarmin] = useState(null);
  const [garminStatus, setGarminStatus] = useState(null);
  const [profile, setProfile] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [recent, setRecent] = useState(null);
  const [concerns, setConcerns] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const safe = (p) => p.then(r => r.ok ? r.json() : null).catch(() => null);
    try {
      const [g, gs, p, h, rec, c, m] = await Promise.all([
        safe(fetch(`/api/garmin/dashboard?days=${rangeDays}`)),
        safe(fetch('/api/garmin/status')),
        safe(fetch('/api/health_body/profile')),
        safe(fetch('/api/health_body/heatmap?days=90')),
        safe(fetch('/api/health_body/recent')),
        safe(fetch('/api/health_body/concerns')),
        safe(fetch('/api/health_body/measurements')),
      ]);
      setGarmin(g);
      setGarminStatus(gs);
      setProfile(p);
      setHeatmap(h);
      setRecent(rec);
      setConcerns(c);
      setMeasurements(m);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const value = {
    garmin, garminStatus, profile, heatmap, recent, concerns, measurements,
    loading, error,
    rangeDays,
    refetch: fetchAll,
  };

  return <HealthDataContext.Provider value={value}>{children}</HealthDataContext.Provider>;
}

export function useHealthData() {
  const ctx = useContext(HealthDataContext);
  if (!ctx) throw new Error('useHealthData must be used inside HealthDataProvider');
  return ctx;
}
