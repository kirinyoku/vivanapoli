import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLayout from './layout';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe('AdminLayout Security', () => {
  const mockPush = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    localStorage.clear();
  });

  it('redirects to /admin/login if no token is present', async () => {
    (usePathname as any).mockReturnValue('/admin');
    
    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('does NOT redirect if already on /admin/login', async () => {
    (usePathname as any).mockReturnValue('/admin/login');
    
    render(
      <AdminLayout>
        <div>Login Page</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders content if token is present', async () => {
    localStorage.setItem('viva-admin-token', 'valid-token');
    (usePathname as any).mockReturnValue('/admin');
    
    render(
      <AdminLayout>
        <div data-testid="admin-content">Admin Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('removes token and redirects on logout', async () => {
    localStorage.setItem('viva-admin-token', 'valid-token');
    (usePathname as any).mockReturnValue('/admin');
    
    render(
      <AdminLayout>
        <div>Admin Content</div>
      </AdminLayout>
    );

    // Wait for content to render
    await screen.findByText('Logg ut');
    
    const logoutButton = screen.getByText('Logg ut');
    fireEvent.click(logoutButton);

    expect(localStorage.getItem('viva-admin-token')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/admin/login');
  });
});
