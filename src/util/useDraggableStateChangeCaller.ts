import * as _ from "lodash";
import { useCallback } from "react";
import { block, call, onChange, proc, set, useCode } from 'animated';
import { DragDropContextT } from "./DragDropContext";
import { DraggableState, DraggableStateChangeEvent } from "../Types";

export default function useDraggableStateChangeCaller<T>(context: DragDropContextT) {
    const { currentDraggable, currentDropZone } = context;
    const callback = useCallback(([drag, lastDrag, drop, lastDrop, state]: ReadonlyArray<number>) => {
        let dragId = drag === -1 ? lastDrag : drag;
        let dropId = -1;
        let invokeDragCallback = false;
        let invokeDropCallback = false;
        switch (state) {
            case DraggableState.ACTIVE:
            case DraggableState.INACTIVE:
                dropId = -1;
                break;
            case DraggableState.DRAGGING:
            case DraggableState.ENTERED:
            case DraggableState.HOVERING:
                dropId = drop;
                break;
            case DraggableState.EXITED:
            case DraggableState.DROPPED:
                dropId = lastDrop;
                break;
        }

        try {
            const draggable = dragId !== -1 ? context.safeGetDraggable(dragId) : null;
            const dropZone = dropId !== -1 ? context.safeGetDropZone(dropId) : null;

            switch (state) {
                case DraggableState.ACTIVE:
                case DraggableState.INACTIVE:
                    invokeDragCallback = true;
                    break;
                case DraggableState.DRAGGING:
                case DraggableState.ENTERED:
                case DraggableState.HOVERING:
                case DraggableState.EXITED:
                case DraggableState.DROPPED:
                    invokeDragCallback = (draggable && dropZone) ? context.isSameType(draggable.__type, dropZone.__type) : false;
                    invokeDropCallback = true;
                    break;
            }

            if (invokeDragCallback && draggable) {
                const data: DraggableStateChangeEvent<T, T> = {
                    draggable: _.pick(draggable, 'id', 'data'),
                    dropZone: _.pick(dropZone, 'id', 'data'),
                    state
                };
                _.invoke(draggable, 'onDraggableStateChange', data);
            }
        }
        catch (error) {
            __DEV__ && console.error(error);
        }
    }, [context]);

    //const tempState = useValue(DraggableState.INACTIVE);
    //set(tempState, ff(currentDraggable.tag,currentDropZone.tag, currentDraggable.state, tempState)),
    useCode(
        block([

            onChange(
                currentDraggable.state,
                call([
                    currentDraggable.tag,
                    currentDraggable.lastTag,
                    currentDropZone.tag,
                    currentDropZone.lastTag,
                    currentDraggable.state,
                ], callback)
            )
        ]),
        [
            currentDraggable.tag,
            currentDraggable.lastTag,
            currentDropZone.tag,
            currentDropZone.lastTag,
            currentDraggable.state,
        ]
    );
}
/*
const ff = proc((dragTag, dropT, dragState, value) => block([
    onChange(dragState, set(value, dragState)),
    onChange(dragTag, set(value, DraggableState.INACTIVE)),
    onChange(dropT, set(value, DraggableState.INACTIVE)),
    value
]));
*/