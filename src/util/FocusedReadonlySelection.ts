import { FieldLenses, PlainObject, UnfocusedLens } from 'immutable-lens'

import { ComputedState } from './ComputedState'

export type FocusedReadonlySelection<
   Type extends {
      state: PlainObject
      computedValues: PlainObject
   },
   Selection
> = (
   lens: UnfocusedLens<
      { [K in keyof ComputedState<Type>]: ComputedState<Type>[K] }
   >
) => FieldLenses<ComputedState<Type>, Selection>
