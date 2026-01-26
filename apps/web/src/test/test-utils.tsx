import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, UserRole } from '@rootshare/shared-types';

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
  initialEntries?: string[];
}

function TestWrapper({ children, initialEntries }: WrapperProps) {
  const queryClient = createTestQueryClient();
  const Router = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <QueryClientProvider client={queryClient}>
      <Router {...routerProps}>{children}</Router>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { initialEntries, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper initialEntries={initialEntries}>{children}</TestWrapper>
    ),
    ...renderOptions,
  });
}

// Mock user data factory
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: UserRole.USER,
    authProvider: AuthProvider.LOCAL,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Mock auth response factory
export function createMockAuthResponse(overrides = {}) {
  return {
    user: createMockUser(),
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
    ...overrides,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
