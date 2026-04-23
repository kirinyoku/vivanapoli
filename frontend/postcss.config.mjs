/**
 * PostCSS configuration used by Next.js to process CSS.
 *
 * The only plugin is `@tailwindcss/postcss` (Tailwind CSS v4 PostCSS plugin)
 * which replaces the older `tailwindcss` + `autoprefixer` setup. Tailwind v4
 * is a native PostCSS plugin and no longer requires a separate `tailwind.config`
 * file — configuration is done via CSS `@theme` directives in `globals.css`.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
