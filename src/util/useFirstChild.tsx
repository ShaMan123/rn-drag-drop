import React, { useMemo } from "react";
import { View } from 'animated';
import { useDragDropContext } from "./DragDropContext";
import { DragDropCommonContext, DraggableProps, DropZoneProps, Map } from "../Types";

function useFirstChild<T extends { children?: React.ReactNode }>(props: T): React.ReactElement<T>;
function useFirstChild<T extends { children?: (context: any) => React.ReactNode }>(props: T, id: string): React.ReactElement<T>;
function useFirstChild<T extends Map, C extends DragDropCommonContext<T>, P extends DraggableProps<T> | DropZoneProps<T>>(props: P, id?: T['children'] extends (context: C) => React.ReactNode ? string : never) {
    const context = useDragDropContext();
    const element = useMemo(() => {
        const childCount = React.Children.count(props.children);
        if (__DEV__ && childCount > 1) console.error('Drag & Drop: Draggable/DropZone must have one child or none');
        if (typeof props.children === 'function' && id) {
            //@ts-ignore
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

export { useFirstChild as default };
