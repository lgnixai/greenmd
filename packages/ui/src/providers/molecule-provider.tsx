import React, { createContext, useContext, useMemo } from 'react';
import { ExtensionService } from '@dtinsight/molecule-core-legacy';
import type { IMoleculeConfig, IUseMoleculeReturn } from '@dtinsight/molecule-types';

interface MoleculeProviderProps {
  config: IMoleculeConfig;
  children: React.ReactNode;
}

// Create a mock context for now - this will be properly implemented
const MoleculeContext = createContext<IUseMoleculeReturn | null>(null);

export const MoleculeProvider: React.FC<MoleculeProviderProps> = ({ 
  config, 
  children 
}) => {
  const context = useMemo<IUseMoleculeReturn>(() => {
    // Mock implementation - will be replaced with real services
    const extensionService = new ExtensionService();
    
    return {
      molecule: {
        locale: {
          localize: (key: string, defaultValue?: string) => defaultValue || key,
        },
        builtin: {},
        contextMenu: {},
        auxiliaryBar: {},
        layout: {},
        statusBar: {},
        menuBar: {},
        activityBar: {},
        sidebar: {},
        explorer: {},
        folderTree: {},
        panel: {},
        output: {},
        editor: {},
        colorTheme: {},
        action: {},
        editorTree: {},
        notification: {},
        search: {},
        settings: {},
        monaco: {},
        module: {},
        extension: extensionService,
      },
      monaco: {},
      localize: (key: string, defaultValue?: string) => defaultValue || key,
      modules: {},
      controllers: {},
    };
  }, [config]);

  return (
    <MoleculeContext.Provider value={context}>
      {children}
    </MoleculeContext.Provider>
  );
};

export const useMolecule = (): IUseMoleculeReturn => {
  const context = useContext(MoleculeContext);
  if (!context) {
    throw new Error('useMolecule must be used within a MoleculeProvider');
  }
  return context;
};

