import { babel } from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const extensions = ['.ts', '.js']

const preventThreeShakingPlugin = () => {
  return {
    name: 'no-threeshaking',
    resolveId(id, importer) {
      if (!importer) {
        // let's not theeshake entry points, as we're not exporting anything in Apps Script files
        return { id, moduleSideEffects: 'no-treeshake' }
      }
      return null
    }
  }
}

export default {
  input: './src/api.ts',
  output: {
    dir: 'build',
    format: 'esm'
  },
  plugins: [
    preventThreeShakingPlugin(),
    nodeResolve({
      extensions
    }),
    babel({ extensions, babelHelpers: 'runtime', skipPreflightCheck: true })
  ]
}
