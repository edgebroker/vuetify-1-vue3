import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

function vuetifyCssPlugin (): Plugin {
  const cssPath = resolve(projectRoot, 'css/vuetify.css')

  return {
    name: 'vuetify-css',
    configureServer (server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/vuetify.css') {
          res.setHeader('Content-Type', 'text/css')
          res.end(readFileSync(cssPath, 'utf-8'))
          return
        }

        next()
      })
    },
    generateBundle () {
      this.emitFile({
        type: 'asset',
        fileName: 'vuetify.css',
        source: readFileSync(cssPath, 'utf-8')
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vuetifyCssPlugin()
  ],
  resolve: {
    alias: [
      {
        find: '@/css',
        replacement: fileURLToPath(new URL('./css', import.meta.url))
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url))
      }
    ]
  },
  define: {
    __VUETIFY_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/entry-lib.ts', import.meta.url)),
      name: 'Vuetify',
      fileName: (format) => `vuetify.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
