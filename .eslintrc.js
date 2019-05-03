module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    '@nuxtjs'
    //'plugin:prettier/recommended'
  ],
  plugins: [
    //'prettier'
  ],
  // add your custom rules here
  rules: {
    'no-multiple-empty-lines': 'off',
    'no-console': 'off',
    quotes: 'off',
    'spaced-comment': 'off',
    yoda: 'off'
  }
}
