import React from 'react';
import { View } from 'react-native';
import BasicExample from './src/BasicExample';
import FlatListExample from './src/FlatListExample';




//UIManager.setLayoutAnimationEnabledExperimental(true);


//YellowBox.ignoreWarnings(['Warning: componentWillMount is deprecated', 'Warning: componentWillUpdate is deprecated', 'Warning: `flexWrap: `wrap``']);
//YellowBox.ignoreWarnings(['Warning: State updates from']);
//YellowBox.ignoreWarnings(['Warning: componentWillMount']);

//I18nManager.allowRTL(true);
//I18nManager.forceRTL(true);


export default function App() {
    return (
        
        <FlatListExample />
    );
}