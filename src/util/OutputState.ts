import { PlainObject } from 'immutable-lens'

export type OutputState<
   Type extends {
      state: PlainObject
      readonlyValues: PlainObject
   }
> = Omit<Type['state'], keyof Type['readonlyValues']> & Type['readonlyValues']
