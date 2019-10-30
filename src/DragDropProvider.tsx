import React, { useEffect, useMemo, useRef } from "react";
import { Transition, Transitioning, TransitioningView, TransitioningViewProps } from 'react-native-reanimated';
import { DragDropComparators, ExcludeField } from "./Types";
import { DragDropContext, DragDropContextFactory, styles, useCalculateLayout, useDraggableStateChangeCaller } from "./util";

export interface DragDropProviderProps {
    children: React.ReactNode,
    /**
     * set to `false` to inhance performance.
     * You will need to call `recalculateLayout` yourself in some use cases.
     * */
    disableAutoRecalculation?: boolean,

    /**
     * change default transition
     * see `react-native-reanimated` docs:
     * https://github.com/kmagiera/react-native-reanimated#transitions
     * */
    transition?: TransitioningViewProps['transition'],

    /**
     * Advanced configuration:
     * provide comparator functions for fine grained type comparison
     * both comparators must be logically equal
     * 
     * best practice is to pass a proc
     * refer to reanimated documentation:
     * https://github.com/kmagiera/react-native-reanimated#proc
     * 
     * e.g.
     * 
     * {
     *      lodash: (draggableType, dropZoneType) => draggableType > dropZoneType,
     *      reanimated: (draggableType, dropZoneType) => greaterThan(draggableType, dropZoneType)
     * }
     * 
     * default value:
     * 
     * {
     *      lodash: _.isEqual
     *      reanimated: eq
     * }
     * */
    comparators?: DragDropComparators
}

const transition = (
    <Transition.Together>
        <Transition.Change interpolation="easeInOut" />
    </Transition.Together>
);

function DragDropProvider({ children, disableAutoRecalculation, transition, comparators }: DragDropProviderProps) {
    const context = useMemo(() => DragDropContextFactory(), []);
    useEffect(() => {
        context.setAutoRecalculation(!disableAutoRecalculation);
    }, [context, disableAutoRecalculation]);
    useCalculateLayout(context);
    
    useDraggableStateChangeCaller(context);

    const ref = useRef<TransitioningView>();

    useEffect(() => {
        context.__setRoot(ref);
    }, [ref]);

    useEffect(() => {
        context.setComparators(comparators);
    }, [comparators]);

    return (
        <Transitioning.View
            ref={ref}
            transition={transition}
            style={[styles.default, styles.overflow, {backgroundColor:'red'}]}
            collapsable={false}
        >
            <DragDropContext.Provider
                value={context}
            >
                {children}
            </DragDropContext.Provider>
        </Transitioning.View>
    );
}

DragDropProvider.defaultProps = {
    transition
}

export { DragDropProvider };

export function DragDropProviderHOC(Component: React.ComponentType<any>, props: Partial<ExcludeField<DragDropProviderProps, 'children'>> = {}) {
    return () => (
        <DragDropProvider {...props}>
            <Component />
        </DragDropProvider>
    );
}