module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  rules: {
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "import/no-mutable-exports": 0,
    "@typescript-eslint/return-await": "off",
    "no-labels": 0,
    "no-unused-vars": "error",
    "no-restricted-syntax": 0,
    "no-plusplus": "off",
    "@typescript-eslint/lines-between-class-members": "off",
    "no-bitwise": "off",
  },
  plugins: ["@typescript-eslint", "svelte3"],
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:eslint-comments/recommended",
    "plugin:promise/recommended",
    "prettier",
  ],
  overrides: [
    {
      files: ["**/*.svelte"],
      processor: "svelte3/svelte3",
    },
  ],
  settings: {
    "svelte3/typescript": () => require("typescript"),
  }
};
