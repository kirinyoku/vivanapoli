import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MenuContent from './MenuContent';
import { api } from '@/lib/api';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    getMenu: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({
      open_time: '14:00',
      close_time: '22:00',
      is_open: 'true',
    }),
  },
}));

describe('MenuContent Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('automatically adds "Tilbud" category if items have discounts', async () => {
    const mockMenu = [
      {
        id: 1,
        name: 'Pizza',
        slug: 'pizza',
        items: [
          {
            id: 101,
            name: 'Discounted Pizza',
            price_large: 200,
            discount_price_large: 150, // Has discount
            is_available: true,
            allergens: [],
          },
          {
            id: 102,
            name: 'Regular Pizza',
            price_large: 200,
            discount_price_large: null,
            is_available: true,
            allergens: [],
          }
        ],
      },
    ];

    (api.getMenu as any).mockResolvedValue(mockMenu);

    render(<MenuContent />);

    await waitFor(() => {
      // Should find "Tilbud" as a section header
      const tilbudHeader = screen.getByRole('heading', { name: /Tilbud/i, level: 2 });
      expect(tilbudHeader).toBeInTheDocument();
    });

    // Should find the discounted item under "Tilbud" section
    const items = screen.getAllByText(/Discounted Pizza/i);
    // It should appear twice: once in "Tilbud" and once in "Pizza"
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it('does NOT add "Tilbud" category if no items have discounts', async () => {
    const mockMenu = [
      {
        id: 1,
        name: 'Pizza',
        slug: 'pizza',
        items: [
          {
            id: 101,
            name: 'Regular Pizza',
            price_large: 200,
            discount_price_large: null,
            is_available: true,
            allergens: [],
          }
        ],
      },
    ];

    (api.getMenu as any).mockResolvedValue(mockMenu);

    render(<MenuContent />);

    await waitFor(() => {
      expect(screen.queryByText(/Tilbud/i)).not.toBeInTheDocument();
    });
  });
});
