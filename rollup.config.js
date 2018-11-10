import json from "rollup-plugin-json";
import cleanup from "rollup-plugin-cleanup";
import executable from "rollup-plugin-executable";
import resolve from "rollup-plugin-node-resolve";
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
    resolve(),
    commonjs(),
    cleanup()
  ]
};
