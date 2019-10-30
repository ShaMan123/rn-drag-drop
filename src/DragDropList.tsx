import * as _ from 'lodash';
import React, { PropsWithChildren, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FlatList as RNFlatList, FlatListProps, I18nManager, ListRenderItem, ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent, SectionList, SectionListProps, SectionListRenderItem, SectionListRenderItemInfo, StyleSheet, ViewToken, processColor, UIManager, findNodeHandle, SectionListStatic } from 'react-native';
import { FlatList, GestureHandlerStateChangeNativeEvent, State } from 'react-native-gesture-handler';
import { Clock, event, multiply, useValue, View, useCode, greaterThan, cond, block, neq, call, onChange } from 'src/Animated';
import { useFirstChild } from './Common';
import { useDragDropContext } from './DragDropContext';
import { DraggablePropsUnderHood } from './DraggableHooks';
import { DropZonePropsUnderHood } from './DropZoneHooks';
import { DraggableStateChangeEvent, OffsetRect, WithId, DraggableStateChangeEventCallback, DraggableDesignatedProps, DraggableState } from './Types';


type ListT<T = any> = FlatList<T> | RNFlatList<T> | SectionList<T>;
type ListProps<T, L extends ListT<T> = FlatList<T>> = L extends SectionList<T> ? SectionListProps<T> : FlatListProps<T>;
type ListItemInfo<T, L extends ListT<T> = SectionList<T>> = L extends SectionList<any> ? SectionListRenderItemInfo<T> : ListRenderItemInfo<T>;
type RenderListItem<T, L extends ListT<T> = SectionList<T>> = L extends SectionList<any> ? SectionListRenderItem<T> : ListRenderItem<T>;

export type DragDropListStateChangeEventCallback<T, L extends ListT<T>> = (draggableInfo: ListItemInfo<T, L> | null, dropZoneInfo: ListItemInfo<T, L> | null) => (any | void);

interface ItemContextT<T, L extends ListT<T>> {
    changeItemPosition: DragDropListStateChangeEventCallback<T, L>,
    animateNextTransition: () => void,
    renderItem: (info: ListItemInfo<T, L>) => React.ReactNode,
    listId: string,
    offsets: OffsetRect
}

type DragDropListProps<T, L extends ListT<T> = FlatList<T>> = PropsWithChildren<{
    /**
     * Performance Tip:
     * use this callback only to render stuff,
     * styling should be done with reanimated mechanism
     * */
    onDragDropStateChange?: DragDropListStateChangeEventCallback<T, L>,

    /**
     * duration in ms after which a Draggable is considered as hovering over a DropZone
     * */
    hoverDuration?: number
}>;

function useItemData<T, L extends ListT<T>, I extends ListItemInfo<T, L>>(info: I, listId: string) {
    const finalData = useMemo(() => _.assign({}, info, { listId }), [info, listId]);
    const dataRef = useRef<I>(finalData);

    useEffect(() => {
        dataRef.current = finalData;
    }, [finalData]);

    return dataRef;
}

export function useItemDraggable<T, L extends ListT<T>, I extends ListItemInfo<T, L>>(info: I, dragDropListContext: ItemContextT<T, L>) {
    const data = useItemData(info, dragDropListContext.listId);
    return useMemo(() => {
        return {
            data,
            onDrop: false
        }
    }, [data]);
}

