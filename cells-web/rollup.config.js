import path from "path";
import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import resolveAlias from "rollup-plugin-node-resolve";
import replacement from "rollup-plugin-module-replacement";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import css from "rollup-plugin-css-only";

const projectRootDir = path.resolve(__dirname);

const customResolver = resolveAlias({
  extensions: [".svelte", ".ts"],
});

const pathResolvers = replacement({
  entries: [
    { find: "components", replacement: path.resolve(projectRootDir, "src/components") },
    { find: "utils", replacement: path.resolve(projectRootDir, "src/utils") },
    { find: "hooks", replacement: path.resolve(projectRootDir, "src/hooks") },
    { find: "constants", replacement: path.resolve(projectRootDir, "src/constants") },
  ],
  customResolver,
});

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn("npm", ["run", "start", "--", "--dev"], {
        stdio: ["ignore", "inherit", "inherit"],
        shell: true
      });

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    }
  };
}

export default {
  input: "src/main.ts",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js"
  },
  plugins: [
    pathResolvers,
    resolveAlias(),

    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production
      }
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: "bundle.css" }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ["svelte"]
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
      lib: ["es5", "es6", "dom"],
      target: "es5",
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false
  }
};
