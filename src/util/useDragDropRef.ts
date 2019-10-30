import { useEffect, useMemo, useRef } from "react";
import { useDragDropContext } from "./DragDropContext";

export default function useDragDropRef<T = any>(id: string) {
    const context = useDragDropContext();
    const ref = useRef<T>();
    useMemo(() => context.registerRef(id, ref), []);
    
    useEffect(() => {
        //if (ref.current && context.measure) context.measure(ref, console.log);
    })

    return ref;
}