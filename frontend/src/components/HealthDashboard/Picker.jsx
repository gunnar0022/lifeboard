/**
 * "Add widget" menu — only visible in edit mode.
 * Lists every disabled widget grouped by category; click to enable.
 */
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { WIDGETS, WIDGET_GROUPS, WIDGET_BY_ID } from './registry';

export default function WidgetPicker({ widgets, onEnable, filter }) {
  const [open, setOpen] = useState(false);

  // Disabled widgets, in registry order, grouped by category
  const enabledIds = new Set(widgets.filter(w => w.enabled).map(w => w.id));
  const disabled = WIDGETS.filter(
    w => !enabledIds.has(w.id) && (!filter || filter(w.id))
  );

  if (disabled.length === 0 && !open) {
    return (
      <div className="hd-picker hd-picker--empty">
        All available widgets are already on the dashboard.
      </div>
    );
  }

  if (!open) {
    return (
      <button className="hd-picker__trigger" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add a widget
      </button>
    );
  }

  // Group disabled widgets
  const grouped = {};
  for (const w of disabled) {
    if (!grouped[w.group]) grouped[w.group] = [];
    grouped[w.group].push(w);
  }

  return (
    <div className="hd-picker">
      <div className="hd-picker__head">
        <span className="hd-picker__title">Add a widget</span>
        <button className="hd-picker__close" onClick={() => setOpen(false)} title="Close">
          <X size={14} />
        </button>
      </div>
      <div className="hd-picker__groups">
        {Object.entries(grouped).map(([groupId, widgetsInGroup]) => (
          <div key={groupId} className="hd-picker__group">
            <div className="hd-picker__group-title">{WIDGET_GROUPS[groupId]?.label || groupId}</div>
            <div className="hd-picker__items">
              {widgetsInGroup.map(w => (
                <button
                  key={w.id}
                  className="hd-picker__item"
                  onClick={() => { onEnable(w.id); }}
                >
                  <div className="hd-picker__item-label">{w.label}</div>
                  {w.description && <div className="hd-picker__item-desc">{w.description}</div>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
