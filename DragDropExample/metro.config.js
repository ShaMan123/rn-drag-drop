
const blacklist = require('metro-config/src/defaults/blacklist');
const { mergeConfig } = require("metro-config");
const path = require('path');
const _ = require('lodash');
const pkg = require('./package.json');

module.exports = {
    resolver: {
        sourceExts: ['ts', 'tsx', 'js'],
        blacklistRE: blacklist([
            path.resolve(__dirname, '../node_modules'),
            //path.resolve(__dirname, '../node_modules/react-native'),
            path.resolve(__dirname, '../DragDropExample1'),
        ]),
        //providesModuleNodeModules: Object.keys(pkg.dependencies),
        extraNodeModules: {
            '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
            "rn-drag-drop": path.resolve(__dirname, '..'),
            "animated": path.resolve(__dirname, '..', 'src/Animated'),
            "lodash": path.resolve(__dirname, 'node_modules', 'lodash'),
            ..._.mapValues(pkg.dependencies,(val, moduleName) => path.resolve(__dirname,'node_modules', moduleName)),
            //"react-native-reanimated": 
            //"rea": path.resolve(__dirname, '..', 'src/Animated'),
            //"animated": path.resolve(__dirname, '..', 'src/Animated'),
        }
    },
    watchFolders: [path.resolve(__dirname, '..')],
    transformer: {
        //babelTransformerPath: require.resolve('react-native-typescript-transformer'),
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: false,
            },
        }),
    },
};
