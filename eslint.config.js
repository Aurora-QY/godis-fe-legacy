import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: true,
    formatters: false,
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/block-order': [
        'warn',
        {
          order: ['template', 'script:not([setup])', 'script[setup]', 'style'],
        },
      ],
    },
  },
)
