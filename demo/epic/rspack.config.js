export default (configuration) => {
  configuration.resolve.alias = {
    react: 'epic-jsx',
    'react-dom': 'epic-jsx',
    'react/jsx-runtime': 'epic-jsx',
    'react/jsx-dev-runtime': 'epic-jsx',
  }

  return configuration
}
