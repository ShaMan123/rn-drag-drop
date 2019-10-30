import * as _ from "lodash";
import { useEffect, useMemo } from "react";
import { block, call, delay, set, useCode, Value } from 'animated';
import { useDragDropContext } from "./DragDropContext";
import { DraggableDesignatedProps, DropZoneDesignatedProps, Required } from "../Types";

export default function useUpdateContext<T, P extends DraggableDesignatedProps<T> | DropZoneDesignatedProps<T>>(id: string, props: P) {
    const context = useDragDropContext();
    const { data, type: typeProp, dragEnabled, dropEnabled, onDraggableStateChange } = props as Required<DraggableDesignatedProps<T> & DropZoneDesignatedProps<T>>;
    const { isEnabled } = context.getFromId(id);

    const value = useMemo(() => {
        const enabled = dragEnabled || dropEnabled;
        if (typeof enabled === 'boolean') {
            context.__setEnabled(id, enabled);
            //isEnabled.setValue(enabled ? 1 : 0);
            return enabled ? 1 : 0
        }
        else {
            return enabled;
        }
    }, [dragEnabled, dropEnabled, context, id]);

    //@to-do seems not to work
    useCode(
        block([
            delay(set(isEnabled, 1), 1500),
            delay(set(isEnabled, 0), 1000),
            call([isEnabled], ([enabled]) => {
                context.__setEnabled(id, enabled === 1);
                //console.log('enabled?',enabled===1)
            })
        ]),
        [isEnabled, value, context, id]
    );

    const consumedType = useMemo(() => {
        const consumedArr = _.map(_.isArray(typeProp) ? typeProp : [typeProp],
            (t) => {
                if (t instanceof Value) return t;
                else {
                    if (__DEV__ && !_.isFinite(t)) console.warn(`DragDrop: invalid type value ${t}`, id);
                    return new Value(_.isFinite(t) ? t : -1);
                }
            });
        context.setType(id, consumedArr);
        return consumedArr;
    }, [id, typeProp]);

    useCode(
        call(consumedType, (c) => context.__setType(id, c as number[])),
        [consumedType, typeProp, context, id]
    );

    useEffect(() => {
        context.setData(id, data);
    }, [id, data]);

    useEffect(() => {
        context.registerCallback(id, 'onDraggableStateChange', onDraggableStateChange);
    }, [id, onDraggableStateChange]);

    useEffect(() => () => {
        context.unregister(id);
    }, [id]);
}
