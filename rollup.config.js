import json from "rollup-plugin-json";
import cleanup from "rollup-plugin-cleanup";
import executable from "rollup-plugin-executable";
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: "cjs",
    interop: false
  },
  external: [
    "repository-provider",
    "url",
    "https",
    "net",
    "util",
    "path",
    "fs",
    "tty"
  ],
  plugins: [
    babel({
      runtimeHelpers: false,
      externalHelpers: true,
      babelrc: false,
      plugins: ["@babel/plugin-proposal-async-generator-functions"],
      exclude: "node_modules/**"
    }),
    resolve(),
    commonjs(),
    cleanup()
  ]
};
