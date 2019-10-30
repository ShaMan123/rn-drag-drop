/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { DragDropProviderHOC } from 'rn-drag-drop';

AppRegistry.registerComponent(appName, () => DragDropProviderHOC(App));
