import * as _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
/*
export function useRemount(deps?: any[]) {
    const [key, setKey] = useState(_.uniqueId('DragDropTransitioningView'));

    useEffect(() => {
        setTimeout(() => setKey(_.uniqueId()), 50);
    }, deps);

    return key;
}
*/