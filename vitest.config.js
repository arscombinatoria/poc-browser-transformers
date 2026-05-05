import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.unit.test.js', 'src/core/**/*.test.js']
        }
      },
      {
        test: {
          name: 'ui-integration',
          environment: 'jsdom',
          include: ['src/**/*.ui.test.js']
        }
      }
    ],
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.{js,ts}']
    }
  }
})
