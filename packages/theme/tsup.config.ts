import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Wyłączamy generowanie typów na razie
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
});
