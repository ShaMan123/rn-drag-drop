import * as _ from "lodash";
import { State } from "react-native-gesture-handler";
import Animated, { and, greaterOrEq, lessOrEq, eq, or, proc, safeArrayOperator } from 'animated';
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    overflow: {
        overflow: 'visible'
    },
    default: {
        flex: 1
    }
});

export const DEAFULT_HOVER_DURATION = 1500;