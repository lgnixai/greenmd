import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityBar } from '../activity-bar';

// Mock the layout store
const mockLayoutStore = {
  layout: {
    activityItems: [
      { id: 'explorer', label: '资源管理器' },
      { id: 'search', label: '搜索' },
    ],
    sidebar: { current: 'explorer' }
  },
  setSidebarCurrent: jest.fn()
};

jest.mock('@lginxai/greenmd-core-legacy', () => ({
  useLayoutStore: () => mockLayoutStore
}));

describe('ActivityBar Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders successfully with valid data', () => {
    render(<ActivityBar />);
    expect(screen.getByTestId('activity-bar')).toBeInTheDocument();
  });

  it('handles invalid iconMap gracefully', () => {
    const invalidIconMap = 'not-an-object' as any;
    render(<ActivityBar iconMap={invalidIconMap} />);
    
    expect(screen.getByTestId('activity-bar')).toBeInTheDocument();
    expect(console.warn).toHaveBeenCalledWith(
      '[ActivityBar] Invalid iconMap provided, expected an object. Using default icons only.'
    );
  });

  it('handles invalid icon components in iconMap', () => {
    const invalidIconMap = {
      explorer: 'not-a-component' as any,
      search: () => <div>Valid Component</div>
    };
    
    render(<ActivityBar iconMap={invalidIconMap} />);
    
    expect(console.warn).toHaveBeenCalledWith(
      '[ActivityBar] Invalid icon component for key "explorer" in iconMap. Expected a React component, got: string'
    );
  });

  it('handles missing icons gracefully', () => {
    const customActivities = [
      { id: 'nonexistent', label: 'Non-existent Activity' }
    ];
    
    const customLayoutStore = {
      ...mockLayoutStore,
      layout: {
        ...mockLayoutStore.layout,
        activityItems: customActivities
      }
    };

    jest.mocked(require('@lginxai/greenmd-core-legacy').useLayoutStore).mockReturnValue(customLayoutStore);
    
    render(<ActivityBar />);
    
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[ActivityBar] Icon not found for activity: "nonexistent"')
    );
  });

  it('handles invalid activity data gracefully', () => {
    const invalidActivities = [
      null,
      { label: 'Missing ID' },
      { id: '', label: 'Empty ID' },
      { id: 'valid', label: 'Valid Activity' }
    ];
    
    const customLayoutStore = {
      ...mockLayoutStore,
      layout: {
        ...mockLayoutStore.layout,
        activityItems: invalidActivities
      }
    };

    jest.mocked(require('@lginxai/greenmd-core-legacy').useLayoutStore).mockReturnValue(customLayoutStore);
    
    render(<ActivityBar />);
    
    // Should only render the valid activity
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('title', 'Valid Activity');
  });

  it('handles layout store errors gracefully', () => {
    jest.mocked(require('@lginxai/greenmd-core-legacy').useLayoutStore).mockImplementation(() => {
      throw new Error('Store error');
    });
    
    render(<ActivityBar />);
    
    expect(screen.getByTestId('activity-bar')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(
      '[ActivityBar] Error accessing layout store:',
      expect.any(Error)
    );
  });

  it('renders error boundary fallback when component crashes', () => {
    // Force an error by mocking a component that throws
    const ThrowingComponent = () => {
      throw new Error('Component error');
    };
    
    const ErrorBoundaryTest = () => (
      <ActivityBar iconMap={{ explorer: ThrowingComponent }} />
    );
    
    render(<ErrorBoundaryTest />);
    
    // Should render error fallback UI
    expect(screen.getByTestId('activity-bar-error')).toBeInTheDocument();
  });

  it('handles click errors gracefully', () => {
    const errorLayoutStore = {
      ...mockLayoutStore,
      setSidebarCurrent: jest.fn().mockImplementation(() => {
        throw new Error('Click handler error');
      })
    };

    jest.mocked(require('@lginxai/greenmd-core-legacy').useLayoutStore).mockReturnValue(errorLayoutStore);
    
    render(<ActivityBar />);
    
    const button = screen.getAllByRole('button')[0];
    fireEvent.click(button);
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ActivityBar] Error handling activity click'),
      expect.any(Error)
    );
  });
});