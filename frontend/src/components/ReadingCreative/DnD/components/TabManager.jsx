import { useState } from 'react';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { TAB_REGISTRY } from '../dndUtils';

const REGISTRY_MAP = Object.fromEntries(TAB_REGISTRY.map(t => [t.id, t]));

/**
 * Edit-mode panel for managing character sheet tabs: drag to reorder,
 * toggle each tab on/off. Operates on the per-character tabsConfig array
 * ([{ id, enabled }]) and reports changes via onChange.
 */
export default function TabManager({ config, onChange, hasCampaign }) {
  const [dragFromId, setDragFromId] = useState(null);

  const toggle = (id) => {
    const tab = REGISTRY_MAP[id];
    if (tab?.requiresCampaign && !hasCampaign) return; // can't enable without a campaign
    onChange(config.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const handleDrop = (targetId) => {
    if (dragFromId == null || dragFromId === targetId) { setDragFromId(null); return; }
    const list = [...config];
    const fromIdx = list.findIndex(t => t.id === dragFromId);
    const moved = list.splice(fromIdx, 1)[0];
    const toIdx = list.findIndex(t => t.id === targetId);
    list.splice(toIdx, 0, moved);
    onChange(list);
    setDragFromId(null);
  };

  return (
    <div className="dnd-tab-manager">
      <span className="dnd-tab-manager__label">Tabs — drag to reorder, click to show/hide</span>
      <div className="dnd-tab-manager__list">
        {config.map(t => {
          const reg = REGISTRY_MAP[t.id];
          if (!reg) return null;
          const blocked = reg.requiresCampaign && !hasCampaign;
          return (
            <div
              key={t.id}
              className={`dnd-tab-manager__item ${t.enabled ? '' : 'dnd-tab-manager__item--off'} ${blocked ? 'dnd-tab-manager__item--blocked' : ''}`}
              draggable={!blocked}
              onDragStart={() => setDragFromId(t.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(t.id)}
              onClick={() => toggle(t.id)}
              title={blocked ? 'Requires a campaign' : (t.enabled ? 'Click to hide' : 'Click to show')}
            >
              <GripVertical size={11} className="dnd-tab-manager__grip" />
              <span className="dnd-tab-manager__name">{reg.label}</span>
              {t.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
