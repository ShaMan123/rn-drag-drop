/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');
const blacklist = require('metro-config/src/defaults/blacklist');
const escape = require('escape-string-regexp');
const { mergeConfig } = require("metro-config");

const config = {
    resolver: {
        /*
        blacklistRE: blacklist([
            new RegExp(`^${escape(__dirname)}(\\|\/)+node_modules((\\|\/)+(\w|-)+)+(\\|\/)+node_modules`)
        ])
        */
    },
    projectRoot: `${__dirname}/DragDropExample`,
    watchFolders: [
        __dirname
    ],
    transformer: {
        babelTransformerPath: require.resolve('react-native-typescript-transformer'),
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: false,
            },
        }),
    },
};

module.exports = config;