export function useItemDropZone<T, L extends ListT<T>, I extends ListItemInfo<T, L>, TRef extends React.MutableRefObject<I | any>>(dropZoneInfo: ListItemInfo<T, L>, dragDropListContext: ItemContextT<T, L>) {
    const { animateNextTransition, changeItemPosition, listId } = dragDropListContext;
    const data = useItemData(dropZoneInfo, listId);
    
    const onDraggableStateChange = useCallback<DraggableStateChangeEventCallback<TRef, TRef>>(({ draggable, dropZone, state }) => {
        //if (state === DraggableState.ACTIVE) pipRef.current = ref.current;
        if (state === DraggableState.HOVERING) {
            const draggableInfo = _.get(draggable.data, 'current', draggable.data);
            if (_.has(draggable.data, 'current.index') && draggableInfo.index === dropZoneInfo.index) return;
            animateNextTransition();
            changeItemPosition(draggableInfo, dropZoneInfo);
        }
        
    }, [dropZoneInfo, animateNextTransition, changeItemPosition]);
    /*
    const onEnter = useCallback<DropZoneCallback<React.MutableRefObject<I | any>>>((data) => {
        const draggableInfo = _.get(data, 'current', data);
        if (_.has(data, 'current.index') && draggableInfo.index === dropZoneInfo.index) return;
        if (!renderGhost) return;
        animateNextTransition();
        renderGhost(draggableInfo, dropZoneInfo);
    }, [dropZoneInfo, animateNextTransition, renderGhost]);

    const onExit = useCallback<DropZoneCallback<React.MutableRefObject<I | any>>>((data) => {
        if (!renderGhost) return;
        animateNextTransition();
        renderGhost(null, dropZoneInfo);
    }, [dropZoneInfo, animateNextTransition, renderGhost]);
    */
    return useMemo<Partial<DraggableDesignatedProps<TRef>>>(() => ({
        data,
        onDraggableStateChange,
        //enabled: false
    }), [onDraggableStateChange]);
}

function useScrollOffset({ horizontal, inverted }: Pick<ListProps<any, any>, 'inverted' | 'horizontal'>) {
    const scrollX = useValue(0);
    const scrollY = useValue(0);
    const offsetX = useMemo(() => multiply(scrollX, -1), [scrollX]);
    const offsetY = useMemo(() => multiply(scrollY, -1), [scrollY]);
    const onScroll = useMemo(() =>
        event<NativeSyntheticEvent<NativeScrollEvent>>([{
            nativeEvent: {
                contentOffset: {
                    x: scrollX,
                    y: scrollY
                }
            }
        }]),
        [scrollX, scrollY]
    );

    const offsets = useMemo(() => {
        if (horizontal) {
            const fromLeft = !I18nManager.isRTL && !inverted || I18nManager.isRTL && inverted;

            const h: Partial<OffsetRect> = fromLeft ?
                { left: offsetX } :
                { right: offsetX };

            return h
        }
        else {
            const v: Partial<OffsetRect> = inverted ?
                { bottom: offsetY } :
                { top: offsetY };

            return v;
        }
    }, [horizontal, inverted]);

    const startOffset = useValue(0);
    const offset = useValue(0);
    /*
    useCode(
        onChange(
            context.currentDraggable,
            [
                call([context.currentDraggable], ([dg]) => {
                    const draggable = dg === -1 ? null : context.safeGetDraggable(dg).data;
                    //setRR(_.get(draggable, 'current', null))

                }),
                set(startOffset, scrollY),
                set(offset, 0),
            ]),

        [context.currentDraggable]
    );
    */

    const value = { scrollX, scrollY };

    return [value, offsets, onScroll] as [typeof value, Partial<OffsetRect>, typeof onScroll];

}

