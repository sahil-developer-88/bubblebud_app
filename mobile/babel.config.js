module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
          alias: {
            "@": "./src",
          },
        },
      ],
      "react-native-reanimated/plugin",
      [
        "babel-plugin-transform-inline-environment-variables",
        {
          include: ["NODE_ENV", "EXPO_ROUTER_APP_ROOT"],
        },
      ],
    ],
  };
};
