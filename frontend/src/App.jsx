import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Shell/Sidebar';
import TopBar from './components/Shell/TopBar';
import HomePanel from './components/Shell/HomePanel';
import SetupWizard from './components/Setup/SetupWizard';
import SettingsPanel from './components/Settings/SettingsPanel';
import FinancePanel from './components/Finance/FinancePanel';
import LifeManagerPanel from './components/LifeManager/LifeManagerPanel';
import HealthPanel from './components/Health/HealthPanel';
import InvestingPanel from './components/Investing/InvestingPanel';
import ReadingCreativePanel from './components/ReadingCreative/ReadingCreativePanel';
import PlaceholderPanel from './components/Shared/PlaceholderPanel';
import { useApi, RefreshContext } from './hooks/useApi';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

export default function App() {
  const [activePanel, setActivePanel] = useState('home');
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

  const [setupComplete, setSetupComplete] = useState(null); // null = loading, true/false

  const { data: agents, loading: agentsLoading } = useApi('/api/agents');
  const { data: config, loading: configLoading } = useApi('/api/config');
  const { data: nudges } = useApi('/api/nudges');
  const { data: settings } = useApi('/api/settings');

  // Load panel visibility from settings
  useEffect(() => {
    if (settings?.panels) {
      setPanelVisibility(settings.panels);
    }
  }, [settings]);

  // Check setup status on load — retry if backend isn't ready yet
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
            setTimeout(check, 1500); // retry every 1.5s up to 10 times
          } else {
            setSetupComplete(false); // after 15s of failures, assume first run
          }
        });
    };
    check();
  }, []);

  const handleNavigate = (panelId) => {
    setActivePanel(panelId);
    setMobileMenuOpen(false);
  };

  // Filter agents based on panel visibility
  const visibleAgents = (agents || []).filter(agent => {
    if (!agent.v1) return true; // Always show placeholder "coming soon" agents
    if (!panelVisibility) return true; // No settings loaded yet, show all
    return panelVisibility[agent.id] !== false;
  });

  const renderPanel = () => {
    if (activePanel === 'home') {
      return (
        <HomePanel
          key="home"
          agents={visibleAgents}
          config={config}
          onNavigate={handleNavigate}
        />
      );
    }

    if (activePanel === 'settings') {
      return (
        <SettingsPanel
          key="settings"
          onBack={() => setActivePanel('home')}
          onThemeChange={() => {}}
          onPanelVisibilityChange={(panels) => {
            setPanelVisibility(panels);
          }}
        />
      );
    }

    if (activePanel === 'finance') {
      return <FinancePanel key="finance" />;
    }

    if (activePanel === 'life_manager') {
      return <LifeManagerPanel key="life_manager" />;
    }

    if (activePanel === 'health_body') {
      return <HealthPanel key="health_body" />;
    }

    if (activePanel === 'investing') {
      return <InvestingPanel key="investing" />;
    }

    if (activePanel === 'reading_creative') {
      return <ReadingCreativePanel key="reading_creative" />;
    }

    // Placeholder agents
    const agent = agents?.find((a) => a.id === activePanel);
    if (agent) {
      return <PlaceholderPanel key={agent.id} agent={agent} />;
    }

    return null;
  };

  // Show wizard if setup isn't complete
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

  if (agentsLoading || configLoading) {
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
        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="app__mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
        )}

        <Sidebar
          agents={visibleAgents}
          activePanel={activePanel}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          wsConnected={wsConnected}
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
          {renderPanel()}
        </main>
      </div>
    </RefreshContext.Provider>
  );
}
