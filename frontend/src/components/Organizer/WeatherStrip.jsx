import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './WeatherStrip.css';

const WEATHER_ICONS = {
  '0': '☀️', '1': '⛅', '2': '⛅', '3': '☁️',
  '45': '🌫️', '48': '🌫️',
  '51': '🌦️', '53': '🌦️', '55': '🌦️', '56': '🌦️', '57': '🌦️',
  '61': '🌧️', '63': '🌧️', '65': '🌧️', '66': '🌧️', '67': '🌧️',
  '80': '🌧️', '81': '🌧️', '82': '🌧️',
  '71': '🌨️', '73': '🌨️', '75': '🌨️', '77': '🌨️', '85': '🌨️', '86': '🌨️',
  '95': '⛈️', '96': '⛈️', '99': '⛈️',
};

function getIcon(code) {
  return WEATHER_ICONS[String(code)] || '❓';
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tmrw';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function WeatherStrip() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayExpanded, setTodayExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/weather')
      .then(r => {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data?.weekly?.daily) {
    return (
      <div className="weather-strip card">
        <div className="weather-strip__header">
          <span className="chart-title">Weather</span>
        </div>
        <div className="weather-strip__loading">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 64, height: 80, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  const { weekly, hourly } = data;
  const daily = weekly.daily;
  const dates = daily.time || [];
  const location = weekly._location || '';
  const stale = weekly._fetched_at;

  // Hourly data for today
  const todayHourly = hourly?.hourly;

  return (
    <div className="weather-strip card">
      <div className="weather-strip__header">
        <span className="chart-title">Weather</span>
        <span className="weather-strip__location">{location}</span>
      </div>

      <div className="weather-strip__days">
        {dates.map((dateStr, i) => {
          const hi = daily.temperature_2m_max[i];
          const lo = daily.temperature_2m_min[i];
          const code = daily.weathercode?.[i] ?? 0;
          const isToday = i === 0;

          return (
            <motion.button
              key={dateStr}
              className={`weather-day ${isToday ? 'weather-day--today' : ''} ${isToday && todayExpanded ? 'weather-day--expanded' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => isToday && setTodayExpanded(!todayExpanded)}
            >
              <span className="weather-day__label">{getDayLabel(dateStr)}</span>
              <span className="weather-day__icon">{getIcon(code)}</span>
              <span className="weather-day__temps">
                <span className="weather-day__hi">{Math.round(hi)}°</span>
                <span className="weather-day__lo">{Math.round(lo)}°</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Today's hourly detail */}
      {todayExpanded && todayHourly && (
        <motion.div
          className="weather-hourly"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <div className="weather-hourly__scroll">
            {todayHourly.time?.map((timeStr, i) => {
              const hour = timeStr.split('T')[1]?.slice(0, 5);
              const temp = todayHourly.temperature_2m?.[i];
              const code = todayHourly.weathercode?.[i] ?? 0;
              const precip = todayHourly.precipitation_probability?.[i] ?? 0;
              // Only show daylight hours (6-22)
              const h = parseInt(hour);
              if (h < 6 || h > 22) return null;
              return (
                <div key={timeStr} className="weather-hour">
                  <span className="weather-hour__time">{hour}</span>
                  <span className="weather-hour__icon">{getIcon(code)}</span>
                  <span className="weather-hour__temp mono">{Math.round(temp)}°</span>
                  {precip > 0 && (
                    <span className="weather-hour__precip mono">{precip}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
