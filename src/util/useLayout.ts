import * as _ from "lodash";
import { useCallback, useMemo, useState } from "react";
import { LayoutRectangle } from "react-native";
import { Value } from 'animated';

/**
 * The two hooks:
 * 1. useLayoutAnimated
 * 2. useLayout
 * 
 * exists because setValue seems to unstable
 * */

/**
 * animated value layout container
 * */
function useLayoutAnimated() {
    const layout = useMemo(() => ({
        x: new Value<number>(0),
        y: new Value<number>(0),
        width: new Value<number>(0),
        height: new Value<number>(0),
    }), []);

    const setLayout = useCallback((layoutRect: LayoutRectangle) => _.forEach(layoutRect, (value, key) => {
        layout[key as keyof LayoutRectangle].setValue(value);
    }), [layout]);
    
    return [layout, setLayout] as [typeof layout, typeof setLayout];
}

/**
 * state layout
 * */
function useLayoutState() {
    return useState<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
}

/**
 * in future releases of reanimated it might be better to use the setValue approach instead of setState
 * simply set this to {useLayoutAnimated}
 * */
const useLayout = useLayoutState;   //useLayoutAnimated
export default useLayout;