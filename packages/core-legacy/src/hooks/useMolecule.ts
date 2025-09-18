import React, { useContext } from 'react';
import type { IUseMoleculeReturn } from '../types';

// This will be provided by the UI package
const MoleculeContext = React.createContext<IUseMoleculeReturn | null>(null);

export function useMolecule(): IUseMoleculeReturn {
  const context = useContext(MoleculeContext);
  if (!context) {
    throw new Error('useMolecule must be used within a MoleculeProvider');
  }
  return context;
}

export { MoleculeContext };
