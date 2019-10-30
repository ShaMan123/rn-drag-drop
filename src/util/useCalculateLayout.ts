import { call, cond, not, onChange, useCode } from 'animated';
import { DragDropContextT, useDragDropContext } from "./DragDropContext";
import { DraggableContext } from "../Types";

/**
 * calculate layout once draggable has been released
 * meaaning once it beome inactive
 * @param draggable
 */
export function useCalculateLayoutForDraggable<T>(draggable: string | DraggableContext<T>) {
    const context = useDragDropContext();
    const { isActive, __type } = typeof draggable === 'string' ? context.getDraggable(draggable) : draggable;
    useCode(
        onChange(
            isActive, 
            cond(
                not(isActive),
                call([isActive], () => context.recalculateLayout(__type))
                )
            ),
        [isActive, __type]
    );
}

/**
 * calculate layout once draggable has been released
 * meaning once lastTag changes
 * @param context
 */
export function useCalculateLayout(context: DragDropContextT) {
    const { currentDraggable: { lastTag } } = context;
    useCode(
        onChange(
            lastTag,
            call([lastTag], ([d]) => {
                try {
                    if (!context.autoRecalc) return;
                    const draggable = context.safeGetDraggable(d);
                    context.recalculateLayout(draggable.__type);
                }
                catch (error) {
                    __DEV__ && console.error(error);
                }
            })
        ),
        [lastTag, context]
    );
}