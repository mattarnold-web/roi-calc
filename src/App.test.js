import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock AuthContext so tests render the calculator (not the login screen)
const mockUser = { email: 'test@augmentcode.com', name: 'Test User', picture: null };
const mockLogout = jest.fn();
let mockAuthState = { user: mockUser, loading: false, error: null, logout: mockLogout };
jest.mock('./AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthState,
  ALLOWED_DOMAIN: 'augmentcode.com',
}));

import App from './App';

// Reset auth mock before every test to prevent state leakage across suites
beforeEach(() => {
  mockAuthState = { user: mockUser, loading: false, error: null, logout: mockLogout };
});

describe('App rendering', () => {
  it('renders the header with Augment Code branding', () => {
    render(<App />);
    expect(screen.getByText('augment code')).toBeInTheDocument();
  });

  it('renders all 4 use case tabs plus Summary', () => {
    render(<App />);
    // "Code Review" appears both in tab and use case heading, so use getAllByText
    expect(screen.getAllByText('Code Review').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Unit Test Automation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Build Failure Analyzer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Interactive (IDE + CLI)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('shows footer disclaimer', () => {
    render(<App />);
    expect(screen.getByText(/Illustrative estimates/)).toBeInTheDocument();
  });

  it('shows customer name input placeholder', () => {
    render(<App />);
    expect(screen.getByText('Click to add customer name')).toBeInTheDocument();
  });
});

describe('Tab navigation', () => {
  it('starts on Code Review tab', () => {
    render(<App />);
    // Code Review content should be visible
    expect(screen.getByText(/Recover senior engineering time/)).toBeInTheDocument();
  });

  it('switches to Unit Test tab on click', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Unit Test Automation'));
    expect(screen.getByText(/Give engineers back their week/)).toBeInTheDocument();
  });

  it('switches to Summary tab on click', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Summary'));
    expect(screen.getByText(/COMBINED ROI SUMMARY/)).toBeInTheDocument();
  });
});

describe('Use case enable/disable', () => {
  it('shows exclude button for active use case', () => {
    render(<App />);
    expect(screen.getByText('✕ Exclude')).toBeInTheDocument();
  });

  it('excludes and re-includes a use case', () => {
    render(<App />);
    // Exclude code review
    fireEvent.click(screen.getByText('✕ Exclude'));
    // Should show disabled state
    expect(screen.getByText(/is excluded/)).toBeInTheDocument();
    expect(screen.getByText('+ Include This Use Case')).toBeInTheDocument();
    // Re-include
    fireEvent.click(screen.getByText('+ Include This Use Case'));
    // Should show content again
    expect(screen.getByText(/Recover senior engineering time/)).toBeInTheDocument();
  });
});

describe('Customer name editing', () => {
  it('enters edit mode on click', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Click to add customer name'));
    const input = screen.getByPlaceholderText('Customer name…');
    expect(input).toBeInTheDocument();
  });

  it('saves name on Enter', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Click to add customer name'));
    const input = screen.getByPlaceholderText('Customer name…');
    fireEvent.change(input, { target: { value: 'Acme Corp' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });
});

describe('Scenario selector', () => {
  it('shows Conservative, Midpoint, Optimistic options', () => {
    render(<App />);
    expect(screen.getByText('Conservative')).toBeInTheDocument();
    expect(screen.getByText('Midpoint')).toBeInTheDocument();
    expect(screen.getByText('Optimistic')).toBeInTheDocument();
  });
});

describe('Metrics display', () => {
  it('shows ROI metrics for default inputs', () => {
    render(<App />);
    // With defaults, ROI should be displayed
    expect(screen.getByText('Return on investment')).toBeInTheDocument();
    expect(screen.getByText('Total annual benefit')).toBeInTheDocument();
  });
});

describe('Pilot thresholds', () => {
  it('shows pilot success thresholds section', () => {
    render(<App />);
    expect(screen.getByText('Pilot Success Thresholds')).toBeInTheDocument();
  });

  it('toggles pilot on/off', () => {
    render(<App />);
    // Pilot is enabled by default
    expect(screen.getByText(/Drag sliders to your achieved results/)).toBeInTheDocument();
    // Click toggle to disable
    fireEvent.click(screen.getByText('Pilot Enabled'));
    expect(screen.getByText('Pilot Disabled')).toBeInTheDocument();
    expect(screen.getByText(/Pilot evaluation is currently disabled/)).toBeInTheDocument();
  });
});

describe('Benchmarks', () => {
  it('shows validated pilot outcomes', () => {
    render(<App />);
    expect(screen.getByText('Validated Pilot Outcomes')).toBeInTheDocument();
  });
});

describe('Executive summary', () => {
  it('shows executive summary section', () => {
    render(<App />);
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
  });
});

describe('Summary tab', () => {
  it('shows per-category breakdown table', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Summary'));
    expect(screen.getByText('Per-Category Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Benefit Distribution')).toBeInTheDocument();
  });

  it('shows export PDF button', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Summary'));
    expect(screen.getByText(/Export to PDF/)).toBeInTheDocument();
  });
});

describe('Auth integration', () => {
  it('shows user name in header when authenticated', () => {
    render(<App />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows sign out button when authenticated', () => {
    render(<App />);
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('shows login screen when not authenticated', () => {
    mockAuthState = { user: null, loading: false, error: null, logout: mockLogout };
    render(<App />);
    expect(screen.getByText('ROI Calculator')).toBeInTheDocument();
    expect(screen.getByText(/Sign in with your Augment Code account/)).toBeInTheDocument();
    expect(screen.getByText(/Restricted to augmentcode.com accounts/)).toBeInTheDocument();
  });

  it('shows loading state while auth initializes', () => {
    mockAuthState = { user: null, loading: true, error: null, logout: mockLogout };
    render(<App />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error message on login screen', () => {
    mockAuthState = { user: null, loading: false, error: 'Access restricted to augmentcode.com accounts.', logout: mockLogout };
    render(<App />);
    expect(screen.getByText('Access restricted to augmentcode.com accounts.')).toBeInTheDocument();
  });
});