function DragDropItem<T, L extends ListT<T>>(props: ListItemInfo<T, L> & { context: ItemContextT<T, L> }) {
    //@ts-ignore
    const { context, ...info } = props;
    const draggableProps = useItemDraggable(info, context);
    const dropZoneProps = useItemDropZone(info, context);
    return (
        <DraggablePropsUnderHood.Provider value={draggableProps}>
            <DropZonePropsUnderHood.Provider value={dropZoneProps}>
                {context.renderItem(info as ListItemInfo<T, L>)}
            </DropZonePropsUnderHood.Provider>
        </DraggablePropsUnderHood.Provider>
    );
}
const pipRef = React.createRef();
function PipDrag({ renderItem, ref }) {
    const [rr, setRR] = useState(null)
    console.log('gggggggg', _.get(rr, 'item'))
    const context = useDragDropContext();
    const { currentDraggable, currentDropZone } = context;

    const safeGetData = useCallback((id, type: 'Draggable' | 'DropZone') => {
        const dd = id === -1 ? null : context.safeGetDraggable(id);
        return dd ? _.get(dd.data, 'current', dd.data) as ListItemInfo<T, SectionList<T>> : null;
    }, [context]);

    useCode(
        block([
            call([currentDraggable.tag, currentDraggable.isHovering], ([t, isH]) => {
                //if (!isH) return;
                const d = safeGetData(t, 'Draggable');
                //if (!d) return;
                console.log(d);
                context.pip(ref)
                setRR(d);
            })
        ]),
        [currentDraggable.tag, currentDraggable.isHovering, safeGetData, setRR]
    );

    return (
        <View
            style={[
                StyleSheet.absoluteFill, {
                    transform: [
                        { translateX: currentDraggable.translateX },
                        { translateY: currentDraggable.translateY }
                    ]
                }
            ]}
            pointerEvents="none"
            ref={ref}
            collapsable={false}
        >
            {rr && renderItem(rr)}
        </View>
    );
}

/**
 * Performance Tip:
 * If you're Draggables & DropZones are all children of DragDropList,
 * meaning you won't interact with views outside a DragDropList,
 * wrap your component/s with 
 *      <DragDropProvider disableAutoRecalculation>
 *          ...
 *      </DragDropProvider>
 * 
 * If not pass a shared, unique `type` to the Draggables & DropZones that you need to interact with
 * to inhance performance
 * @param props
 */
