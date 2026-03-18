import { Ruler, Weight, Calendar, Flame, Activity } from 'lucide-react';
import './ProfileCard.css';

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

export default function ProfileCard({ profile }) {
  if (!profile) return null;

  const weightKg = profile.weight_g ? (profile.weight_g / 1000).toFixed(1) : '—';

  return (
    <div className="profile-card card">
      <div className="profile-card__stats">
        <div className="profile-card__stat">
          <Ruler size={16} />
          <span className="profile-card__value mono">{profile.height_cm || '—'}</span>
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
          <span className="profile-card__value mono">{profile.age || '—'}</span>
          <span className="profile-card__unit">yrs</span>
        </div>
        <div className="profile-card__divider" />
        <div className="profile-card__stat">
          <Activity size={16} />
          <span className="profile-card__value">{ACTIVITY_LABELS[profile.activity_level] || '—'}</span>
        </div>
        <div className="profile-card__divider" />
        <div className="profile-card__stat profile-card__stat--goal">
          <Flame size={16} />
          <span className="profile-card__value mono">{profile.daily_calorie_goal?.toLocaleString() || '—'}</span>
          <span className="profile-card__unit">kcal/day</span>
        </div>
      </div>
    </div>
  );
}
