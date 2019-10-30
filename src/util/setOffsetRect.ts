import * as _ from "lodash";
import { useDragDropContext } from "./DragDropContext";
import { OffsetRect } from "../Types";
import { setRect } from "./animated";
import { useCode } from "src/Animated";

export default function setOffsetRect(
    id: string,
    offsets: Partial<OffsetRect> = {}
) {
    const context = useDragDropContext();
    const { offsetLeft, offsetTop, offsetRight, offsetBottom } = context.getDropZone(id);
    return setRect(
        {
            left: offsetLeft,
            top: offsetTop,
            right: offsetRight,
            bottom: offsetBottom
        },
        _.defaultsDeep(offsets, { left: 0, top: 0, right: 0, bottom: 0 })
    );
}