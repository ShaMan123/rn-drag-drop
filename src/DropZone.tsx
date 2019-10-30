import React from "react";
import { useDropZone, useDropZoneProps, useNode, useRegisterDropZone } from "./DropZoneHooks";
import { DropZoneProps, Map } from "./Types";

function DropZone<T extends Map>(rawProps: DropZoneProps<T>) {
    const id = useRegisterDropZone();
    const finalProps = useDropZoneProps(id, rawProps);
    const node = useNode(id, rawProps);
    const passProps = useDropZone(id, finalProps);

    return React.cloneElement(node, passProps);
}

DropZone.defaultProps = {
    dropEnabled: true
} as Partial<DropZoneProps<Map>>;

export default DropZone;