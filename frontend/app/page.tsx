/**
 * Homepage (root route) of the VivaNapoli website.
 *
 * This page renders a three‑column layout on large screens:
 * 1. A fixed‑width sidebar for category navigation (280px)
 * 2. A flexible main area for the menu content
 * 3. An empty column (340px) that reserves space for the cart panel,
 *    which is positioned fixed on top of this area.
 *
 * On small screens the layout collapses to a single column, and the sidebar
 * becomes a horizontal navigation bar (handled inside `Sidebar`).
 */
import Sidebar from '@/components/Sidebar';
import MenuContent from '@/components/MenuContent';

export default function Home() {
  return (
    /**
     * The outer grid container.
     *
     * - `h-screen` ensures the grid fills the entire viewport height.
     * - `overflow-hidden` prevents scrollbars caused by negative margins or
     *   fixed‑position children.
     * - On large screens (`lg:`), the grid has three columns:
     *   1. 280px for the sidebar
     *   2. `1fr` for the main content (takes all remaining space)
     *   3. 340px of reserved space for the cart panel (which is actually
     *      positioned fixed, but the reserved column prevents content from
     *      being hidden behind it).
     */
    <div className="grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr_340px]">
      <Sidebar />
      {/**
       * Main content area.
       *
       * Uses the page background color defined in `globals.css` (`--color-bg-page`)
       * and allows vertical scrolling inside the menu (`overflow-hidden` on the
       * parent prevents double scrollbars).
       */}
      <main className="bg-bg-page h-full overflow-hidden">
        <MenuContent />
      </main>
      {/**
       * The third column is intentionally left empty.
       *
       * The cart panel (`<CartPanel />`) is rendered by the root layout and is
       * positioned fixed on top of this empty column, so it appears as a
       * right‑hand sidebar on desktop.
       */}
    </div>
  );
}
