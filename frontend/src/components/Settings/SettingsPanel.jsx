import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, Download, Upload, Loader, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useApi, apiPut } from '../../hooks/useApi';
import { NAV_CONFIG, migrateSettings } from '../../config/navigation';
import './SettingsPanel.css';

export default function SettingsPanel({ onThemeChange, onPanelVisibilityChange, onBack, panelVisibility }) {
  const { data: settings, loading } = useApi('/api/settings');
  const [local, setLocal] = useState(null);
  const [backupStatus, setBackupStatus] = useState('idle');
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState('idle');
  const [restoreMsg, setRestoreMsg] = useState('');
  const fileRef = useRef(null);
  const checkinTimer = useRef(null);

  useEffect(() => {
    if (settings && !local) {
      const migrated = { ...settings, panels: migrateSettings(settings.panels) };
      setLocal(migrated);
    }
  }, [settings]);

  const update = async (field, value) => {
    const next = { ...local, [field]: value };
    setLocal(next);
    try {
      await apiPut('/api/settings', { [field]: value });
    } catch (e) {
      console.error('Settings update failed:', e);
    }
  };

  const updatePanel = async (key, enabled) => {
    const panels = { ...local.panels, [key]: enabled };

    // If toggling a parent off, disable all its sub-tabs too
    const config = NAV_CONFIG[key];
    if (config?.subtabs && !enabled) {
      for (const sub of Object.keys(config.subtabs)) {
        panels[`${key}.${sub}`] = false;
      }
    }
    // If toggling a parent on, enable all its sub-tabs
    if (config?.subtabs && enabled) {
      for (const sub of Object.keys(config.subtabs)) {
        if (panels[`${key}.${sub}`] === false) {
          panels[`${key}.${sub}`] = true;
        }
      }
    }

    // If toggling a sub-tab on, make sure parent is on
    if (key.includes('.') && enabled) {
      const parentKey = key.split('.')[0];
      panels[parentKey] = true;
    }

    // Prevent disabling all top-level panels
    const topLevelKeys = Object.keys(NAV_CONFIG);
    const anyEnabled = topLevelKeys.some(k => panels[k] !== false);
    if (!anyEnabled) return;

    const next = { ...local, panels };
    setLocal(next);
    if (onPanelVisibilityChange) onPanelVisibilityChange(panels);
    try {
      await apiPut('/api/settings', { panels });
    } catch (e) {
      console.error('Panel toggle failed:', e);
    }
  };

  const handleThemeChange = (theme) => {
    update('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lifeboard-theme', theme);
    if (onThemeChange) onThemeChange(theme);
  };

  const handleCheckinChange = (value) => {
    setLocal(prev => ({ ...prev, evening_checkin_time: value }));
    if (checkinTimer.current) clearTimeout(checkinTimer.current);
    checkinTimer.current = setTimeout(() => {
      apiPut('/api/settings', { evening_checkin_time: value }).catch(console.error);
    }, 500);
  };

  const handleBackup = async () => {
    setBackupStatus('loading');
    try {
      const res = await fetch('/api/settings/backup');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'lifeboard-backup.db';
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('done');
      setTimeout(() => setBackupStatus('idle'), 2000);
    } catch (e) {
      console.error('Backup failed:', e);
      setBackupStatus('idle');
    }
  };

  const handleRestoreSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreModal(true);
    e.target.value = '';
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoreStatus('loading');
    try {
      const form = new FormData();
      form.append('file', restoreFile);
      const res = await fetch('/api/settings/restore', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Restore failed');
      setRestoreStatus('done');
      setRestoreMsg(data.message);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setRestoreStatus('error');
      setRestoreMsg(e.message);
    }
  };

  const closeRestoreModal = () => {
    setRestoreModal(false);
    setRestoreFile(null);
    setRestoreStatus('idle');
    setRestoreMsg('');
  };

  if (loading || !local) {
    return (
      <div className="settings">
        <div className="settings__header">
          <Settings size={24} />
          <h2>Settings</h2>
        </div>
        <div className="settings__loading"><Loader size={20} /></div>
      </div>
    );
  }

  const currentTheme = local.theme || localStorage.getItem('lifeboard-theme') || 'dark';

  return (
    <div className="settings">
      <div className="settings__header">
        {onBack && (
          <button className="settings__back" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
        )}
        <Settings size={24} />
        <h2>Settings</h2>
      </div>

      {/* Appearance */}
      <section className="settings__section">
        <h3 className="settings__section-title">Appearance</h3>
        <div className="settings__theme-cards">
          <button
            className={`settings__theme-card ${currentTheme === 'light' ? 'settings__theme-card--active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <Sun size={20} />
            <span>Light</span>
            {currentTheme === 'light' && <Check size={14} className="settings__theme-check" />}
          </button>
          <button
            className={`settings__theme-card ${currentTheme === 'dark' ? 'settings__theme-card--active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <Moon size={20} />
            <span>Dark</span>
            {currentTheme === 'dark' && <Check size={14} className="settings__theme-check" />}
          </button>
        </div>
      </section>

      {/* Panels — hierarchical */}
      <section className="settings__section">
        <h3 className="settings__section-title">Panels</h3>
        <p className="settings__hint">Show or hide dashboard panels. Data is preserved when a panel is hidden.</p>
        {Object.entries(NAV_CONFIG).map(([panelId, config]) => {
          const parentEnabled = local.panels?.[panelId] !== false;
          return (
            <div key={panelId} className="settings__panel-group">
              <div className="settings__row">
                <span className="settings__label">{config.label}</span>
                <button
                  className={`settings__toggle ${parentEnabled ? 'settings__toggle--on' : ''}`}
                  onClick={() => updatePanel(panelId, !parentEnabled)}
                >
                  <span className="settings__toggle-thumb" />
                  <span className="settings__toggle-label">{parentEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
              {config.subtabs && parentEnabled && (
                <div className="settings__subtab-toggles">
                  {Object.entries(config.subtabs).map(([subKey, subConfig]) => {
                    const fullKey = `${panelId}.${subKey}`;
                    const subEnabled = local.panels?.[fullKey] !== false;
                    return (
                      <div key={fullKey} className="settings__row settings__row--sub">
                        <span className="settings__label settings__label--sub">{subConfig.label}</span>
                        <button
                          className={`settings__toggle settings__toggle--sm ${subEnabled ? 'settings__toggle--on' : ''}`}
                          onClick={() => updatePanel(fullKey, !subEnabled)}
                        >
                          <span className="settings__toggle-thumb" />
                          <span className="settings__toggle-label">{subEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Schedule */}
      <section className="settings__section">
        <h3 className="settings__section-title">Schedule</h3>
        <div className="settings__row">
          <div>
            <span className="settings__label">Timezone</span>
            <span className="settings__hint-inline">Used for schedulers, briefings, and weather</span>
          </div>
          <select
            className="settings__select"
            value={local.timezone || 'Asia/Tokyo'}
            onChange={e => update('timezone', e.target.value)}
          >
            <optgroup label="Japan">
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </optgroup>
            <optgroup label="Americas">
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/Denver">America/Denver (MST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="America/Anchorage">America/Anchorage (AKST)</option>
              <option value="Pacific/Honolulu">Pacific/Honolulu (HST)</option>
            </optgroup>
            <optgroup label="Europe">
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
            </optgroup>
            <optgroup label="Asia-Pacific">
              <option value="Asia/Seoul">Asia/Seoul (KST)</option>
              <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            </optgroup>
            <optgroup label="Other">
              <option value="UTC">UTC</option>
            </optgroup>
          </select>
        </div>
        <div className="settings__row">
          <div>
            <span className="settings__label">Pay cycle day</span>
            <span className="settings__hint-inline">Day of month your pay cycle starts</span>
          </div>
          <select
            className="settings__select"
            value={local.pay_cycle_day || 25}
            onChange={e => update('pay_cycle_day', parseInt(e.target.value))}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="settings__row">
          <div>
            <span className="settings__label">Evening check-in</span>
            <span className="settings__hint-inline">When the Health check-in is sent via Telegram</span>
          </div>
          <input
            className="settings__time-input"
            type="time"
            value={local.evening_checkin_time || '21:00'}
            onChange={e => handleCheckinChange(e.target.value)}
          />
        </div>
        <div className="settings__row">
          <div>
            <span className="settings__label">Morning briefing</span>
            <span className="settings__hint-inline">Daily 07:00 summary via Telegram</span>
          </div>
          {(() => {
            const enabled = local.morning_briefing_enabled !== false;
            return (
              <button
                className={`settings__toggle ${enabled ? 'settings__toggle--on' : ''}`}
                onClick={() => update('morning_briefing_enabled', !enabled)}
              >
                <span className="settings__toggle-thumb" />
                <span className="settings__toggle-label">{enabled ? 'ON' : 'OFF'}</span>
              </button>
            );
          })()}
        </div>
        <div className="settings__row">
          <div>
            <span className="settings__label">Evening check-in enabled</span>
            <span className="settings__hint-inline">Turn off to skip the Telegram check-in prompt</span>
          </div>
          {(() => {
            const enabled = local.evening_checkin_enabled !== false;
            return (
              <button
                className={`settings__toggle ${enabled ? 'settings__toggle--on' : ''}`}
                onClick={() => update('evening_checkin_enabled', !enabled)}
              >
                <span className="settings__toggle-thumb" />
                <span className="settings__toggle-label">{enabled ? 'ON' : 'OFF'}</span>
              </button>
            );
          })()}
        </div>
      </section>

      {/* Data */}
      <section className="settings__section">
        <h3 className="settings__section-title">Data</h3>

        <div className="settings__data-block">
          <div>
            <strong>Backup</strong>
            <p className="settings__hint">Download a complete copy of your database.</p>
          </div>
          <button className="settings__action-btn" onClick={handleBackup} disabled={backupStatus !== 'idle'}>
            {backupStatus === 'loading' && <><Loader size={14} className="settings__spinner" /> Preparing...</>}
            {backupStatus === 'done' && <><Check size={14} /> Downloaded</>}
            {backupStatus === 'idle' && <><Download size={14} /> Download Backup</>}
          </button>
        </div>

        <div className="settings__data-block">
          <div>
            <strong>Restore</strong>
            <p className="settings__hint">Upload a previous backup to replace all current data.</p>
            <p className="settings__warning">
              <AlertTriangle size={14} /> This will overwrite everything. A safety copy of your current database will be saved automatically.
            </p>
          </div>
          <button className="settings__action-btn settings__action-btn--restore" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Upload & Restore
          </button>
          <input ref={fileRef} type="file" accept=".db" style={{ display: 'none' }} onChange={handleRestoreSelect} />
        </div>
      </section>

      {/* Restore Confirmation Modal */}
      {restoreModal && (
        <div className="settings__modal-overlay" onClick={restoreStatus === 'idle' ? closeRestoreModal : undefined}>
          <div className="settings__modal" onClick={e => e.stopPropagation()}>
            <h3><AlertTriangle size={18} /> Restore Database</h3>
            {restoreStatus === 'idle' && (
              <>
                <p>This will replace <strong>ALL</strong> current data with the contents of:</p>
                <p className="settings__modal-file">{restoreFile?.name} ({(restoreFile?.size / 1024 / 1024).toFixed(1)} MB)</p>
                <p>A safety copy of your current database will be saved automatically.</p>
                <p className="settings__warning">This cannot be undone from the UI.</p>
                <div className="settings__modal-actions">
                  <button className="settings__modal-cancel" onClick={closeRestoreModal}>Cancel</button>
                  <button className="settings__modal-confirm" onClick={handleRestore}>Restore</button>
                </div>
              </>
            )}
            {restoreStatus === 'loading' && (
              <div className="settings__modal-status">
                <Loader size={20} className="settings__spinner" />
                <p>Restoring database...</p>
              </div>
            )}
            {restoreStatus === 'done' && (
              <div className="settings__modal-status">
                <Check size={20} />
                <p>{restoreMsg}</p>
                <p>Reloading app...</p>
              </div>
            )}
            {restoreStatus === 'error' && (
              <div className="settings__modal-status">
                <AlertTriangle size={20} />
                <p>{restoreMsg}</p>
                <button className="settings__modal-cancel" onClick={closeRestoreModal}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
