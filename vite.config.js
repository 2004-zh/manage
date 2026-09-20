import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  const single = mode === 'singlefile'
  return {
    plugins: [vue(), ...(single ? [viteSingleFile()] : [])],
    base: single ? './' : '/',
    server: { port: 5173, open: true },
    build: single
      ? {
          outDir: 'dist-single',
          assetsInlineLimit: 100000000,
          cssCodeSplit: false,
          rollupOptions: { output: { inlineDynamicImports: true } }
        }
      : {}
  }
})
