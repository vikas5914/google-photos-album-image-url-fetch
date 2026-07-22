import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  dts: true,
  clean: true,
  // Bundle json5 so the published package has zero runtime dependencies.
  // Google's AF_initDataCallback payload is JSON5 (unquoted keys, single quotes).
  deps: {
    onlyBundle: ['json5'],
    alwaysBundle: ['json5'],
  },
});
