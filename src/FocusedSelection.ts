import { FieldLenses, NotAnArray, UnfocusedLens } from 'immutable-lens'

import { ComputedState } from './ComputedState'

export interface FocusedSelection<Type extends {
   state: object & NotAnArray
   computedValues: object
}, Selection> {
   (lens: UnfocusedLens<ComputedState<Type>>): FieldLenses<ComputedState<Type>, Selection>, // TODO Allow ReadonlyLens
}
