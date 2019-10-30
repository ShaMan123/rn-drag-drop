
import Animated, { Value, View } from 'animated';
import * as _ from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import { FlatListProperties, ListRenderItem } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { DragDropList, DragDropListStateChangeEventCallback, Draggable } from 'rn-drag-drop';
import { DragDropType } from './common';
import DraggableItem from './DraggableItem';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function FlatListExample() {
    const [items, setItems] = useState(_.map(new Array(20), (v, i) => i + 1));

    const listRef = useRef();

    const renderItem = useCallback<ListRenderItem<number>>((info) =>
        <DraggableItem
            {...info}
            listRef={listRef}
        />, [listRef]);

    const keyExtractor = useCallback<Required<FlatListProperties<number>>['keyExtractor']>((item, index) => item === -1 ? `ghost@${index}` : `@${item}`, []);
    
    const changeItemPosition = useCallback<DragDropListStateChangeEventCallback<number, any>>((from, to) => {
        /*
                     * swap
                    const nextItems = _.clone(items);
                    _.set(nextItems, from.index, to.item);
                    _.set(nextItems, to.index, from.item);
                    setItems(nextItems);
                    */
        const nextItems = _.clone(items);
        if (from.outsider) {
            nextItems.splice(to.index, 0, from.item);
        }
        else {
            _.remove(nextItems, (val, i) => i === from.index);
            nextItems.splice(to.index, 0, from.item);
        }

        _.pull(nextItems, -1);
        setItems(nextItems);
        
    }, [items]);

    const renderGhost = useCallback<DragDropListStateChangeEventCallback<number, any>>((draggable, dropZone) => {
        console.log('ghosty', draggable, dropZone)
        return
        const nextItems = _.clone(items);
        _.pull(nextItems, -1);
        if (dropZone) nextItems.splice(dropZone.index, 0, -1);
        setItems(nextItems);
    }, [items]);

    return (
        <>
            <Draggable
                type={DragDropType.a}
                style={{ width: 50, height: 50, backgroundColor: 'yellow', borderRadius: 50 }}
                data={useRef({
                    item: 'prio', outsider: true, key: 'prio'
                })}
                //onDrop={() => console.log('unmount')}
                key='@prio'
                dragEnabled={new Value(1)}
            />
            <DragDropList
                onDragDropStateChange={(a,b) => {
                    
                }}
                //onDrop={changeItemPosition}
                //onHover={renderGhost}
            >
                
                <AnimatedFlatList
                    style={[{ overflow: 'visible' }]}
                    contentContainerStyle={{ overflow: 'visible'/*, flexWrap: 'wrap', flexDirection: 'row'*/ }}
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    ref={listRef}
                    
                />
            </DragDropList>
            <View style={{flex:1}} />
        </>
    );
};
