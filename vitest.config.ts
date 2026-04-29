import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    clearMocks: true
  },
  resolve: {
    alias: {
      '/lib': fileURLToPath(new URL('./lib', import.meta.url)),
      '/hooks': fileURLToPath(new URL('./hooks', import.meta.url)),
      '/components': fileURLToPath(new URL('./components', import.meta.url)),
      '/sub-components': fileURLToPath(new URL('./sub-components', import.meta.url))
    }
  }
})
