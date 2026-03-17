import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Shell/Sidebar';
import TopBar from './components/Shell/TopBar';
import HomePanel from './components/Shell/HomePanel';
import FinancePanel from './components/Finance/FinancePanel';
import LifeManagerPanel from './components/LifeManager/LifeManagerPanel';
import PlaceholderPanel from './components/Shared/PlaceholderPanel';
import { useApi } from './hooks/useApi';
import './App.css';

export default function App() {
  const [activePanel, setActivePanel] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: agents, loading: agentsLoading } = useApi('/api/agents');
  const { data: config, loading: configLoading } = useApi('/api/config');
  const { data: nudges } = useApi('/api/nudges');

  const handleNavigate = (panelId) => {
    setActivePanel(panelId);
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

    // Placeholder agents
    const agent = agents?.find((a) => a.id === activePanel);
    if (agent) {
      return <PlaceholderPanel key={agent.id} agent={agent} />;
    }

    return null;
  };

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
      <Sidebar
        agents={agents || []}
        activePanel={activePanel}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <TopBar
        nudges={nudges || []}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main
        className="app__content"
        style={{
          marginLeft: sidebarCollapsed ? 72 : 260,
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
