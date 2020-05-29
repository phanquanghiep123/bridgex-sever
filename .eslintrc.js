module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin", "nestjs", "jest"],
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:nestjs/recommended",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/camelcase": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/no-use-before-define": "warn",
    "@typescript-eslint/no-var-requires": "warn",
    "nestjs/use-validation-pipe": "off"
  },
};
