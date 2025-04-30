// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Add additional module name mappings for web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Blacklist specific modules for web platform
config.resolver.blacklistRE = [
  ...(config.resolver.blacklistRE || []),
  // Blacklist react-native-maps native components on web
  /node_modules\/react-native-maps\/.*\/MapMarkerNativeComponent\.js/,
  /node_modules\/react-native-maps\/.*\/codegenNativeCommands/,
];

module.exports = config;
