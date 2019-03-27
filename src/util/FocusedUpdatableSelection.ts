import { FieldLenses, PlainObject, UnfocusedLens } from 'immutable-lens'

export type FocusedUpdatableSelection<
   Type extends {
      state: PlainObject
      readonlyValues: object
   },
   Selection
> = (
   lens: UnfocusedLens<Type['state']>
) => FieldLenses<Type['state'], Selection>
