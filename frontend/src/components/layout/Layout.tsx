import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
  onQuickAction?: (action: 'quote' | 'invoice' | 'task' | 'client') => void;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  onQuickAction,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header currentTab={currentTab} onOpenQuickAction={onQuickAction} />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
