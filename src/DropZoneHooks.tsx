import * as _ from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { findNodeHandle, LayoutChangeEvent, LayoutRectangle, UIManager } from "react-native";
import Animated, { add, and, block, call, cond, eq, neq, onChange, set, useCode, Value } from 'src/Animated';
import { useDragDropRef, useFirstChild, usePropsUnderHood, useStatusBarHeight, useUpdateContext } from "./Common";
import { DragDropContextT, useDragDropContext } from "./DragDropContext";
import { DraggableContext, DropZoneDesignatedProps, DropZoneProps, OffsetRect } from "./Types";
import { isInRect } from "./Util";

export function useCalculateLayoutForDraggable<T>(draggable: string | DraggableContext<T>) {
    const context = useDragDropContext();
    const { isActive, __type } = typeof draggable === 'string' ? context.getDraggable(draggable) : draggable;
    useCode(
        onChange(isActive, cond(isActive, call([isActive], () => context.recalculateLayout(__type)))),
        [isActive, __type]
    );
}

export function useCalculateLayout(context: DragDropContextT) {
    const { currentDraggable: { tag } } = context;
    useCode(
        onChange(tag, cond(neq(tag, -1), call([tag], ([d]) => {
            try {
                if (!context.autoRecalc) return;
                const draggable = context.safeGetDraggable(d);
                context.recalculateLayout(draggable.__type);
            }
            catch (error) {
                __DEV__ && console.error(error);
            }
        }))),
        [tag, context]
    );
}

function setOffsetRect(
    id: string,
    offsets: Partial<OffsetRect> = {}
) {
    const { left, top, right, bottom } = _.defaultsDeep(offsets, { left: 0, top: 0, right: 0, bottom: 0 });
    const context = useDragDropContext();
    const { offsetLeft, offsetTop, offsetRight, offsetBottom } = context.getDropZone(id);
    return block([
        set(offsetLeft, left),
        set(offsetTop, top),
        set(offsetRight, right),
        set(offsetBottom, bottom),
    ]);
}

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

function useLayout() {
    return useState<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
}

/**
 * in future releases of reanimated it might be better to use the setValue approach instead of setState
 * simply set this to {useLayoutAnimated}
 * */
const useLayoutHook = useLayout;   //useLayoutAnimated

export function useMeasureLayout(
    id: string,
    ref: React.MutableRefObject<any>,
    props: {
        onLayout?: (e: LayoutChangeEvent) => void,
        offsets?: Partial<OffsetRect>
    }
) {
    const context = useDragDropContext();
    const { offsetLeft, offsetTop, offsetRight, offsetBottom } = context.getDropZone(id);
    const [layout, setLayout] = useLayoutHook();

    const measure = useCallback(() => {
        //const handle = ref.current && findNodeHandle(ref.current);
        /*
        handle && UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
            if (_.some([width, height, pageX, pageY], _.isNil)) return;
            setLayout({ x: pageX, y: pageY, width, height });
        });
        */
        context.measure(ref, (x, y, width, height) => setLayout({ x, y, width, height }));
    }, [ref, setLayout, context.measure]);

    useMemo(() => context.registerCallback(id, 'measure', measure), [id, measure]);

    const statusBarHeight = 0//useStatusBarHeight();
    
    useCode(setOffsetRect(id, props.offsets), [props.offsets]);

    const hitRect = useMemo(() => {
        const { x, y, width, height } = layout;
        return {
            left: add(offsetLeft, x),
            right: add(offsetRight, x, width),
            top: add(offsetTop, y, statusBarHeight),
            bottom: add(offsetBottom, y, height, statusBarHeight)
        }
    },
        [layout, statusBarHeight, offsetLeft, offsetTop, offsetRight, offsetBottom]
    );

    const onLayout = useCallback((e) => {
        measure();
        props.onLayout && props.onLayout(e);
    }, [measure, props.onLayout]);

    return [hitRect, onLayout] as [typeof hitRect, typeof onLayout];
}

export function useRegisterDropZone() {
    const context = useDragDropContext();
    const id = useMemo(() => {
        const key = _.uniqueId('DropZone');
        context.registerDropZone(key);
        return key;
    }, []);
    return id;
}

export function useNode<T extends Object>(id: string, props: DropZoneProps<T>) {
    const node = useFirstChild(props, id);
    if (__DEV__ && _.has(node.props, 'onLayout') && React.Children.count(props.children) > 0) {
        console.error('Drag & Drop: pass `onLayout` props directly to `DropZone` instead of to it\'s child');
    }
    return node;
}

//@ts-ignore
export const DropZonePropsUnderHood = React.createContext<DraggableProps<any, never>>({});

export function useDropZoneProps<T>(id: string, props: DropZoneDesignatedProps<T>) {
    const consumedProps = usePropsUnderHood(DropZonePropsUnderHood, props);
    useUpdateContext(id, consumedProps);
    return consumedProps;
}

//const overDropZone = proc((isType, isActive, isDragging, isInRect) => and(isType, isActive, isDragging, isInRect));

export function useDropZone<T>(id: string, props: DropZoneDesignatedProps<T>) {
    const context = useDragDropContext();
    const { currentDraggable, currentDropZone } = context;
    const tag = useMemo(() => parseInt(id.substr('DropZone'.length)), [id]);
    const ref = useDragDropRef(id);
    const [hitRect, onLayout] = useMeasureLayout(id, ref, props);

    const { isOverDropZone, isEnabled, type } = context.getDropZone(id);
    /*
    useCode(
        set(isOverDropZone, safeArrayOperator(or, _.map(context.draggables, ({ type: dType, isActive, isDragging, absoluteX, absoluteY }) => {
            return and(
                context.isSameAnimatedType(type, dType),
                isActive,
                isDragging,
                greaterOrEq(absoluteX, hitRect.left),
                lessOrEq(absoluteX, hitRect.right),
                greaterOrEq(absoluteY, hitRect.top),
                lessOrEq(absoluteY, hitRect.bottom)
            )
        }))),
        [hitRect, isOverDropZone, context.draggables, context.isSameAnimatedType, type]
    );
    */

    const { type: dType, isActive, isDragging, absoluteX, absoluteY } = context.currentDraggable;
    useCode(
        set(isOverDropZone, and(
            context.isSameAnimatedType(type, dType),
            isActive,
            isDragging,
            isInRect(absoluteX, absoluteY, hitRect.left, hitRect.top, hitRect.right, hitRect.bottom)
        )),
        [
            _.values(hitRect), isOverDropZone, context.draggables, context.isSameAnimatedType, type,
            dType, isActive, isDragging, absoluteX, absoluteY
        ]
    );

    useCode(
        cond(
            isEnabled,
            onChange(
                isOverDropZone,
                cond(
                    isOverDropZone,
                    [
                        set(currentDropZone.tag, tag),
                    ],
                    cond(
                        eq(currentDropZone.tag, tag),
                        [
                            set(currentDropZone.tag, -1),
                            set(currentDropZone.lastTag, tag)
                        ]
                    )
                )
            )
        ),
        [isEnabled, isOverDropZone, currentDropZone.tag, currentDropZone.lastTag, tag]
    );

    const passProps = useMemo(() => ({
        ref,
        collapsable: false,
        onLayout
    }), [ref, onLayout]);

    return passProps;
}