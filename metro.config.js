const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow Metro to resolve .wasm files required by expo-sqlite on web
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './global.css' });
