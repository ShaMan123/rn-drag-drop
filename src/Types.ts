import React from "react";
import Animated from "src/Animated";
import { LayoutChangeEvent, ViewProperties } from "react-native";
import { PanGestureHandlerProperties, State, GestureHandlerStateChangeEvent } from "react-native-gesture-handler";

export type Map<T = any> = { [key: string]: T };
export type ExcludeKey<K, KeyToExclude> = K extends KeyToExclude ? never : K;
export type ExtractKey<K, KeyToExtract> = K extends KeyToExtract ? K : never;
export type ExcludeField<A, KeyToExclude extends keyof A> = { [K in ExcludeKey<keyof A, KeyToExclude>]: A[K] };

export type WithId<T> = T & { id: string };

export type Children<T> = React.ReactNode | ((context: T) => React.ReactNode);
//export type IsDefined<C, TTrue, TFalse> = C extends never ? TFalse : TTrue;
//export type WithViewProps<T extends { children?: Children<any> }> = T & IsDefined<T['children'], {}, ViewProperties>;
//export type OptionalViewProps<C> = IsDefined<C, {}, ViewProperties>;

type DraggableStateChangeEventData<T> = {
    id: string,
    data: T
}

export type DraggableStateChangeEvent<T1 extends Map, T2 extends Map> = {
    draggable: DraggableStateChangeEventData<T1>,
    dropZone: DraggableStateChangeEventData<T2> | null,
    state: DraggableState
}

export type DraggableStateChangeEventCallback<T1 extends Map = any, T2 extends Map = any> = (dragStateData: DraggableStateChangeEvent<T1, T2>) => (any | void);

export enum DraggableState {
    INACTIVE,
    BEGAN,
    ACTIVE,
    DRAGGING,
    ENTERED,
    /**
     * indicates a Draggable has exceeded `hoverDuration` over a DropZone
     * use this callback to render a ghost element
     * use state to clean up the ghost
     * 
     * */
    HOVERING,
    DROPPED,
    EXITED
}

export type OffsetRect<T = OffsetRect<Animated.Adaptable<number>>> = {
    left: T,
    top: T,
    right: T,
    bottom: T
};

export type DragDropCommons<T extends Map> = Partial<{}>;

type AnimatedBooleanProp = boolean | Animated.Adaptable<0 | 1>;

/**
 * @todo Future enahancement: providing the ids to the comparators for fine grained comparison. (This may cause reanimated node overload)
 * */
export interface DragDropComparators {
    lodash: (draggableType: number, dropZoneType: number) => boolean,
    reanimated: (draggableType: Animated.Adaptable<number>, dropZoneType: Animated.Adaptable<number>) => Animated.Node<0 | 1>
}

export type DragDropCommonProps<T extends Map> = DragDropCommons<T> & {
    /**
    * Connects Draggables to DropZones
    * Pass the same type to a Draggable/DropZone in order for them to interact
    * 
    * Best Practice:
    * Assign a different type to each group of connected items
    * */
    type: Animated.Adaptable<number> | Animated.Adaptable<number>,

    /**
     * The data to be passed onto callbacks, e.g onDrop(data, ...)
     * The id of the Draggable/DropZone will be injected to the given object
     * */
    data?: T,
}

export type DragDropCommonContext<T extends Map> = WithId<DragDropCommons<T>> & {
    enabled: boolean,
    data: T,
    type: Animated.Adaptable<number>[],
    __type: number[],
    ref?: React.MutableRefObject<any>,
}

export type DraggableContext<T> = DragDropCommonContext<T> & {
    isEnabled: Animated.Value<0 | 1>,
    isActivated: Animated.Value<0 | 1>,
    isActive: Animated.Value<0 | 1>,
    isDragging: Animated.Value<0 | 1>,

    /** 
     *  Indicates whether the Draggable is currently dragged over a DropZone
     *  The DropZone will be informed as well
     *  To access which DropZone is active: `useDragDropContext().currentDropZone`
     *  */
    isOverDropZone: Animated.Value<0 | 1>,
    /**
     * Indicates whether the Draggable is in hovering state,
     * meaning it has been hovering over the DropZone for more than {hoverDuration} ms
     * */
    isHovering: Animated.Value<0 | 1>,
    translationX: Animated.Value<number>,
    translationY: Animated.Value<number>,
    absoluteX: Animated.Value<number>,
    absoluteY: Animated.Value<number>,

    state: Animated.Value<DraggableState>
}

export type DropZoneContext<T> = DragDropCommonContext<T> & {
    /**
     * The function that measures the DropZone
     * Call `measure` after changes made by Transition or FlatList reordering because there no additional layout done
     * */
    measure: () => void,

    isEnabled: Animated.Value<0 | 1>,

    /**
     * Indicates whether a Draggable is hovering over the DropZone
     * The Draggable will be informed as well
     * */
    isOverDropZone: Animated.Value<0 | 1>,
    offsetLeft: Animated.Value<number>,
    offsetTop: Animated.Value<number>,
    offsetRight: Animated.Value<number>,
    offsetBottom: Animated.Value<number>,
}


export type DraggableDesignatedProps<T extends Map> = _.Omit<DragDropCommonProps<T>, 'onDrop'> & {
    dragEnabled?: AnimatedBooleanProp,
    onDraggableStateChange?: (dragData: DraggableStateChangeEvent<T, T>) => (any | void),
    /**
     * duration in ms after which a Draggable is considered as hovering over a DropZone
     * */
    hoverDuration?: number
};

export type DraggableProps<T extends Map> = ViewProperties & PanGestureHandlerProperties & DraggableDesignatedProps<T> & {
    longPressEnabled?: boolean,
    containerStyle?: ViewProperties['style'],
    children?: Children<DraggableContext<T>>
};

export type DropZoneDesignatedProps<T extends Map> = DragDropCommonProps<T> & {
    onLayout?: (e: LayoutChangeEvent) => (any | void),
    dropEnabled?: AnimatedBooleanProp,
    dropZoneOffset?: OffsetRect
}

export type DropZoneProps<T extends Map> = ViewProperties & DropZoneDesignatedProps<T> & {
    type: Animated.Adaptable<number>,
    children?: Children<DropZoneContext<T>>
};