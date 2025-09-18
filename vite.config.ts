import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = __dirname

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

function vuetifyCjsExportPlugin (): Plugin {
  return {
    name: 'vuetify-cjs-export',
    generateBundle (_, bundle) {
      const chunk = bundle['vuetify.cjs']

      if (chunk && chunk.type === 'chunk') {
        chunk.code += '\nmodule.exports = exports.default;\nObject.assign(module.exports, exports);\n'
      }
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vuetifyCssPlugin(),
    vuetifyCjsExportPlugin()
  ],
  resolve: {
    alias: [
      {
        find: '@/css',
        replacement: resolve(__dirname, 'css')
      },
      {
        find: '@',
        replacement: resolve(__dirname, 'src')
      }
    ]
  },
  define: {
    __VUETIFY_VERSION__: JSON.stringify(process.env.npm_package_version),
    __REQUIRED_VUE__: JSON.stringify(process.env.npm_package_dependencies_vue || '^3.0.0')
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entry-lib.ts'),
      name: 'Vuetify',
      fileName: (format) => {
        if (format === 'cjs') {
          return 'vuetify.cjs'
        }

        if (format === 'umd') {
          return 'vuetify.umd.js'
        }

        return `vuetify.${format}.js`
      },
      formats: ['es', 'umd', 'cjs']
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
