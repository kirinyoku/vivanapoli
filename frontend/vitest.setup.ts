/**
 * Global test setup for Vitest.
 *
 * Runs once before the entire test suite. Its job is to polyfill browser
 * APIs that are absent in the `jsdom` environment but required by our
 * components and stores:
 *
 *  1. **localStorage** — the Zustand cart store uses `persist` middleware
 *     backed by localStorage. Without this mock every test that imports
 *     `useCartStore` would throw.
 *  2. **IntersectionObserver** — used by the `ScrollSpy` component for
 *     scroll-based category highlighting. jsdom does not implement it.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── localStorage mock ─────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    length: 0,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ── IntersectionObserver mock ─────────────────────────────────
class IntersectionObserverMock {
  root = null;
  rootMargin = '';
  thresholds = [];
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
