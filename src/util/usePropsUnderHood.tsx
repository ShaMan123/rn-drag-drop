import * as _ from "lodash";
import React, { useContext, useMemo } from "react";
import { DraggableProps, DropZoneProps, Required } from "../Types";

//@ts-ignore
export const DropZonePropsUnderHood = React.createContext<DropZoneProps<any, never>>({});
//@ts-ignore
export const DraggablePropsUnderHood = React.createContext<DraggableProps<any, never>>({});

export function usePropsUnderHood<T, C extends React.Context<T>>(context: C, props: T) {
    const propsUnderHood = useContext(context) as Partial<T>;
    if (__DEV__) {
        const overridenKeys = _.intersection(_.keys(propsUnderHood), _.keys(props));
        _.size(overridenKeys) > 0 && console.warn('DragDrop: Attempting to assign values to reserved props', overridenKeys);
    }

    //useCode() //dropZoneOffset
    
    return useMemo(() => _.assign({}, props, propsUnderHood) as Required<T>, [props, propsUnderHood]);
}

export function useDraggablePropsUnderHood<T, P extends Partial<DraggableProps<T>>>(props: P) {
    return usePropsUnderHood(DraggablePropsUnderHood, props);
}

export function useDropZonePropsUnderHood<T, P extends Partial<DropZoneProps<T>>>(props: P) {
    return usePropsUnderHood(DropZonePropsUnderHood, props);
}