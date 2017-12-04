import { NotAnArray } from 'immutable-lens'

import { MergedFields } from './MergedFields'

export type ComputedState<Type extends {
   state: object & NotAnArray
   computedValues: object
}> = MergedFields<Type['state'], Type['computedValues']>
