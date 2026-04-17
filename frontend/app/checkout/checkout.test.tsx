import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from './page';
import { useCartStore } from '@/store/useCartStore';
import { api } from '@/lib/api';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    getSettings: vi.fn().mockResolvedValue({
      open_time: '14:00',
      close_time: '22:00',
      is_open: 'true',
      phone: '90000000',
    }),
    placeOrder: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

describe('CheckoutPage Validation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // Set time to 16:00 (when shop is open according to mocked settings 14:00-22:00)
    vi.setSystemTime(new Date(2024, 0, 1, 16, 0));
    vi.clearAllMocks();
    
    // Setup cart with items
    useCartStore.getState().clearCart();
    useCartStore.getState().addItem({
      menu_item_id: 1,
      name: 'Test Pizza',
      price: 150,
      size: 'large',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const waitForLoading = async () => {
    // Wait for "Laster checkout..." to disappear or for the main content to appear
    await waitFor(() => {
      expect(screen.queryByText(/Laster checkout/i)).not.toBeInTheDocument();
    });
  };

  it('shows error messages when submitting empty form', async () => {
    render(<CheckoutPage />);
    await waitForLoading();
    
    // Find and click the confirm button
    const submitButtons = screen.getAllByRole('button', { name: /Bekreft Bestilling|Fullfør Bestilling/i });
    fireEvent.click(submitButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Navn er obligatorisk/i)).toBeInTheDocument();
      expect(screen.getByText(/Telefonnummer er obligatorisk/i)).toBeInTheDocument();
    });
  });

  it('validates Norwegian phone number (8 digits)', async () => {
    render(<CheckoutPage />);
    await waitForLoading();
    
    const phoneInput = screen.getByLabelText(/Mobilnummer/i);
    fireEvent.change(phoneInput, { target: { value: '123' } }); 
    
    const submitButtons = screen.getAllByRole('button', { name: /Bekreft Bestilling|Fullfør Bestilling/i });
    fireEvent.click(submitButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Vennligst oppgi et gyldig telefonnummer/i)).toBeInTheDocument();
    });

    // Valid number
    fireEvent.change(phoneInput, { target: { value: '90000000' } });
    fireEvent.click(submitButtons[0]);
    
    await waitFor(() => {
      expect(screen.queryByText(/Vennligst oppgi et gyldig telefonnummer/i)).not.toBeInTheDocument();
    });
  });

  it('requires address for delivery but not for pickup', async () => {
    render(<CheckoutPage />);
    await waitForLoading();
    
    // Default is delivery
    const submitButtons = screen.getAllByRole('button', { name: /Bekreft Bestilling|Fullfør Bestilling/i });
    fireEvent.click(submitButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Leveringsadresse er obligatorisk/i)).toBeInTheDocument();
    });

    // Switch to pickup - using role button with specific text
    const pickupButton = screen.getByRole('button', { name: /Henting/i });
    fireEvent.click(pickupButton);
    
    fireEvent.click(submitButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText(/Leveringsadresse er obligatorisk/i)).not.toBeInTheDocument();
    });
  });

  it('submits the form successfully with valid data', async () => {
    render(<CheckoutPage />);
    await waitForLoading();
    
    fireEvent.change(screen.getByLabelText(/Fullt navn/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Mobilnummer/i), { target: { value: '90000000' } });
    
    // Switch to pickup
    const pickupButton = screen.getByRole('button', { name: /Henting/i });
    fireEvent.click(pickupButton);
    
    const submitButtons = screen.getAllByRole('button', { name: /Bekreft Bestilling|Fullfør Bestilling/i });
    fireEvent.click(submitButtons[0]);

    await waitFor(() => {
      expect(api.placeOrder).toHaveBeenCalledWith(expect.objectContaining({
        customer_name: 'John Doe',
        customer_phone: '90000000',
        order_type: 'pickup',
      }));
    });
  });
});
