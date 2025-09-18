import { MoleculeProvider, Workbench, CommandPalette } from '@dtinsight/molecule-ui';
import { useEffect } from 'react';
import { useCommandService } from '@dtinsight/molecule-core';
import type { IMoleculeConfig } from '@dtinsight/molecule-core';
import './index.css';

const config: IMoleculeConfig = {
  extensions: [],
  defaultLocale: 'en-US',
  defaultColorTheme: 'default-dark',
};

function App() {
  const { register, togglePalette } = useCommandService();

  useEffect(() => {
    // 注册示例命令
    register({ id: 'welcome.show', title: '打开欢迎页' });
    register({ id: 'panel.toggle', title: '切换底部面板' });

    // 绑定 Ctrl/Cmd+K 打开命令面板
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k');
      if (isCmdK) {
        e.preventDefault();
        togglePalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [register, togglePalette]);

  return (
    <MoleculeProvider config={config}>
      <Workbench />
      <CommandPalette />
    </MoleculeProvider>
  );
}

export default App;
