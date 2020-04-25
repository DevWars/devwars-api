module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    rules: {
        'no-console': 0,
        quotes: [2, 'single', { avoidEscape: true }],
        'max-len': [2, 120],
        'sort-imports': 0,
        'sort-keys': 0,
        curly: 0,
        'no-bitwise': 0,
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/camelcase': 0,
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/ban-ts-ignore': 0,
    },
    plugins: [
        '@typescript-eslint',
        // 'jest',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        // 'plugin:jest/recommended'
    ],
};
