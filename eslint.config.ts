import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
// @ts-ignore - eslint-plugin-jsdoc has no types
import jsdoc from "eslint-plugin-jsdoc";

export default [
 {
 ignores: ["node_modules/**", "dist/**", "bin/", "coverage/**", "*.js"],
 },
 {
 files: ["src/**/*.ts"],
 languageOptions: {
 parser: tsParser,
 parserOptions: {
 ecmaVersion: 2022,
 sourceType: "module",
 project: "./tsconfig.json",
 },
 },
 plugins: {
 "@typescript-eslint": tseslint,
 jsdoc,
 },
 rules: {
 "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
 "@typescript-eslint/no-explicit-any": "warn",
 "@typescript-eslint/semi": ["error", "always"],
 "@typescript-eslint/quotes": ["error", "double", { avoidEscape: true }],
 "jsdoc/require-jsdoc": "off",
 "no-console": ["warn", { allow: ["warn", "error"] }],
 },
 },
 {
 files: ["scripts/**/*.mjs"],
 languageOptions: {
 parserOptions: { ecmaVersion: 2022, sourceType: "module" },
 },
 rules: { "no-console": "off" },
 },
];
