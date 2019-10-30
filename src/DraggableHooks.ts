import * as _ from "lodash";
import React, { useMemo } from "react";
import { ViewProperties } from "react-native";
import { LongPressGestureHandlerStateChangeEvent, PanGestureHandlerGestureEvent, PanGestureHandlerProperties, PanGestureHandlerStateChangeEvent, State } from "react-native-gesture-handler";
import { and, block, cond, delay, diff, eq, eqWhile, event, neq, not, onChange, or, proc, set, springBack, useCode, useValue } from 'animated';
import { DraggableDesignatedProps, DraggableProps, DraggableState, Map } from "./Types";
import { isStateActive, useDragDropContext, useDraggablePropsUnderHood, useUpdateContext } from "./util";

/*
function useDefaultDropCallback<T>(onDropProp: ((...any[])=>any) | boolean = true) {
    const context = useDragDropContext();
    const [unmount, unmountComponent] = useState(false);
    const onDrop = useCallback(() => {
        if (onDropProp === true) {
            context.animateNextTransition();
            unmountComponent(true);
        }
        else if (_.isFunction(onDropProp)) {
            return onDropProp();
        }
    }, [onDropProp, context.animateNextTransition]);

    return [unmount, onDrop]// as [boolean, DropZoneCallback<T>];
}
*/

export function useRegisterDraggable() {
    const context = useDragDropContext();
    const id = useMemo(() => {
        const key = _.uniqueId('Draggable');
        context.registerDraggable(key);
        return key;
    }, []);

    return id;
}

export function useDraggableProps<T extends Map>(id: string, props: DraggableProps<T>) {
    const consumedProps = useDraggablePropsUnderHood(props);
    const { simultaneousHandlers: simultaneousHandlersProp, children, containerStyle: containerStyleProp, style } = consumedProps;

    const containerStyle = useMemo(() =>
        React.Children.count(children) === 0 ? containerStyleProp : style,
        [children, containerStyleProp, style]
    );

    const simultaneousHandlers = useMemo(() =>
        _.isArray(simultaneousHandlersProp) ? simultaneousHandlersProp : [simultaneousHandlersProp],
        [simultaneousHandlersProp]
    );

    const [unmount, onDrop] =[false, false]// useDefaultDropCallback(onDropProp);

    const finalProps = useMemo(() => _.assign({}, consumedProps, { onDrop, containerStyle, simultaneousHandlers }), [consumedProps, onDrop, containerStyle, simultaneousHandlers])
    
    useUpdateContext(id, finalProps);  
    
    return [finalProps, unmount] as [Required<DraggableProps<T>>, boolean];
}

const isOverSameDropZone = proc((currentDropZoneTag) => cond(eq(currentDropZoneTag, -1), 0, eq(diff(currentDropZoneTag), 0)));

