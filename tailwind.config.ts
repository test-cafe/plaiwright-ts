import type { Config } from 'tailwindcss';

// html { font-size: 62.5% } → 1rem = 10px.
// Tailwind's defaults assume 16px base, so every rem value is multiplied
// by 1.6 here to keep the same pixel sizes throughout the UI.
const rem = (px: number) => `${px / 10}rem`;

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: rem(32), // 3.2rem = 32px
      screens: { '2xl': '1400px' },
    },

    // Replaces Tailwind default spacing (padding, margin, gap, width, height, inset…)
    spacing: {
      px:  '1px',
      0:   '0',
      0.5: rem(2),
      1:   rem(4),
      1.5: rem(6),
      2:   rem(8),
      2.5: rem(10),
      3:   rem(12),
      3.5: rem(14),
      4:   rem(16),
      5:   rem(20),
      6:   rem(24),
      7:   rem(28),
      8:   rem(32),
      9:   rem(36),
      10:  rem(40),
      11:  rem(44),
      12:  rem(48),
      14:  rem(56),
      16:  rem(64),
      20:  rem(80),
      24:  rem(96),
      28:  rem(112),
      32:  rem(128),
      36:  rem(144),
      40:  rem(160),
      44:  rem(176),
      48:  rem(192),
      52:  rem(208),
      56:  rem(224),
      60:  rem(240),
      64:  rem(256),
      72:  rem(288),
      80:  rem(320),
      96:  rem(384),
    },

    // Replaces Tailwind default font sizes
    fontSize: {
      xs:   [rem(12), { lineHeight: rem(16) }],
      sm:   [rem(14), { lineHeight: rem(20) }],
      base: [rem(16), { lineHeight: rem(24) }],
      lg:   [rem(18), { lineHeight: rem(28) }],
      xl:   [rem(20), { lineHeight: rem(28) }],
      '2xl':[rem(24), { lineHeight: rem(32) }],
      '3xl':[rem(30), { lineHeight: rem(36) }],
      '4xl':[rem(36), { lineHeight: rem(40) }],
      '5xl':[rem(48), { lineHeight: '1' }],
      '6xl':[rem(60), { lineHeight: '1' }],
      '7xl':[rem(72), { lineHeight: '1' }],
      '8xl':[rem(96), { lineHeight: '1' }],
      '9xl':[rem(128),{ lineHeight: '1' }],
    },

    // Replaces numeric leading-* values (ratio-based ones like leading-tight are unaffected)
    lineHeight: {
      3:  rem(12),
      4:  rem(16),
      5:  rem(20),
      6:  rem(24),
      7:  rem(28),
      8:  rem(32),
      9:  rem(36),
      10: rem(40),
    },

    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))',     foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))',   foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))',       foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))',      foreground: 'hsl(var(--accent-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))',     foreground: 'hsl(var(--popover-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))',        foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        sm:   'calc(var(--radius) - 4px)',  // 14px
        md:   'calc(var(--radius) - 2px)',  // 16px
        lg:   'var(--radius)',              // 18px
        xl:   rem(12),                      // 12px — compensates Tailwind default 0.75rem
        '2xl':rem(16),                      // 16px — compensates Tailwind default 1rem
        '3xl':rem(24),                      // 24px — compensates Tailwind default 1.5rem
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'caret-blink':    { '0%,70%,100%': { opacity: '1' }, '20%,50%': { opacity: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'caret-blink':    'caret-blink 1.25s ease-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
