import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Shell/Sidebar';
import TopBar from './components/Shell/TopBar';
import SubTabBar from './components/Shell/SubTabBar';
import HomePanel from './components/Shell/HomePanel';
import SetupWizard from './components/Setup/SetupWizard';
import SettingsPanel from './components/Settings/SettingsPanel';
import FinancePanel from './components/Finance/FinancePanel';
import InvestingPanel from './components/Investing/InvestingPanel';
import SystemHealthPanel from './components/SystemHealth/SystemHealthPanel';
import ProjectsPanel from './components/Projects/ProjectsPanel';
import OrganizerCalendar from './components/Organizer/OrganizerCalendar';
import OrganizerTasksBills from './components/Organizer/OrganizerTasksBills';
import OrganizerDocuments from './components/Organizer/OrganizerDocuments';
import HealthTab from './components/HealthFitness/HealthTab';
import FitnessTab from './components/HealthFitness/FitnessTab';
import CreativeWorkspaceTab from './components/Creative/CreativeWorkspaceTab';
import CreativeReading from './components/Creative/CreativeReading';
import CreativeDnD from './components/Creative/CreativeDnD';
import { NAV_CONFIG, getDefaultSubTab, migrateSettings } from './config/navigation';
import { useApi, RefreshContext } from './hooks/useApi';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

export default function App() {
  const [activePanel, setActivePanel] = useState('home');
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [previousPanel, setPreviousPanel] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [panelVisibility, setPanelVisibility] = useState(null);
  const [refreshSignal, setRefreshSignal] = useState({});

  // WebSocket for live dashboard updates
  const handleWsMessage = useCallback((message) => {
    if (message.event === 'data_changed') {
      setRefreshSignal(prev => ({
        ...prev,
        [message.panel]: message.timestamp,
      }));
    }
  }, []);
  const { connected: wsConnected } = useWebSocket(handleWsMessage);

  const [setupComplete, setSetupComplete] = useState(null);

  const { data: config, loading: configLoading } = useApi('/api/config');
  const { data: nudges } = useApi('/api/nudges');
  const { data: settings } = useApi('/api/settings');

  // Load and migrate panel visibility from settings
  useEffect(() => {
    if (settings?.panels) {
      const migrated = migrateSettings(settings.panels);
      setPanelVisibility(migrated);
    }
  }, [settings]);

  // Check setup status on load
  useEffect(() => {
    let retries = 0;
    const check = () => {
      fetch('/api/setup/status')
        .then(r => {
          if (!r.ok) throw new Error('not ok');
          return r.json();
        })
        .then(data => setSetupComplete(data.setup_complete))
        .catch(() => {
          retries++;
          if (retries < 10) {
            setTimeout(check, 1500);
          } else {
            setSetupComplete(false);
          }
        });
    };
    check();
  }, []);

  const handleNavigate = (panelId, subTabId) => {
    if (panelId === 'settings') {
      setPreviousPanel(activePanel);
    }
    setActivePanel(panelId);
    // Set sub-tab: use provided one, or default to first visible
    const sub = subTabId || getDefaultSubTab(panelId, panelVisibility || {});
    setActiveSubTab(sub);
    setMobileMenuOpen(false);
  };

  const handleSubTabChange = (subTabId) => {
    setActiveSubTab(subTabId);
  };

  const renderPanel = () => {
    if (activePanel === 'home') {
      return (
        <HomePanel
          key="home"
          config={config}
          panelVisibility={panelVisibility}
          onNavigate={handleNavigate}
        />
      );
    }

    if (activePanel === 'settings') {
      return (
        <SettingsPanel
          key="settings"
          onBack={() => setActivePanel(previousPanel)}
          onThemeChange={() => {}}
          onPanelVisibilityChange={(panels) => {
            setPanelVisibility(panels);
          }}
          panelVisibility={panelVisibility}
        />
      );
    }

    // --- Organizer ---
    if (activePanel === 'organizer') {
      if (activeSubTab === 'calendar') return <OrganizerCalendar key="org-cal" />;
      if (activeSubTab === 'tasks_bills') return <OrganizerTasksBills key="org-tb" />;
      if (activeSubTab === 'documents') return <OrganizerDocuments key="org-doc" />;
      return <OrganizerCalendar key="org-cal" />;
    }

    // --- Health & Fitness ---
    if (activePanel === 'health_fitness') {
      if (activeSubTab === 'fitness') return <FitnessTab key="fitness" />;
      return <HealthTab key="health" />;
    }

    // --- Money ---
    if (activePanel === 'money') {
      if (activeSubTab === 'investing') return <InvestingPanel key="investing" />;
      return <FinancePanel key="finance" />;
    }

    // --- Creative ---
    if (activePanel === 'creative') {
      if (activeSubTab === 'reading') return <CreativeReading key="reading" />;
      if (activeSubTab === 'dnd') return <CreativeDnD key="dnd" />;
      return <CreativeWorkspaceTab key="workspace" />;
    }

    // --- Projects (no sub-tabs) ---
    if (activePanel === 'projects') {
      return <ProjectsPanel key="projects" />;
    }

    // --- System ---
    if (activePanel === 'system') {
      return <SystemHealthPanel key="system-health" />;
    }

    return null;
  };

  // Loading states
  if (setupComplete === null) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p>Loading LifeBoard...</p>
      </div>
    );
  }

  if (setupComplete === false) {
    return <SetupWizard onComplete={() => window.location.reload()} />;
  }

  if (configLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p>Loading LifeBoard...</p>
      </div>
    );
  }

  return (
    <RefreshContext.Provider value={refreshSignal}>
      <div className="app">
        {mobileMenuOpen && (
          <div className="app__mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
        )}

        <Sidebar
          activePanel={activePanel}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          wsConnected={wsConnected}
          panelVisibility={panelVisibility}
        />

        <TopBar
          nudges={nudges || []}
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onNavigateSettings={() => handleNavigate('settings')}
        />

        <main
          className="app__content"
          style={{
            marginLeft: sidebarCollapsed ? 72 : 260,
          }}
        >
          <SubTabBar
            panelId={activePanel}
            activeSubTab={activeSubTab}
            onSubTabChange={handleSubTabChange}
            panelVisibility={panelVisibility || {}}
          />
          {renderPanel()}
        </main>
      </div>
    </RefreshContext.Provider>
  );
}
