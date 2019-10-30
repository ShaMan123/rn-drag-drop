import { Required } from "@autodidact/types/src/Types";
import * as _ from "lodash";
import React, { useContext, useEffect, useMemo, useRef } from "react";
import { Platform, StatusBar, StyleSheet } from "react-native";
import { block, call, delay, set, useCode, Value, View } from 'src/Animated';
import { useDragDropContext } from "./DragDropContext";
import { DragDropCommonContext, DraggableDesignatedProps, DraggableProps, DropZoneDesignatedProps, DropZoneProps, Map } from "./Types";

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

function useFirstChild<T extends { children?: React.ReactNode }>(props: T): React.ReactElement<T>;
function useFirstChild<T extends { children?: (context: any) => React.ReactNode }>(props: T, id: string): React.ReactElement<T>;
function useFirstChild<T extends Map, C extends DragDropCommonContext<T>, P extends DraggableProps<T> | DropZoneProps<T>>(props: P, id?: T['children'] extends (context: C) => React.ReactNode ? string : never) {
    const context = useDragDropContext();
    const element = useMemo(() => {
        const childCount = React.Children.count(props.children);
        if (__DEV__ && childCount > 1) console.error('Drag & Drop: Draggable/DropZone must have one child or none');
        if (typeof props.children === 'function' && id) {
            return props.children(context.getFromId(id)) as React.ReactElement<P>;
        }
        else {
            const element = childCount === 1 ?
                React.Children.only(props.children) :
                <View {...props} />;
            return element as React.ReactElement<P>;
        }
    }, [props, context]);

    return element;
}

export { useFirstChild };

export const styles = StyleSheet.create({
    overflow: {
        overflow: 'visible'
    },
    default: {
        flex: 1
    }
});

export function usePropsUnderHood<T, C extends React.Context<T>>(context: C, props: T) {
    const propsUnderHood = useContext(context) as Partial<T>;
    if (__DEV__) {
        const overridenKeys = _.intersection(_.keys(propsUnderHood), _.keys(props));
        _.size(overridenKeys) > 0 && console.warn('DragDrop: Attempting to assign values to reserved props', overridenKeys);
    }

    //useCode() //dropZoneOffset

    return useMemo(() => _.assign({}, props, propsUnderHood) as Required<T>, [props, propsUnderHood]);
}

export function useUpdateContext<T, P extends DraggableDesignatedProps<T> | DropZoneDesignatedProps<T>>(id: string, props: P) {
    const context = useDragDropContext();
    const { data, onDrop, onEnter, onExit, type: typeProp, dragEnabled, dropEnabled, onDraggableStateChange } = props as Required<DraggableDesignatedProps<T> & DropZoneDesignatedProps<T>>;
    const { isEnabled } = context.getFromId(id);

    const value = useMemo(() => {
        const enabled = dragEnabled || dropEnabled;
        if (typeof enabled === 'boolean') {
            context.__setEnabled(id, enabled);
            //isEnabled.setValue(enabled ? 1 : 0);
            return enabled ? 1 : 0
        }
        else {
            return enabled;
        }
    }, [dragEnabled, dropEnabled, context, id]);

    //@to-do seems not to work
    useCode(
        block([
            delay(set(isEnabled, 1), 1500),
            delay(set(isEnabled, 0), 1000),
            call([isEnabled], ([enabled]) => {
                context.__setEnabled(id, enabled === 1);
                //console.log('enabled?',enabled===1)
            })
        ]),
        [isEnabled, value, context, id]
    );

    const consumedType = useMemo(() => {
        const consumedArr = _.map(_.isArray(typeProp) ? typeProp : [typeProp],
            (t) => {
                if (t instanceof Value) return t;
                else {
                    if (__DEV__ && !_.isFinite(t)) console.error(`DragDrop: invalid type value ${t}`, id);
                    return new Value(_.isFinite(t) ? t : -1);
                }
            });
        context.setType(id, consumedArr);
        return consumedArr;
    }, [id, typeProp]);

    useCode(
        call(consumedType, (c) => context.__setType(id, c as number[])),
        [consumedType, typeProp, context, id]
    );

    useEffect(() => {
        context.setData(id, data);
    }, [id, data]);

    useEffect(() => {
        context.registerCallback(id, 'onDraggableStateChange', onDraggableStateChange);
    }, [id, onDraggableStateChange]);

    useEffect(() => {
        context.registerCallback(id, 'onDrop', onDrop);
    }, [id, onDrop]);

    useEffect(() => {
        context.registerCallback(id, 'onEnter', onEnter);
    }, [id, onEnter]);

    useEffect(() => {
        context.registerCallback(id, 'onExit', onExit);
    }, [id, onExit]);

    useEffect(() => () => {
        context.unregister(id);
    }, [id]);
}

export function useDragDropRef<T=any>(id: string) {
    const context = useDragDropContext();
    const ref = useRef<T>();
    useMemo(() => context.registerRef(id, ref), []);

    useEffect(() => {
        if (ref.current && context.pip) context.pip(ref, id);
    })

    return ref;
}

