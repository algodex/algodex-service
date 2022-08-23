module.exports = {
  'overrides': [
    {
      'files': [
        '**/*.spec.js',
        '**/*.spec.jsx',
      ],
      'env': {
        'jest': true,
      },
    }],
  'globals': {
    'emit': true,
  },
  'env': {
    'node': true,
    'browser': false,
    'commonjs': true,
    'es2021': true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 13,
  },
  'rules': {
    'linebreak-style': 0,
    'arrow-parens': ['error', 'as-needed'],
    'no-undef': 'error',
    'max-len': ['error', {'code': 90}],
  },
};
