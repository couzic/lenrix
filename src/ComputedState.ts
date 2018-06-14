import { NotAnArray } from 'immutable-lens'

export type ComputedState<
   Type extends {
      state: object & NotAnArray
      computedValues: object
   }
> = Type['state'] & Type['computedValues']
