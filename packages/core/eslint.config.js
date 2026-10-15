import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'src/generated'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
    },
  },
  { files: ['scripts/**'], languageOptions: { globals: globals.node } },
  { files: ['test/**'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
)
