import { and, cond, interpolate, not, View } from 'animated';
import React from 'react';
import { processColor, StyleSheet } from 'react-native';
import { Draggable, DropZone } from 'rn-drag-drop';
import { DragDropType } from './common';

export default function BasicExample() {
    return (
        <>
            <Draggable type={DragDropType.a} style={{ width: 50, height: 50, backgroundColor: 'yellow', borderRadius: 50 }} data={{ pip: 'py' }} />
            <Draggable type={DragDropType.b}>
                <View style={{ width: 50, height: 50, backgroundColor: 'blue', borderRadius: 50 }} />
            </Draggable>
            <Draggable type={DragDropType.b} children={({ isActive }) => <View collapsable={false} style={{ width: 50, height: 50, backgroundColor: 'red', borderRadius: 50, opacity: cond(isActive, 0.3, 1) }} />} />
            <Draggable type={[DragDropType.a, DragDropType.b]}
                //onDraggableStateChange={(e) => console.log(e)}
            >
                {({ isActive, isDragging, isOverDropZone }) => (
                    <View
                        collapsable={false}
                        style={{
                            width: 50,
                            height: 50,
                            backgroundColor: cond(isOverDropZone, processColor('green'), processColor('black')),
                            borderRadius: 50,
                            opacity: cond(and(isDragging, isActive, not(isOverDropZone)), 0.3, 0.9)
                        }}
                    />
                )}

            </Draggable>
            <DropZone
                type={[DragDropType.a, DragDropType.b]}
            >
                <View
                    pointerEvents='none'
                    style={[StyleSheet.absoluteFill, { width: 50, height: 50, top: 400, left: 100, backgroundColor: 'pink', zIndex: 5000 }]}
                />
            </DropZone>
            <DropZone
                type={DragDropType.b}
                style={[StyleSheet.absoluteFill, { width: 50, height: 50, top: 400, left: 50, backgroundColor: 'blue' }]}
            />
            <DropZone
                type={DragDropType.a}
            >
                {({ isOverDropZone }) => <View
                    pointerEvents='none'
                    style={[
                        StyleSheet.absoluteFill,
                        { width: 50, height: 50, top: 300, left: 100, backgroundColor: 'pink' },
                        { opacity: interpolate(isOverDropZone, { inputRange: [0, 1], outputRange: [1, 0.2] }) }
                    ]}
                />}
            </DropZone>
            <DropZone
                type={DragDropType.a}
                //onLayout={(e) => console.log(e.nativeEvent)}
            >
                <View
                    pointerEvents='none'
                    style={[StyleSheet.absoluteFill, { width: 50, height: 50, top: 200, left: 100, backgroundColor: 'pink' }]}
                />
            </DropZone>
        </>
    );
};