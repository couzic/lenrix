import { FieldLenses, PlainObject, UnfocusedLens } from 'immutable-lens'

import { OutputState } from './OutputState'

export type FocusedReadonlySelection<
   Type extends {
      state: PlainObject
      readonlyValues: PlainObject
   },
   Selection
> = (
   lens: UnfocusedLens<{ [K in keyof OutputState<Type>]: OutputState<Type>[K] }>
) => FieldLenses<OutputState<Type>, Selection>
