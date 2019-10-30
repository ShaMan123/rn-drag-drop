import * as _ from "lodash";
import React, { useMemo } from "react";
import { and, cond, eq, onChange, set, useCode } from 'animated';
import { DropZoneDesignatedProps, DropZoneProps } from "./Types";
import { isInRect, useDragDropContext, useDragDropRef, useFirstChild, useMeasureLayout, usePropsUnderHood, useUpdateContext, useDropZonePropsUnderHood } from "./util";

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

export function useDropZoneProps<T>(id: string, props: DropZoneDesignatedProps<T>) {
    const consumedProps = useDropZonePropsUnderHood(props);
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