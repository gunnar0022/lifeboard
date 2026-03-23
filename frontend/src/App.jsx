import { useState, useEffect } from 'react';
import Sidebar from './components/Shell/Sidebar';
import TopBar from './components/Shell/TopBar';
import HomePanel from './components/Shell/HomePanel';
import SetupWizard from './components/Setup/SetupWizard';
import FinancePanel from './components/Finance/FinancePanel';
import LifeManagerPanel from './components/LifeManager/LifeManagerPanel';
import HealthPanel from './components/Health/HealthPanel';
import InvestingPanel from './components/Investing/InvestingPanel';
import ReadingCreativePanel from './components/ReadingCreative/ReadingCreativePanel';
import PlaceholderPanel from './components/Shared/PlaceholderPanel';
import { useApi } from './hooks/useApi';
import './App.css';

export default function App() {
  const [activePanel, setActivePanel] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [setupComplete, setSetupComplete] = useState(null); // null = loading, true/false

  const { data: agents, loading: agentsLoading } = useApi('/api/agents');
  const { data: config, loading: configLoading } = useApi('/api/config');
  const { data: nudges } = useApi('/api/nudges');

  // Check setup status on load
  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(data => setSetupComplete(data.setup_complete))
      .catch(() => setSetupComplete(false));
  }, []);

  const handleNavigate = (panelId) => {
    setActivePanel(panelId);
    setMobileMenuOpen(false);
  };

  const renderPanel = () => {
    if (activePanel === 'home') {
      return (
        <HomePanel
          key="home"
          agents={agents || []}
          config={config}
          onNavigate={handleNavigate}
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
    <div className="app">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="app__mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      <Sidebar
        agents={agents || []}
        activePanel={activePanel}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <TopBar
        nudges={nudges || []}
        sidebarCollapsed={sidebarCollapsed}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
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
  );
}
