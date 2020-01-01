import * as _ from "lodash";
import React, { useRef } from "react";
import { LongPressGestureHandler, PanGestureHandler } from "react-native-gesture-handler";
import { View } from 'animated';
import { useDraggable, useDraggableActivator, useDraggableProps, useRegisterDraggable } from "./DraggableHooks";
import { DraggableProps, Map } from "./Types";
import { styles, useDragDropRef, useFirstChild } from "./util";

import { requireNativeComponent } from 'react-native';

const DraggableNativeView = requireNativeComponent('DraggableManager');

function Draggable<T extends Map>(props: DraggableProps<T>) {
    const id = useRegisterDraggable();
    const finalProps = useDraggableProps(id, props);
    const node = useFirstChild(props, id);

    const { simultaneousHandlers, children, containerStyle, style, longPressEnabled, ...rest } = finalProps;

    const ref = useDragDropRef(id);
    const [panProps, translateStyle] = useDraggable(id, finalProps);
    const activatorProps = useDraggableActivator(id);

    const longPressHandler = useRef<LongPressGestureHandler>();
    const panHandler = useRef<PanGestureHandler>();

    return (
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
                    <DraggableNativeView style={[styles.default, { backgroundColor: 'red' }]}>
                        {React.cloneElement(node, {
                            ref,
                            collapsable: false
                        })}
                    </DraggableNativeView>
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
} as Partial<DraggableProps<Map>>;

export default Draggable;