// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import Fonts from 'unplugin-fonts/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { VitePWA } from 'vite-plugin-pwa'

import vue from '@vitejs/plugin-vue';
import path from 'path';



// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // CORRECCIÓN CRÍTICA: Establecer la base para que el Service Worker y los módulos JS carguen correctamente en producción.
  base: '/',
 

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: true
      },
      workbox: {
        // Patrones para cachear tus assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,vue}'],
      },
      manifest: {
        // Configuración del Manifest de la PWA
        name: 'Gestor de Gastos PWA', 
        short_name: 'GastosApp',
        description: 'Aplicación para el CRUD de Gastos',
        theme_color: '#9067a3ff', 
        background_color: '#ffffff',
        display: 'standalone', 
        
        // 🛑 CORRECCIÓN: Ajuste de rutas basado en la carpeta public/img_icons
        icons: [
          {
            // Ruta ajustada a tu estructura de archivos
            src: 'imagenes/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png', 
            purpose: 'any',
          },
          {
            // Ruta ajustada a tu estructura de archivos
            src: 'imagenes/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png', 
            purpose: 'maskable',
          },
        ]
      },
    }),

    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
      // 🛑 CORRECCIÓN CLAVE: Desactivar la precarga para MDI
      
    }),


  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
})