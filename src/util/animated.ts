import * as _ from "lodash";
import { State } from "react-native-gesture-handler";
import Animated, { and, block, eq, greaterOrEq, lessOrEq, or, proc, safeArrayOperator, set } from 'animated';
import { OffsetRect } from "../Types";

export function isSameType<T extends number, I extends T | T[]>(
    a: I,
    b: I,
    comparator: _.Comparator2<T, T> = _.isEqual
) {
    const consumedA = _.isArray(a) ? a : [a];
    const consumedB = _.isArray(b) ? b : [b];
    return _.size(_.intersectionWith(consumedA, consumedB, comparator)) > 0;
}

export function isSameAnimatedType<T extends Animated.Adaptable<number>, I extends T | T[]>(
    a: I,
    b: I,
    comparator: (a: T, b: T) => Animated.Node<0 | 1> = eq
) {
    const consumedA = _.isArray(a) ? a : [a];
    const consumedB = _.isArray(b) ? b : [b];
    return safeArrayOperator(or, _.flatten(_.map(consumedA, (A) => _.map(consumedB, (B) => comparator(A, B)))));
}

export const isStateActive = proc((state) => or(eq(state, State.BEGAN), eq(state, State.ACTIVE)));
//export const stateDidBegin = proc((state, oldState) => and(eq(oldState, State.BEGAN), eq(state, State.ACTIVE)));
//export const stateDidActivate = proc((state, oldState) => and(eq(oldState, State.BEGAN), eq(state, State.ACTIVE)));
//export const stateDidNotActivate = proc((state, oldState) => and(eq(oldState, State.BEGAN), neq(state, State.ACTIVE)));

export const isInRect = proc((x, y, left, top, right, bottom) => and(
    greaterOrEq(x, left),
    lessOrEq(x, right),
    greaterOrEq(y, top),
    lessOrEq(y, bottom)
));

export function setRect(rectToUpdate: OffsetRect<Animated.Value<number>>, sourceRect: OffsetRect){
    return block(_.map(rectToUpdate, (value, key) => set(value, sourceRect[key])));
}