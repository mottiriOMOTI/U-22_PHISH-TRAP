import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    vueDevTools(),
    vuetify({ autoImport: true }),
    Components({
      dts: 'src/components.d.ts',      // ← これを生成
      resolvers: [VuetifyResolver()],  // ← Vuetify を解決
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  // base: '/Vue.js3_template/',
})
