import { useState } from 'react';
import { Edit3, Trash2, Check, X } from 'lucide-react';
import { apiPut, apiDelete } from '../../../hooks/useApi';
import ColorPicker from './ColorPicker';

function textColor(hex) {
  // Simple luminance check for contrast
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 0.45 ? '#1a1410' : '#f4edd4';
}

export default function CampaignCard({ campaign, isSelected, onSelect, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [editColor, setEditColor] = useState(campaign.color);
  const [confirming, setConfirming] = useState(false);

  const color = editing ? editColor : campaign.color;
  const fg = textColor(color.length === 7 ? color : '#3a3228');

  const handleSave = async () => {
    await apiPut(`/api/dnd/campaigns/${campaign.id}`, { name: editName, color: editColor });
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    await apiDelete(`/api/dnd/campaigns/${campaign.id}`);
    setConfirming(false);
    onRefresh();
  };

  if (confirming) {
    return (
      <div className="dnd-campaign-card dnd-campaign-card--confirm" style={{ background: color, color: fg }}>
        <span>Delete this campaign and all its notes?</span>
        <div className="dnd-campaign-card__confirm-btns">
          <button onClick={handleDelete} style={{ color: fg }}>Yes</button>
          <button onClick={() => setConfirming(false)} style={{ color: fg }}>No</button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="dnd-campaign-card dnd-campaign-card--editing" style={{ background: color, color: fg }}>
        <input
          className="dnd-campaign-card__name-input"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          style={{ color: fg, borderColor: fg + '44' }}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        />
        <ColorPicker value={editColor} onChange={setEditColor} />
        <div className="dnd-campaign-card__edit-btns">
          <button onClick={handleSave} style={{ color: fg }}><Check size={14} /> Save</button>
          <button onClick={() => setEditing(false)} style={{ color: fg }}><X size={14} /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <button
      className={`dnd-campaign-card ${isSelected ? 'dnd-campaign-card--selected' : ''}`}
      style={{ background: color, color: fg, borderColor: isSelected ? fg : color }}
      onClick={() => onSelect(campaign.id)}
    >
      <span className="dnd-campaign-card__name">{campaign.name}</span>
      {isSelected && <span className="dnd-campaign-card__dot">&#x25CF;</span>}
      <div className="dnd-campaign-card__actions" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setEditName(campaign.name); setEditColor(campaign.color); setEditing(true); }} style={{ color: fg }}>
          <Edit3 size={12} />
        </button>
        <button onClick={() => setConfirming(true)} style={{ color: fg }}>
          <Trash2 size={12} />
        </button>
      </div>
    </button>
  );
}
