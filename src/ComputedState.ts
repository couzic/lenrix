import { PlainObject } from 'immutable-lens'

export type ComputedState<
   Type extends {
      state: PlainObject
      computedValues: object
   }
> = Type['state'] & Type['computedValues']
