import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Root by default (Vercel, local preview). Only GitHub Pages needs a subpath prefix, since it
// serves this project at /Projet-SpaceFarm-Dashboard-B3/ instead of the domain root; the Pages
// workflow sets VITE_BASE_PATH for that build specifically.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
