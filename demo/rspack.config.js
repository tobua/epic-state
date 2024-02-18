// Configure preact transformer.
export default (configuration) => {
  // NOTE not necessary.
  // configuration.module.rules[7].use.options.jsc.transform.react.pragma = 'h'
  // configuration.module.rules[7].use.options.jsc.transform.react.pragmaFrag = 'Fragment'

  configuration.resolve.alias = {
    react: 'preact/compat',
    'react-dom/test-utils': 'preact/test-utils',
    'react-dom': 'preact/compat',
    'react/jsx-runtime': 'preact/jsx-runtime',
  }

  return configuration
}
