import { useState } from 'react';
import { Ruler, Weight, Calendar, Flame, Activity, Pencil, Check, X } from 'lucide-react';
import { apiPost } from '../../hooks/useApi';
import './ProfileCard.css';

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

const blankDraft = (profile) => ({
  height_cm: profile?.height_cm ?? '',
  weight_kg: profile?.weight_g ? (profile.weight_g / 1000).toFixed(1) : '',
  age: profile?.age ?? '',
  activity_level: profile?.activity_level || 'moderate',
  daily_calorie_goal: profile?.daily_calorie_goal ?? '',
});

export default function ProfileCard({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(blankDraft(profile));
  const [saving, setSaving] = useState(false);

  const hasProfile = !!profile?.id;

  const startEdit = () => {
    setDraft(blankDraft(profile));
    setEditing(true);
  };

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (draft.height_cm !== '') payload.height_cm = parseFloat(draft.height_cm);
      if (draft.weight_kg !== '') payload.weight_g = Math.round(parseFloat(draft.weight_kg) * 1000);
      if (draft.age !== '') payload.age = parseInt(draft.age);
      if (draft.activity_level) payload.activity_level = draft.activity_level;
      if (draft.daily_calorie_goal !== '') payload.daily_calorie_goal = parseInt(draft.daily_calorie_goal);
      await apiPost('/api/health_body/profile', payload);
      setEditing(false);
      onUpdate?.();
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="profile-card card profile-card--editing">
        <div className="profile-card__form">
          <label className="profile-card__field">
            <span>Height (cm)</span>
            <input type="number" value={draft.height_cm} onChange={e => setField('height_cm', e.target.value)} placeholder="cm" />
          </label>
          <label className="profile-card__field">
            <span>Weight (kg)</span>
            <input type="number" step="0.1" value={draft.weight_kg} onChange={e => setField('weight_kg', e.target.value)} placeholder="kg" />
          </label>
          <label className="profile-card__field">
            <span>Age</span>
            <input type="number" value={draft.age} onChange={e => setField('age', e.target.value)} placeholder="yrs" />
          </label>
          <label className="profile-card__field">
            <span>Activity</span>
            <select value={draft.activity_level} onChange={e => setField('activity_level', e.target.value)}>
              {Object.entries(ACTIVITY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>
          <label className="profile-card__field">
            <span>Calorie goal</span>
            <input type="number" value={draft.daily_calorie_goal} onChange={e => setField('daily_calorie_goal', e.target.value)} placeholder="kcal/day" />
          </label>
        </div>
        <div className="profile-card__form-actions">
          <button className="profile-card__btn profile-card__btn--cancel" onClick={() => setEditing(false)} disabled={saving}>
            <X size={14} /> Cancel
          </button>
          <button className="profile-card__btn profile-card__btn--save" onClick={handleSave} disabled={saving}>
            <Check size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  const weightKg = profile?.weight_g ? (profile.weight_g / 1000).toFixed(1) : '—';

  return (
    <div className="profile-card card">
      <div className="profile-card__stats">
        <div className="profile-card__stat">
          <Ruler size={16} />
          <span className="profile-card__value mono">{profile?.height_cm || '—'}</span>
          <span className="profile-card__unit">cm</span>
        </div>
        <div className="profile-card__divider" />
        <div className="profile-card__stat">
          <Weight size={16} />
          <span className="profile-card__value mono">{weightKg}</span>
          <span className="profile-card__unit">kg</span>
        </div>
        <div className="profile-card__divider" />
        <div className="profile-card__stat">
          <Calendar size={16} />
          <span className="profile-card__value mono">{profile?.age || '—'}</span>
          <span className="profile-card__unit">yrs</span>
        </div>
        <div className="profile-card__divider" />
        <div className="profile-card__stat">
          <Activity size={16} />
          <span className="profile-card__value">{ACTIVITY_LABELS[profile?.activity_level] || '—'}</span>
        </div>
        <div className="profile-card__divider" />
        <div className="profile-card__stat profile-card__stat--goal">
          <Flame size={16} />
          <span className="profile-card__value mono">{profile?.daily_calorie_goal?.toLocaleString() || '—'}</span>
          <span className="profile-card__unit">kcal/day</span>
        </div>
        <button className="profile-card__edit" onClick={startEdit} title={hasProfile ? 'Edit profile' : 'Set up profile'}>
          <Pencil size={13} />
        </button>
      </div>
      {!hasProfile && (
        <p className="profile-card__hint">No profile yet — click the pencil to set one up.</p>
      )}
    </div>
  );
}
