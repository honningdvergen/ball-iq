import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build output tuning. The app is one large App.jsx (~1.4MB raw with the
// question bank), so splitting vendor dependencies into their own cacheable
// chunks means a code-only change doesn't invalidate the React/Supabase
// bundle in the browser cache on the next visit.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React + ReactDOM live together and change rarely — one stable chunk.
          react: ['react', 'react-dom'],
          // Supabase SDK is ~130KB minified — isolate so app-only changes
          // don't invalidate it in the HTTP cache on subsequent visits.
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
