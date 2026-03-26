module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    jest: true,
    react-native/react-native: true
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  ignorePatterns: ["node_modules/", "babel.config.js"]
};
