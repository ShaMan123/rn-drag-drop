import React, { useCallback, useMemo } from "react";
import { LayoutChangeEvent, findNodeHandle, UIManager } from "react-native";
import { add, useCode } from 'animated';
import { useDragDropContext } from "./DragDropContext";
import { OffsetRect } from "../Types";
import useLayout from "./useLayout";
import setOffsetRect from "./setOffsetRect";
import _ from "lodash";
import { useStatusBarHeight } from "./useStatusBarHeight";

export default function useMeasureLayout(
    id: string,
    ref: React.MutableRefObject<any>,
    props: {
        onLayout?: (e: LayoutChangeEvent) => void,
        offsets?: Partial<OffsetRect>
    }
) {
    const context = useDragDropContext();
    const { offsetLeft, offsetTop, offsetRight, offsetBottom } = context.getDropZone(id);
    const [layout, setLayout] = useLayout();

    const measure = useCallback(() => {

        const handle = ref.current && findNodeHandle(ref.current);
        handle && UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
            if (_.some([width, height, pageX, pageY], _.isNil)) return;
            setLayout({ x: pageX, y: pageY, width, height });
        });

        //console.log(ref)
        //context.measure(ref, (x, y, width, height) => setLayout({ x, y, width, height }));
    }, [ref, setLayout, context.measure]);

    useMemo(() => context.registerCallback(id, 'measure', measure), [id, measure]);

    const statusBarHeight = useStatusBarHeight();

    useCode(setOffsetRect(id, props.offsets), [props.offsets]);

    const hitRect = useMemo(() => {
        const { x, y, width, height } = layout;
        return {
            left: add(offsetLeft, x),
            right: add(offsetRight, x, width),
            top: add(offsetTop, y, statusBarHeight),
            bottom: add(offsetBottom, y, height, statusBarHeight)
        }
    },
        [layout, statusBarHeight, offsetLeft, offsetTop, offsetRight, offsetBottom]
    );

    const onLayout = useCallback((e) => {
        measure();
        props.onLayout && props.onLayout(e);
    }, [measure, props.onLayout]);

    return [hitRect, onLayout] as [typeof hitRect, typeof onLayout];
}
