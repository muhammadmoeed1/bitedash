import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: false,
    // This dev environment's process-spawn/IO throughput is inconsistent (seen elsewhere in
    // the project as slow npm installs and slow DB round-trips). The default 'forks' pool
    // (child_process) intermittently hit "timeout waiting for worker to respond" under load,
    // even single-forked; the lighter-weight 'threads' pool (worker_threads) spawns reliably.
    pool: 'threads',
    singleThread: true,
    testTimeout: 15000,
  },
})
