import * as _ from "lodash";
import React, { useRef } from "react";
import { LongPressGestureHandler, PanGestureHandler } from "react-native-gesture-handler";
import { View } from 'src/Animated';
import { styles, useDragDropRef, useFirstChild } from "./Common";
import { useDraggable, useDraggableActivator, useDraggableProps, useRegisterDraggable } from "./DraggableHooks";
import { DraggableProps, Map } from "./Types";

function Draggable<T extends Map>(rawProps: DraggableProps<T>) {
    const id = useRegisterDraggable();
    const [finalProps, unmountComponent] = useDraggableProps(id, rawProps);
    const node = useFirstChild(rawProps, id);

    const { simultaneousHandlers, children, containerStyle, style, onDrop, longPressEnabled, ...rest } = finalProps;

    const ref = useDragDropRef(id);
    const [panProps, translateStyle] = useDraggable(id, finalProps);
    const activatorProps = useDraggableActivator(id);

    const longPressHandler = useRef<LongPressGestureHandler>();
    const panHandler = useRef<PanGestureHandler>();

    return unmountComponent ?
        null :
        (
            <LongPressGestureHandler
                {...rest}
                {...activatorProps}
                ref={longPressHandler}
                simultaneousHandlers={_.concat(simultaneousHandlers, panHandler)}
                enabled={longPressEnabled}
            >
                <View
                    collapsable={false}
                    style={[containerStyle, styles.overflow, translateStyle]}
                >
                    <PanGestureHandler
                        {...rest}
                        {...panProps}
                        ref={panHandler}
                        simultaneousHandlers={_.concat(simultaneousHandlers, longPressHandler)}
                    >
                        {React.cloneElement(node, {
                            ref,
                            collapsable: false
                        })}
                    </PanGestureHandler>
                </View>
            </LongPressGestureHandler>
        );
}

Draggable.defaultProps = {
    simultaneousHandlers: [],
    longPressEnabled: true,
    dragEnabled: true,
    hoverDuration: 1500
    //onDrop: true
} as Partial<DraggableProps<Map>>;

export default Draggable;