export function useDraggable<T>(id: string, { hoverDuration }: DraggableDesignatedProps<T>) {
    const context = useDragDropContext();
    const {
        currentDraggable,
        currentDropZone
    } = context;

    const tag = useMemo(() => parseInt(id.substr('Draggable'.length)), [id]);
    const { isEnabled, isActivated, isActive, isDragging, isOverDropZone, isHovering, translationX, translationY, absoluteX, absoluteY, state, type } = context.getDraggable(id);
    const translateX = useValue(0);
    const translateY = useValue(0);
    const isDraggingComplete = useValue(0);
    const dropState = useValue(0);
    const panState = useValue(State.UNDETERMINED);
    const panOldState = useValue(State.UNDETERMINED);
    const isStateful = useMemo(() => and(isEnabled, or(isActive, dropState)), [isEnabled, isActive, dropState]);
    
    const onPanGestureEvent = useMemo(() =>
        event<PanGestureHandlerGestureEvent>([
            {
                nativeEvent: ({ translationX: transX, translationY: transY, absoluteX: absX, absoluteY: absY }) =>
                    cond(
                        isEnabled,
                        [
                            set(translationX, transX),
                            set(translationY, transY),
                            set(absoluteX, absX),
                            set(absoluteY, absY),
                        ]
                    )
            }
        ]),
        [isEnabled, translationX, translationY, absoluteX, absoluteY]
    );

    const onPanHandlerStateChange = useMemo(() =>
        event<PanGestureHandlerStateChangeEvent>([
            {
                nativeEvent: {
                    state: panState,
                    oldState: panOldState
                }
            }
        ]),
        [panState, panOldState]
    );

    //  change context state container
    useCode(
        block([
            cond(
                isStateful,
                [
                    set(translateX, translationX),
                    set(translateY, translationY),
                    set(currentDraggable.tag, tag),
                    set(currentDraggable.state, state),
                    set(currentDraggable.absoluteX, absoluteX),
                    set(currentDraggable.absoluteY, absoluteY),
                    set(currentDraggable.translateX, translateX),
                    set(currentDraggable.translateY, translateY),
                    set(currentDraggable.isActive, isActive),
                    set(currentDraggable.isDragging, isDragging),
                    set(currentDraggable.isHovering, isHovering)
                ]
            ),
            onChange(
                isStateful,
                cond(
                    not(isStateful),
                    [
                        set(currentDraggable.tag, -1),
                        set(currentDraggable.absoluteX, 0),
                        set(currentDraggable.absoluteY, 0),
                        set(currentDraggable.translateX, 0),
                        set(currentDraggable.translateY, 0),
                        set(currentDraggable.isActive, 0),
                        set(currentDraggable.isDragging, 0),
                        set(currentDraggable.isHovering, 0)
                    ]
                )
            )
        ]),
        [isStateful, currentDraggable, translateX, translateY, translationX, translationY, tag, state, absoluteX, absoluteY, isActive, isDragging, isHovering]
    );

    //set type on it's own useCode to reduce unwanted evaluations
    useCode(
        cond(
            isStateful,
            _.map(currentDraggable.type, (t, i) => set(t, _.has(type, i) ? type[i] : -1))
        ),
        [isStateful, currentDraggable.type, type]
    );

    const resetPanValues = useMemo(() =>
        block([
            set(isActive, 0),
            set(translationX, 0),
            set(translationY, 0),
        ]),
        [isActive, translationX, translationY]
    );

    const resetValues = useMemo(() =>
        block([
            resetPanValues,
            set(translateX, 0),
            set(translateY, 0),
        ]),
        [resetPanValues, translateX, translateY]
    );

    const [springBackHome, isClockRunning] = useMemo(() =>
        springBack([translateX, 0], [translateY, 0]),
        [translateX, translateY]
    );

    const endInteraction = useMemo(() =>
        block([
            springBackHome,
            resetPanValues
        ]),
        [springBackHome, resetPanValues]
    );

    const finalizeState = useMemo(() =>
        cond(
            isDraggingComplete,
            cond(
                dropState,
                [
                    set(state, DraggableState.DROPPED),
                    resetValues,
                    delay(set(dropState, 0), 50),
                ],
                [
                    endInteraction,
                    set(state, DraggableState.INACTIVE)
                ]
            )
        ),
        [isDraggingComplete, dropState, endInteraction, resetValues, state]
    )
    
    //  manages state
    useCode(
        block([
            cond(
                isStateActive(panState),
                set(isActive, and(isActivated, isEnabled)),
                [
                    set(isActive, 0),
                    set(state, DraggableState.INACTIVE)
                ]
            ),
            set(isDragging, and(isActive, eq(panState, State.ACTIVE))),
            set(isDraggingComplete, and(neq(panOldState, State.BEGAN), neq(panOldState, State.UNDETERMINED))),  // //eq(panOldState, State.ACTIVE)
            set(isOverDropZone, and(isDragging, isOverSameDropZone(currentDropZone.tag))),
            set(isHovering, and(eqWhile(isOverDropZone, hoverDuration), isOverDropZone)),
            onChange(isHovering, cond(isHovering, set(dropState, 1))),
            cond(dropState, onChange(isOverDropZone, cond(and(isDragging, not(isOverDropZone)), set(dropState, 0)))),
            finalizeState,

            onChange(isActivated, cond(isActivated, set(state, DraggableState.BEGAN))),
            onChange(isActive, cond(isActive, set(state, DraggableState.ACTIVE), set(currentDraggable.lastTag, tag))),
            onChange(isDragging, cond(isDragging, set(state, DraggableState.DRAGGING))),
            onChange(isOverDropZone, cond(isOverDropZone, set(state, DraggableState.ENTERED), cond(isDragging, set(state, DraggableState.EXITED)))),
            onChange(isHovering, cond(isHovering, set(state, DraggableState.HOVERING))),
            /*
            onChange(state, call([state, panOldState, isActive], ([s, s1, ...a]) => {
                console.log(DraggableState[s], State.print(s1), ...a);
            }))
            */
        ]),
        [isEnabled, isDragging, isDraggingComplete, panState, panOldState, finalizeState, isOverDropZone, isHovering, isActive, isActivated, state, dropState, tag, currentDraggable.lastTag, currentDropZone.tag]
    );

    // handle disabling
    useCode(
        cond(not(isEnabled), endInteraction),
        [isEnabled, endInteraction]
    );

    const panProps = useMemo(() =>
        ({
            shouldCancelWhenOutside: false,
            maxPointers: 1,
            onGestureEvent: onPanGestureEvent,
            onHandlerStateChange: onPanHandlerStateChange,
        }),
        [onPanGestureEvent, onPanHandlerStateChange]
    );

    const translateStyle = useMemo(() =>
        ({
            transform: [
                { translateX },
                { translateY },
                { perspective: 1000 }
            ]
        }),
        [translateX, translateY]
    );

    return [panProps, translateStyle] as [Partial<PanGestureHandlerProperties>, ViewProperties['style']];
}

export function useDraggableActivator(id: string) {
    const context = useDragDropContext();
    const { isActivated } = context.getDraggable(id);

    const onHandlerStateChange = useMemo(() =>
        event<LongPressGestureHandlerStateChangeEvent>([
            {
                nativeEvent: ({ state, oldState }) => set(isActivated, or(eq(state, State.ACTIVE), eq(oldState, State.ACTIVE)))
            }
        ]),
        [isActivated]
    );

    return useMemo(() => ({
        shouldCancelWhenOutside: true,
        maxPointers: 1,
        onHandlerStateChange
    }), [onHandlerStateChange]);
}
