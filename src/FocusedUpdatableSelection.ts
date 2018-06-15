import { FieldLenses, NotAnArray, UnfocusedLens } from 'immutable-lens'

export type FocusedUpdatableSelection<
   Type extends {
      state: object & NotAnArray
      computedValues: object
   },
   Selection
> = (
   lens: UnfocusedLens<Type['state']>
) => FieldLenses<Type['state'], Selection>
