import * as _ from "lodash";
import React, { useContext } from "react";
import { findNodeHandle, UIManager } from "react-native";
import Animated from 'react-native-reanimated';
import { eq, neq, Value } from 'animated';
import { DragDropComparators, DraggableContext, DraggableState, DropZoneContext, WithId } from "../Types";
import { isSameAnimatedType, isSameType } from "./animated";

export type DragDropContextT = ReturnType<typeof DragDropContextFactory>;

const defaultComparators: DragDropComparators = {
    lodash: _.isEqual,
    reanimated: eq
}

export function DragDropContextFactory() {
    const currentDropZoneTag = new Value<number>(-1);

    return {
        draggables: {} as { [key: string]: DraggableContext<any> },
        dropZones: {} as { [key: string]: DropZoneContext<any> },
        currentDraggable: {
            type: [new Value(-1)] as Animated.Value<number>[],
            state: new Value<number>(DraggableState.INACTIVE),
            tag: new Value<number>(-1),
            lastTag: new Value<number>(-1),
            isActive: new Value(0),
            isDragging: new Value(0),
            isHovering: new Value(0),
            absoluteX: new Value(0),
            absoluteY: new Value(0),
            translateX: new Value(0),
            translateY: new Value(0),
        },
        currentDropZone: {
            tag: currentDropZoneTag,
            lastTag: new Value<number>(-1),
            hittingDropZone: neq(currentDropZoneTag, -1),
        },
        

        registerDraggable<T>(id: string) {
            const type = new Value(-1);
            const isEnabled = new Value(1);
            const isActivated = new Value(0);
            const isActive = new Value(0);
            const isDragging = new Value(0);
            const isOverDropZone = new Value(0);
            const isHovering = new Value(0);
            const translationX = new Value(0);
            const translationY = new Value(0);
            const absoluteX = new Value(0);
            const absoluteY = new Value(0);
            const state = new Value(DraggableState.INACTIVE);

            const d: DraggableContext<WithId<any>> = {
                type: [type],
                __type: [-1],
                id,
                enabled: true,
                isEnabled,
                isActivated,
                isActive,
                isDragging,
                isOverDropZone,
                isHovering,
                translationX,
                translationY,
                absoluteX,
                absoluteY,
                state,
                data: { id }
            };

            _.set(this.draggables, id, d);

            return this.draggables[id];
        },
        unregisterDraggable(id: string) {
            return _.unset(this.draggables, id);
        },
        getDraggable(id: string) {
            return this.draggables[id];
        },
        toDraggableId(n: number) {
            return `Draggable${n}`;
        },
        safeGetDraggable(n: number) {
            const id = this.toDraggableId(n);
            const context = this.draggables[id];
            if (!context) throw new Error(`DragDrop: failed to get context for ${id}`);
            return context;
        },

        registerDropZone(id: string) {
            const type = new Value(-1);
            const isEnabled = new Value(1);
            const isOverDropZone = new Value(0);
            const offsetLeft = new Value(0);
            const offsetTop = new Value(0);
            const offsetRight = new Value(0);
            const offsetBottom = new Value(0);

            const d: DropZoneContext<WithId<any>> = {
                type: [type],
                __type: [-1],
                id,
                measure: () => { __DEV__ && console.error('DragDrop: fatal error') },
                enabled: true,
                isEnabled,
                isOverDropZone,
                offsetLeft,
                offsetTop,
                offsetRight,
                offsetBottom,
                data: { id }
            };

            _.set(this.dropZones, id, d);

            return this.dropZones[id];
        },
        unregisterDropZone(id: string) {
            return _.unset(this.dropZones, id);
        },
        getDropZone(id: string) {
            return this.dropZones[id];
        },
        toDropZoneId(n: number) {
            return `DropZone${n}`;
        },
        safeGetDropZone(n: number) {
            const id = this.toDropZoneId(n);
            const context = this.dropZones[id];
            if (!context) throw new Error(`DragDrop: failed to get context for ${id}`);
            return context;
        },

        registerCallback<T>(id: string, type: 'onDraggableStateChange' | 'measure', callback?: Function) {
            _.set(this.getFromId(id), type, callback);
        },
        setData(id: string, data: any) {
            if (_.has(data, 'current')) _.set(data, 'current.id', id)
            else if (_.isPlainObject(data)) {
                _.set(data, 'id', id);
            }
            _.set(this.getFromId(id), `data`, data);
        },
        setType(id: string, type: Animated.Adaptable<number>[]) {
            //  this is a nice little hack enabling to use a dynamic array of animated values
            //  => allocating in the right time
            const diff = _.size(type) - _.size(this.currentDraggable.type);
            if (diff > 0) {
                this.currentDraggable.type = _.concat(this.currentDraggable.type, _.map(new Array(diff), () => new Value(-1)));
            }
            
            _.set(this.getFromId(id), `type`, type);
        },
        /**
         * WARNING - INTERNAL USE ONLY
         * Don't call this function
         *
         * @param id
         * @param type
         */
        __setType(id: string, type: number[]) {
            if (__DEV__ && _.some(type, (t) => t === -1)) console.error('DragDrop: type -1 is reserved, use a different value');
            _.set(this.getFromId(id), `__type`, type);
        },
        /**
         * 
         * WARNING - INTERNAL USE ONLY
         * Don't call this function
         * 
         * DEV: this function controls whether the DropZone should be measured in a `recalculateLayout` pass
         * @param id
         * @param enabled
         */
        __setEnabled(id: string, enabled: boolean) {
            _.set(this.getFromId(id), `enabled`, enabled);
        },
        registerRef(id: string, ref: React.MutableRefObject<any>) {
            _.set(this.getFromId(id), `ref`, ref);
        },

        getFromId(id: string) {
            const collection = id.includes('Draggable') ? this.draggables : this.dropZones;
            return collection[id];
        },
        unregister(id: string) {
            const collection = id.includes('Draggable') ? this.draggables : this.dropZones;
            return _.unset(collection, id);
        },

        autoRecalc: true,
        /**
         * 
         * @param value set to `false` to inhance performance. 
         * You will need to call `recalculateLayout` yourself in some use cases.
         */
        setAutoRecalculation(value: boolean) {
            this.autoRecalc = value;
        },

        recalculateLayout(type?: number | number[]) {
            _.map(this.dropZones, ({ __type, enabled, measure }) => (!type || this.isSameType(type, __type)) && enabled && measure());
        },

        animateNextTransition: () => { },
        setAnimateNextTransition(animateNextTransition: () => void) {
            this.animateNextTransition = animateNextTransition;
        },

        __rootHandleTag: -1,
        __setRoot(ref: React.MutableRefObject<any>) {
            this.__rootHandleTag = ref.current ? findNodeHandle(ref.current) || -1 : -1;
            this.animateNextTransition = () => ref.current && ref.current.animateNextTransition();
        },

        measure(
            ref: React.MutableRefObject<any>,
            onSuccess: (x: number, y: number, width: number, height: number) => (any|void),
            onFail: (...args: any[]) => (any | void) = (...args) => __DEV__ && console.warn('DragDrop: failed to measure view', ...args)
        ) {
            const handleTag = findNodeHandle(ref.current);
            if (!handleTag) onFail();
            else {
                UIManager.measureLayout(handleTag, this.__rootHandleTag, onFail, onSuccess);
            }  
        },

        __comparators: defaultComparators,
        setComparators(comparators: DragDropComparators = defaultComparators) {
            if (__DEV__ && !_.isEqual(_.keys(comparators), _.keys(defaultComparators))) console.error('DragDrop: invalid comparators', comparators);
            this.__comparators = _.defaultsDeep(comparators);
        },
        isSameType<T extends number, I extends T | T[]>(draggableT: I, dropZoneT: I) {
            return isSameType(draggableT, dropZoneT, this.__comparators.lodash);
        },
        isSameAnimatedType<T extends Animated.Adaptable<number>, I extends T | T[]>(draggableT: I, dropZoneT: I) {
            return isSameAnimatedType(draggableT, dropZoneT, this.__comparators.reanimated);
        }
    }
}

export const DragDropContext = React.createContext<ReturnType<typeof DragDropContextFactory>>(DragDropContextFactory());

/**
 * convience function
 * alias for: `useContext(DragDropContext)`
 * */
export function useDragDropContext() {
    const context = useContext(DragDropContext);
    if (!context) throw new Error('DragDrop: context not found. \nIt seems you forgot to use DragDropProvider | DragDropProviderHOC\nFor More Information refer to the docs');
    return context;
}