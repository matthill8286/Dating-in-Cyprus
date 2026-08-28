import { build } from 'esbuild';

await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/server.js',
  packages: 'external',
});
