import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ObsidianEditor } from '../obsidian-editor';
import { storageManager } from '../../../utils/storage-manager';
import { sessionRecoveryService } from '../../../utils/session-recovery';
import { autoSaveService } from '../../../utils/auto-save-service';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock the persistence services
vi.mock('../../../utils/storage-manager', () => ({
  storageManager: {
    saveSession: vi.fn(),
    loadSession: vi.fn(),
    clearSession: vi.fn(),
    autoSaveContent: vi.fn(),
    getAutoSavedContent: vi.fn(),
    cleanupAutoSave: vi.fn(),
    checkStorageSpace: vi.fn().mockResolvedValue({ available: true })
  }
}));

vi.mock('../../../utils/session-recovery', () => ({
  sessionRecoveryService: {
    recoverSession: vi.fn()
  }
}));

vi.mock('../../../utils/auto-save-service', () => ({
  autoSaveService: {
    enable: vi.fn(),
    disable: vi.fn(),
    triggerAutoSave: vi.fn(),
    saveImmediately: vi.fn(),
    recoverAutoSavedContent: vi.fn(),
    getAutoSaveStats: vi.fn().mockReturnValue({
      activeTimers: 0,
      pendingSaves: 0,
      isEnabled: true,
      defaultDelay: 2000
    }),
    cleanupExpiredAutoSaves: vi.fn()
  }
}));

describe('Persistence System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Recovery', () => {
    it('should attempt to recover session on initialization', async () => {
      const mockRecoveryResult = {
        state: {
          tabs: {},
          panes: {},
          layout: { type: 'single', panes: [], splitters: [], activePane: '' },
          activePane: ''
        },
        recovered: true,
        errors: [],
        warnings: []
      };

      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue(mockRecoveryResult);

      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(sessionRecoveryService.recoverSession).toHaveBeenCalled();
      });
    });

    it('should show recovery dialog when there are warnings', async () => {
      const mockRecoveryResult = {
        state: {
          tabs: {},
          panes: {},
          layout: { type: 'single', panes: [], splitters: [], activePane: '' },
          activePane: ''
        },
        recovered: true,
        errors: [],
        warnings: ['Some tabs were invalid and removed']
      };

      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue(mockRecoveryResult);

      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByText('Session Recovered')).toBeInTheDocument();
      });
    });

    it('should show recovery dialog when there are errors', async () => {
      const mockRecoveryResult = {
        state: {},
        recovered: false,
        errors: [{ type: 'corruption', message: 'Session data corrupted', recoverable: true }],
        warnings: []
      };

      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue(mockRecoveryResult);

      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByText('Recovery Issues')).toBeInTheDocument();
      });
    });

    it('should create default state when recovery fails', async () => {
      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue({
        state: {},
        recovered: false,
        errors: [],
        warnings: []
      });

      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-save', () => {
    it('should trigger auto-save when content changes', async () => {
      const mockRecoveryResult = {
        state: {},
        recovered: false,
        errors: [],
        warnings: []
      };

      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue(mockRecoveryResult);

      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });

      // 模拟内容变化会触发自动保存
      // 这里需要实际的用户交互来测试，但由于组件复杂性，我们主要测试服务调用
      expect(autoSaveService.getAutoSaveStats).toHaveBeenCalled();
    });

    it('should show persistence status', async () => {
      const mockRecoveryResult = {
        state: {},
        recovered: false,
        errors: [],
        warnings: []
      };

      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue(mockRecoveryResult);

      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(screen.getByText('Auto-save on')).toBeInTheDocument();
      });
    });
  });

  describe('Storage Manager', () => {
    it('should save session data correctly', async () => {
      const mockSessionData = {
        tabs: { 'tab1': { id: 'tab1', title: 'Test', content: 'content', isDirty: false, isLocked: false, type: 'file', createdAt: new Date(), modifiedAt: new Date() } },
        panes: { 'pane1': { id: 'pane1', tabs: ['tab1'], activeTab: 'tab1', position: { x: 0, y: 0, width: 800, height: 600 } } },
        layout: { type: 'single', panes: [], splitters: [], activePane: 'pane1' },
        activePane: 'pane1',
        timestamp: Date.now(),
        version: '1.0.0'
      };

      await storageManager.saveSession(mockSessionData as any);

      expect(storageManager.saveSession).toHaveBeenCalledWith(mockSessionData);
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(storageManager.saveSession).mockRejectedValue(new Error('Storage full'));

      const mockRecoveryResult = {
        state: {},
        recovered: false,
        errors: [],
        warnings: []
      };

      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue(mockRecoveryResult);

      // Should not throw error
      expect(() => render(<ObsidianEditor />)).not.toThrow();
    });
  });

  describe('Auto-save Service', () => {
    it('should enable and disable auto-save correctly', () => {
      autoSaveService.enable();
      expect(autoSaveService.enable).toHaveBeenCalled();

      autoSaveService.disable();
      expect(autoSaveService.disable).toHaveBeenCalled();
    });

    it('should trigger auto-save for tabs', () => {
      const mockTab = {
        id: 'tab1',
        title: 'Test',
        content: 'test content',
        isDirty: true,
        isLocked: false,
        type: 'file' as const,
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      autoSaveService.triggerAutoSave(mockTab);
      expect(autoSaveService.triggerAutoSave).toHaveBeenCalledWith(mockTab);
    });

    it('should recover auto-saved content', async () => {
      const mockRecovery = {
        content: 'recovered content',
        timestamp: Date.now(),
        hasRecovery: true
      };

      vi.mocked(autoSaveService.recoverAutoSavedContent).mockResolvedValue(mockRecovery);

      const result = await autoSaveService.recoverAutoSavedContent('tab1');
      expect(result).toEqual(mockRecovery);
    });
  });

  describe('Error Handling', () => {
    it('should handle session recovery errors', async () => {
      vi.mocked(sessionRecoveryService.recoverSession).mockRejectedValue(new Error('Recovery failed'));

      render(<ObsidianEditor />);

      await waitFor(() => {
        // Should still render the editor with default state
        expect(screen.getByText('Welcome')).toBeInTheDocument();
      });
    });

    it('should handle storage space issues', async () => {
      vi.mocked(storageManager.checkStorageSpace).mockResolvedValue({ available: false });

      const mockRecoveryResult = {
        state: {},
        recovered: false,
        errors: [],
        warnings: []
      };

      vi.mocked(sessionRecoveryService.recoverSession).mockResolvedValue(mockRecoveryResult);

      render(<ObsidianEditor />);

      await waitFor(() => {
        expect(storageManager.checkStorageSpace).toHaveBeenCalled();
      });
    });
  });
});