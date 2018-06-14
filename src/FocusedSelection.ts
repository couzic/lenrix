import { FieldLenses, NotAnArray, UnfocusedLens } from 'immutable-lens'

import { ComputedState } from './ComputedState'

export type FocusedSelection<
   Type extends {
      state: object & NotAnArray
      computedValues: object
   },
   Selection
> = (
   lens: UnfocusedLens<ComputedState<Type>>
) => FieldLenses<ComputedState<Type>, Selection>