function DragDropList<T, L extends ListT<T> = FlatList<T>>({ onDragDropStateChange, hoverDuration, children }: DragDropListProps<T, L>, ref: React.Ref<any>) {
    const context = useDragDropContext();
    const { currentDraggable, currentDropZone } = context;

    const listRef = useRef();
    useImperativeHandle(ref, () => listRef as React.Ref<L|null>);

    const list = useFirstChild({ children });
    const { renderItem: renderItemProp, onViewableItemsChanged, horizontal, inverted, data, sections } = list.props as unknown as ListProps<T, SectionList<T>>;
    const listId = useMemo(() => _.uniqueId('DragDropList'), []);

    const [{ scrollY }, offsets, onScroll] = useScrollOffset({ horizontal, inverted });

    const listContext = useMemo(() => (
        {
            renderItem: renderItemProp,
            changeItemPosition: onDragDropStateChange,
            animateNextTransition: context.animateNextTransition,
            listId,
            offsets,
        } as ItemContextT<T, L>
    ),
        [renderItemProp, onDragDropStateChange, context.animateNextTransition, listId]
    );

    const renderItem = useCallback((info: ListItemInfo<T, L>) => {
        /*
        const ref = React.createRef();
        map.set(info.item, ref);*/
        return <DragDropItem {...info} context={listContext} />
    } , [listContext]);
    
    const isFirstCall = useRef(true);
    const getViewableItems = useCallback(
        (info: { changed: ViewToken[], viewableItems: ViewToken[] }) => {
            const dropZoneInfo = _.compact(_.map(context.dropZones, ({ data, id }) => {
                const o = _.get(data, 'current');
                const belongsToList = _.get(o, 'listId') === listId;
                if (belongsToList && isFirstCall.current) context.__setEnabled(id, false);
                return belongsToList && _.assign({}, o, { id }) as WithId<ListItemInfo<T, L>>;
            }));
            const intersection = _.intersectionWith(dropZoneInfo, _.concat(info.changed, info.viewableItems), (data: WithId<ListItemInfo<T, L>>, viewToken: ViewToken) => {
                const same = _.isEqualWith(data, viewToken, (o1, o2) => _.isEqual(_.pick(o1, 'index', 'item'), _.pick(o2, 'index', 'item')));
                if (same) context.__setEnabled(data.id, viewToken.isViewable);
                if (!viewToken.isViewable) {
                    //measure existing dropZone or disable it
                }
                return same;
            });
            if (isFirstCall.current) {
                isFirstCall.current = false;
            }
            //console.log(_.map(context.dropZones, ({ data, id, enabled }) => ({ enabled, id })));
            onViewableItemsChanged && onViewableItemsChanged(info);
        },
        [context, listId, isFirstCall]
    );
    /*
    const measureViewableItems = useCallback((type: number) => {
        _.forEach(itemsToMeasure.current, (id) => {
            const dropZone = context.getDropZone(id);
            dropZone.type === type && dropZone.measure();
        });
    }, [itemsToMeasure, context])
    */
    
    //const diffTracker = useMemo(() => neq(diff(context.currentDropZone), 0), [context.currentDropZone])
    //const diffTracker = useMemo(() => eq(diff(context.currentDropZone), 0), [context.currentDropZone])
    const timeTracker = useValue(0);
    const clock = useMemo(() => new Clock(), []);
    const runBlock = useValue(0);
    /*
    const [i, s] = useState(0);
    useEffect(() => {
        const ity=setInterval(() => {
            console.log(i)
            listRef.current && listRef.current.scrollToIndex({ index:i, animated: true, viewOffset: 0, });
            listRef.current && s(i === 19 ? 0 : i + 1);
        },1000)
        return ()=>clearInterval(ity)
    }, [listRef, i])
    */

    const safeGetData = useCallback((id, type: 'Draggable' | 'DropZone') => {
        const dd = id === -1 ? null : context.safeGetDraggable(id);
        return dd ? _.get(dd.data, 'current', dd.data) as ListItemInfo<T, SectionList<T>> : null;
    }, [context]);
    /*
    const hover = useCallback((dragId: number, dropId: number) => {
        if (!onHover) return;
        try {
            const draggableData = safeGetData(dragId, 'Draggable');
            const dropZoneData = safeGetData(dropId, 'DropZone');
            context.animateNextTransition();
            //_.has(dropZoneData,'index') && listRef.current && listRef.current.getNode().scrollToIndex({ index: dropZoneData.index, animated: false, viewOffset: 300, });
            UIManager.measureLayout(a, findNodeHandle(listRef.current), console.warn, console.log)
            //setTimeout(() => draggableData && context.recalculateLayout(draggable.__type));
        }
        catch (error) {
            __DEV__ && console.error(error);
        }
    }, [context.animateNextTransition, listRef]);
    */
    

    
    /*
    const { onScrollAnimationEnd, onscro } = list.props as ListProps<T, L>
    const measureOnScrollEnd = useCallback(() => context.recalculateLayout(), [context.recalculateLayout]);
    const onScrollAnimationEnd = useCallback(() => {
        measureOnScrollEnd();
        props.
    }, [list.props])*/
    /*
    useLayoutEffect(() => {
        setInterval(() => listRef.current && listRef.current.getNode().scrollToIndex({ index: 10, animated: true, viewOffset: 300, }), 2000)
    })
    */
    const onHandlerStateChange = useCallback((e: GestureHandlerStateChangeNativeEvent) => {
        (e.oldState === State.ACTIVE) && context.recalculateLayout();
    }, [context.recalculateLayout]);
    
    return (
        <>
            {
                React.cloneElement<ListProps<T, L>>(list, {
                    renderItem,
                    ref: listRef,
                    onScrollToIndexFailed: console.log,
                    onScroll,
                    onHandlerStateChange,
                    scrollEventThrottle: 1,
                    style: { borderColor: cond(greaterThan(scrollY, 0), processColor('blue')), borderWidth: 5 },
                    //viewabilityConfigCallbackPairs: [{ viewabilityConfig: { viewAreaCoveragePercentThreshold: 1, minimumViewTime: 20 }, onViewableItemsChanged: getViewableItems}]
                })
            }
            {false && <PipDrag renderItem={renderItem} />}
        </>
    );
};


const ForwardedDragDropList = React.forwardRef(DragDropList);

ForwardedDragDropList.defaultProps = {
    hoverDuration: 1500
} as DragDropListProps<any>;

ForwardedDragDropList.displayName = 'DragDropList';

export default ForwardedDragDropList;