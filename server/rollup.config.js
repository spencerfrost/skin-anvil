import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/server.js",
  output: {
    file: "dist/server.mjs",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "bundled",
      presets: [["@babel/preset-env", { targets: { node: "20" } }]],
    }),
  ],
  external: ['cors', 'express', 'node-fetch', 'path', 'url'],
};