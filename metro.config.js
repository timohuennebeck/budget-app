const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});

// Uniwind's web resolver can't resolve react-native-web 0.21's
// ./exports/InputAccessoryView; fall back to Metro's default resolution
// for whatever it fails on (web only, native builds are unaffected).
const uniwindResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return uniwindResolveRequest(context, moduleName, platform);
  } catch (error) {
    if (platform !== 'web') throw error;
    return context.resolveRequest(context, moduleName, platform);
  }
};

module.exports = config;
