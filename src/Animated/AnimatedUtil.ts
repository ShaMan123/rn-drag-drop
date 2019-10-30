import * as _ from 'lodash';
import { useMemo } from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { abs, block, clockRunning, cond, debug, divide, eq, max as maxOp, min as minOp, set, spring, SpringUtils, startClock, stopClock, Value, diffClamp, sqrt, add, pow, timing, call, Clock, onChange, diff, proc, or } from './Animated';
import { Map } from '../Types';

type AnimatedVal = string | number | boolean | undefined;
type OperatorEval = () => Animated.Adaptable<AnimatedVal>

export function useValue<T extends AnimatedVal | OperatorEval>(value: T, deps: ReadonlyArray<any> = []) {
    return useMemo(() => {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined") return new Animated.Value<T>(value);
        else if (typeof value === "function") return value();
        else throw new Error('useValue received invalid initial value');
    }, deps);
}

export function runSpring(
    clock: Animated.Clock,
    from: Animated.Adaptable<number>,
    to: Animated.Adaptable<number>,
    configuration: {
        velocity?: Animated.Adaptable<number>,
        config?: Animated.SpringConfig
    } = {}
) {
    const state: Animated.SpringState = {
        finished: new Value(0),
        velocity: new Value(0),
        position: new Value(0),
        time: new Value(0),
    };

    const config = configuration.config || SpringUtils.makeConfigFromOrigamiTensionAndFriction({
        ...SpringUtils.makeDefaultConfig(),
        tension: 68,
        friction: 12,
    });

    return block([
        cond(clockRunning(clock), 0, [
            set(state.finished, 0),
            set(state.time, 0),
            set(state.position, from),
            set(state.velocity, configuration.velocity || 0),//diffClamp(velocity, -2, 2)
            set(config.toValue as Animated.Value<number>, to),
            startClock(clock),
        ]),
        spring(clock, state, config),
        cond(state.finished, debug('stop clock', stopClock(clock))),
        state.position,
    ]);
}

export function springBack(...values: [Animated.Value<number>, Animated.Adaptable<number>][]) {
    const clocks = _.map(values, () => new Clock());

    return [
        block(_.map(values, ([from, toValue], i) => set(from, runSpring(clocks[i], from, toValue)))),
        safeArrayOperator(or, _.map(clocks, clockRunning))
    ] as [Animated.Node<number>, Animated.Node<0 | 1>];
}

export function runTiming(
    clock: Animated.Clock,
    from: Animated.Adaptable<number>,
    to: Animated.Adaptable<number>,
    configuration: Partial<Pick<Animated.TimingConfig, 'duration' | 'easing'>> = {}
) {
    const state: Animated.TimingState = {
        finished: new Value(0),
        position: new Value(0),
        time: new Value(0),
        frameTime: new Value(0),
    };

    const config = {
        duration: 500,
        toValue: new Value(0),
        easing: Easing.linear,
        ...configuration
    };

    return block([
        cond(clockRunning(clock), [
            // if the clock is already running we update the toValue, in case a new dest has been passed in
            set(config.toValue, to),
        ], [
                // if the clock isn't running we reset all the animation params and start the clock
                set(state.finished, 0),
                set(state.time, 0),
                set(state.position, from),
                set(state.frameTime, 0),
                set(config.toValue, to),
                startClock(clock),
            ]),
        // we run the step here that is going to update position
        timing(clock, state, config),
        // if the animation is over we stop the clock
        cond(state.finished, debug('stop clock', stopClock(clock))),
        // we made the block return the updated position
        state.position,
    ]);
}

export function sign(node: Animated.Adaptable<number>) {
    return cond(eq(node, 0), 0, divide(node, abs(node)));
}

export function clamp(value: Animated.Adaptable<number>, lower: Animated.Adaptable<number>, upper: Animated.Adaptable<number>) {
    return minOp(maxOp(value, lower), upper);
}

export function hypot(...values: Animated.Adaptable<number>[]) {
    return sqrt(_.reduce<Animated.Adaptable<number>, Animated.Adaptable<number>>(values, (acc, curr) => add(acc, pow(curr, 2)), 0));
}

type Collection<T> = Map<T> | Array<T>;
type Iterator<T, TResult, TCollection extends Collection<T>> = TCollection extends T[] ? (value: T, index: number, collection: Array<T>) => TResult : (value: T, key: keyof TCollection, collection: Map<T>) => TResult;

function reduce<T, TResult extends Animated.Node<0 | 1>, TCollection extends Collection<T>, TIterator extends Iterator<T, TResult, Collection<T>>>(
    collection: TCollection,
    iterator: TIterator,
    extractor: TIterator,
    notFound: Animated.Node<number> = new Value()
) {
    return _.reduce(collection, (chain, value, k, list) => {
        return cond(
            iterator(value, k, list),
            extractor(value, k, list),
            chain
        );
    }, notFound)
}

export function nth(array: Animated.Adaptable<number>[], index: Animated.Adaptable<number>) {
    return reduce(array, (value, index) => eq(index, i), (value, index) => value);
}

export function get<T>(object: Map<T>, iterator: Iterator<T, Animated.Node<0 | 1>, Map<T>>) {
    return reduce(object, iterator, (value) => value);
}

export function findKey<T>(object: Map<T>, iterator: Iterator<T, Animated.Node<0|1>,Map<T>>) {
    return reduce(object, iterator, (value, key) => key);
}

export function findIndex(array: Animated.Adaptable<number>[], value: Animated.Adaptable<number>) {
    return reduce(array, (val, index) => eq(value, val), (value, index) => index);
}

/**
 * reanimated lodash style operator that takes an operator and safely runs it on an array
 * @param operator reanimated operator, e.g or(...values)
 * @param values
 */
export function safeArrayOperator<T, R = number>(operator: (...values: Animated.Adaptable<T>[]) => Animated.Node<R>, values: Animated.Adaptable<T>[]) {
    switch (values.length) {
        case 0: return 0;
        case 1: return values[0];
        default: return operator(...values);
    }
};

export function delay(value: Animated.Node<number>, duration: Animated.Adaptable<number>) {
    const clock = new Clock();
    const timer = new Value(0);
    const state = new Value(0);

    return block([
        set(
            timer,
            runTiming(clock, 0, 1, { duration })
        ),
        cond(
            eq(timer, 1),
            [
                set(timer, 0),
                set(state, 1)
            ]
        ),
        cond(timer, value)
    ]);
}

/**
 * evalutes node after duration has passed only if state has been preserved
 * @param node to evaluate after duration
 * @param value to monitor while delaying
 * @param duration in ms
 */
export function eqWhile(value: Animated.Node<number>, duration: Animated.Adaptable<number>) {
    const clock = new Clock();
    const timer = new Value(0);
    const runTimer = new Value(0);
    const state = new Value(0);

    return block([
        onChange(
            eq(diff(value), 0),
            [
                set(runTimer, 1),
                stopClock(clock),
                set(state, 0)
            ]
        ),
        set(
            timer,
            cond(
                runTimer,
                runTiming(clock, 0, 1, { duration }),
                0
            )
        ),
        cond(
            eq(timer, 1),
            [
                set(runTimer, 0),
                set(state, 1)
            ]
        ),
        state
    ]);
}