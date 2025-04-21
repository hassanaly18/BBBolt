module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          alias: {
            '@': './',
            '@components': './components',
            '@data': './data',
            '@hooks': './hooks',
            '@assets': './assets'
          }
        }
      ]
    ]
  };
}; 