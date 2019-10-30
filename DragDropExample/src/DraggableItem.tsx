
import { cond, eq, proc, Text, View } from 'animated';
import React from 'react';
import { ListRenderItemInfo, processColor, StyleSheet } from 'react-native';
import { Draggable, DraggableState, DropZone } from 'rn-drag-drop';
import { DragDropType } from './common';

const dropZoneBGCP = proc((state) =>
    cond(
        eq(state, DraggableState.HOVERING),
        processColor('purple'),
        cond(
            eq(state, DraggableState.ENTERED),
            processColor('yellow'),
            cond(
                eq(state, DraggableState.ACTIVE),
                processColor('blue'),
                processColor('red')
            )
        )
    )
);

const draggableBGCP = proc((isOverDropZone) => cond(isOverDropZone, processColor('green'), processColor('transparent')));

const borderWidthP = proc((isOverDropZone) => cond(isOverDropZone, 10, 2));

const opacityProc = proc((state) => cond(eq(state, DraggableState.DRAGGING), 0.3, 0.9));

const translateP = proc((isDragging) => cond(isDragging, -50, 0));


export default function DraggableItem<T extends number>({ item, index, separators, listRef }: ListRenderItemInfo<T> & { listRef: React.MutableRefObject<any>}) {
    if (item === -1) {
        return (
            <View
                collapsable={false}
                style={{
                    width: 50,
                    height: 50,
                    backgroundColor: 'grey',
                    borderRadius: 50,
                    opacity: 0.3
                }}
            />
        );
    };

    return (
        <View collapsable={false} pointerEvents="box-none">
            <DropZone
                //onEnter={(...a)=>console.log('oneneter',a)}
                type={item % 2 === 0 ? DragDropType.a : DragDropType.b}
            >
                {
                    ({ isOverDropZone, id }) => {
                        return (
                            <View
                                pointerEvents="none"
                                style={[
                                    StyleSheet.absoluteFill, {
                                        backgroundColor: draggableBGCP(isOverDropZone),
                                        borderColor: 'pink',
                                        borderWidth: borderWidthP(isOverDropZone),
                                    }
                                ]}
                                collapsable={false}
                            >
                                <Text>{item}</Text>
                            </View>
                        );
                    }
                }
            </DropZone>
            <View style={{ height: 50 }} collapsable={false} />
            <Draggable
                type={item % 2 === 0 ? [DragDropType.a, DragDropType.b] : DragDropType.b}
                simultaneousHandlers={listRef}
                waitFor={listRef}
            >
                {({ isActive, isDragging, isOverDropZone, id, state }) => {
                    return (
                        <View
                            collapsable={false}
                            style={[styles.dropZone, {
                                backgroundColor: dropZoneBGCP(state),
                                opacity: opacityProc(state),
                                transform: [{ translateX: translateP(isDragging) }, { translateY: translateP(isDragging) }, { perspective: 1000 }]
                            }]}
                        >
                            <Text>{item}</Text>
                        </View>
                    )
                }}
            </Draggable>
        </View>
    );
}



const styles = StyleSheet.create({
    dropZone: {
        width: 50,
        height: 50,
        borderRadius: 50,
    }
})