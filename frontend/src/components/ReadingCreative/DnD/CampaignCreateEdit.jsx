import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { apiPost } from '../../../hooks/useApi';
import ColorPicker from './ColorPicker';

function textColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 0.45 ? '#1a1410' : '#f4edd4';
}

export default function CampaignCreateEdit({ onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#c9a96e');
  const [saving, setSaving] = useState(false);

  const fg = textColor(color.length === 7 ? color : '#3a3228');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const result = await apiPost('/api/dnd/campaigns', { name: name.trim(), color });
      onCreated(result);
    } catch (e) {
      console.error('Failed to create campaign:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dnd-campaign-card dnd-campaign-card--creating" style={{ background: color, color: fg }}>
      <input
        className="dnd-campaign-card__name-input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Campaign name..."
        style={{ color: fg, borderColor: fg + '44' }}
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onCancel(); }}
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="dnd-campaign-card__edit-btns">
        <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ color: fg }}>
          <Check size={14} /> {saving ? 'Creating...' : 'Create'}
        </button>
        <button onClick={onCancel} style={{ color: fg }}><X size={14} /> Cancel</button>
      </div>
    </div>
  );
}
