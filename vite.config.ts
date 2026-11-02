import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.{ts,tsx}'],
    // Bound concurrent jsdom/transform startup on laptops; retain test isolation
    // and the default five-second timeout outside the two full-replay cases.
    maxWorkers: 2,
  },
})
