import nextPlugin from '@next/eslint-plugin-next'
import antfu from '@antfu/eslint-config'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import { fixupPluginRules } from '@eslint/compat'

const patchedNextPlugin = fixupPluginRules(nextPlugin)
const patchedReactHooksPlugin = fixupPluginRules(reactHooksPlugin)

/** @type {import("eslint").Linter.Config[]} */
const config = antfu({
  gitignore: true,
  react: false,
  jsx: true,
  vue: false,
  astro: false,
  solid: false,
  svelte: false,
  unocss: false,
  formatters: {
    css: 'prettier',
  },
  plugins: {
    react: reactPlugin,
  },
}, {
  ignores: [
    'node_modules',
    '.next',
    '.vscode',
    'public',
    '.gitignore',
    'scripts',
    'README.md',
    'bun.lockb',
    'app/components/ui',
  ],
}, {
  name: 'Country: react hooks plugin',
  plugins: { 'react-hooks': patchedReactHooksPlugin },
  rules: {
    ...patchedReactHooksPlugin.configs.recommended.rules,
    'react-hooks/exhaustive-deps': ['error'],
  },
}, {
  name: 'Country: next plugin',
  plugins: { '@next/next': patchedNextPlugin },
  rules: {
    ...patchedNextPlugin.configs.recommended.rules,
    ...patchedNextPlugin.configs['core-web-vitals'].rules,
  },
}, {
  // We can't load eslint-config-next because it uses
  // @rushstack/eslint-patch which is not compatible with eslint
  // v9:
  name: 'Country: eslint-config-next reimplemented',
  rules: {
    'import/no-anonymous-default-export': 'error',
    'react/no-unknown-property': 'off',
    'react/prop-types': 'off',
    'react/jsx-no-target-blank': 'off',
  },
}, {
  rules: {
    '@next/next/no-img-element': 'off',
    'no-console': 'off',
    'ts/no-use-before-define': 'off',
    'node/prefer-global/process': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'react/jsx-boolean-value': 'error',
    'react/jsx-max-props-per-line': 'error',
    'react/jsx-sort-props': [
      'error',
      {
        callbacksLast: true,
        shorthandFirst: true,
        reservedFirst: true,
        multiline: 'last',
      },
    ],
  },
}, {
  files: ['tailwind.config.js', 'postcss.config.js'],
  rules: {
    'import/no-anonymous-default-export': 'off',
  },
})

export default config
