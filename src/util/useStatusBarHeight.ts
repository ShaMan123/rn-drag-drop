import * as _ from "lodash";
import { useMemo } from "react";
import { Platform, StatusBar } from "react-native";

/**
 *  android measurements of the screen seem to be affected by the StatusBar only before mounting of the component
 *  this is why this hook is a evaluate once hook
 * */
export function useStatusBarHeight() {
    return useMemo(() => {
        const height = _.defaultTo(StatusBar.currentHeight, 0);
        if (height === 0 || Platform.OS !== 'android') return 0;

        // Android measurements do not account for StatusBar, so we must do so manually.
        const hidden = _.get(StatusBar, '_currentValues.hidden.value', false);
        const translucent = _.get(StatusBar, '_currentValues.translucent', false);
        const visible = !hidden && !translucent;
        return visible ? height : 0;
    }, []);
}