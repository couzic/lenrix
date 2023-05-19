import { FieldLenses, UnfocusedLens } from 'immutable-lens'

export type FocusedUpdatableSelection<
   Type extends {
      state: object
      readonlyValues: object
   },
   Selection
> = (
   lens: UnfocusedLens<Type['state']>
) => FieldLenses<Type['state'], Selection>
