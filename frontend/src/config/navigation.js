/**
 * NAV_CONFIG — Single source of truth for the tab/sub-tab structure.
 * Sidebar items are top-level keys. Sub-tabs are nested under `subtabs`.
 * Backend agent IDs (finance, health_body, etc.) are NOT changed — this
 * is purely a frontend display mapping.
 */

export const NAV_CONFIG = {
  organizer: {
    label: 'Organizer',
    icon: 'calendar-check',
    accent: '#F97066',
    subtabs: {
      calendar: { label: 'Calendar' },
      tasks_bills: { label: 'Tasks & Bills' },
      documents: { label: 'Documents' },
    },
  },
  health_fitness: {
    label: 'Health & Fitness',
    icon: 'heart-pulse',
    accent: '#F59E0B',
    subtabs: {
      health: { label: 'Health' },
      fitness: { label: 'Fitness' },
    },
  },
  money: {
    label: 'Money',
    icon: 'dollar-sign',
    accent: '#0EA5A0',
    subtabs: {
      finance: { label: 'Finance' },
      investing: { label: 'Investing' },
    },
  },
  creative: {
    label: 'Creative',
    icon: 'book-open',
    accent: '#B07CD8',
    subtabs: {
      workspace: { label: 'Workspace' },
      reading: { label: 'Reading' },
      dnd: { label: 'D&D' },
    },
  },
  projects: {
    label: 'Projects',
    icon: 'folder-kanban',
    accent: '#EC4899',
    subtabs: null,
  },
  system: {
    label: 'System',
    icon: 'monitor',
    accent: '#6B7280',
    subtabs: {
      health: { label: 'Health' },
    },
  },
};

/**
 * Get the default (first visible) sub-tab for a panel.
 */
export function getDefaultSubTab(panelId, panelVisibility = {}) {
  const config = NAV_CONFIG[panelId];
  if (!config?.subtabs) return null;

  for (const key of Object.keys(config.subtabs)) {
    const settingsKey = `${panelId}.${key}`;
    if (panelVisibility[settingsKey] !== false) {
      return key;
    }
  }
  // All sub-tabs disabled — return first anyway as fallback
  return Object.keys(config.subtabs)[0];
}

/**
 * Get visible sub-tabs for a panel, filtered by settings.
 */
export function getVisibleSubTabs(panelId, panelVisibility = {}) {
  const config = NAV_CONFIG[panelId];
  if (!config?.subtabs) return [];

  return Object.entries(config.subtabs)
    .filter(([key]) => panelVisibility[`${panelId}.${key}`] !== false)
    .map(([key, cfg]) => ({ key, ...cfg }));
}

/**
 * Check if a sidebar item should be visible based on settings.
 */
export function isPanelVisible(panelId, panelVisibility = {}) {
  return panelVisibility[panelId] !== false;
}

/**
 * Migrate old flat panel settings to new dot-notation format.
 * Old: { finance: true, investing: true, health_body: true, ... }
 * New: { money: true, money.finance: true, money.investing: true, ... }
 */
export function migrateSettings(oldPanels) {
  if (!oldPanels) return {};

  // If already migrated (has dot-notation keys), return as-is
  if (Object.keys(oldPanels).some(k => k.includes('.'))) {
    return oldPanels;
  }

  const migrated = {};

  // Map old agent IDs to new structure
  const mapping = {
    life_manager: { parent: 'organizer', subtabs: ['calendar', 'tasks_bills', 'documents'] },
    health_body: { parent: 'health_fitness', subtabs: ['health', 'fitness'] },
    finance: { parent: 'money', subtabs: ['finance'] },
    investing: { parent: 'money', subtabs: ['investing'] },
    reading_creative: { parent: 'creative', subtabs: ['workspace', 'reading', 'dnd'] },
    projects: { parent: 'projects', subtabs: [] },
  };

  // Track parent visibility (parent is visible if ANY of its old agents were visible)
  const parentVisible = {};

  for (const [oldId, map] of Object.entries(mapping)) {
    const wasVisible = oldPanels[oldId] !== false;
    if (!parentVisible[map.parent]) parentVisible[map.parent] = false;
    if (wasVisible) parentVisible[map.parent] = true;

    for (const sub of map.subtabs) {
      migrated[`${map.parent}.${sub}`] = wasVisible;
    }
  }

  // Set parent visibility
  for (const [parent, visible] of Object.entries(parentVisible)) {
    migrated[parent] = visible;
  }

  // Defaults for new items not in old settings
  if (migrated['system'] === undefined) migrated['system'] = true;
  if (migrated['system.health'] === undefined) migrated['system.health'] = true;

  return migrated;
}
