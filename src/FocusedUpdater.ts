import { NotAnArray } from 'immutable-lens'

import { ComputedState } from './ComputedState'

export interface FocusedUpdater<Type extends {
   state: any
   computedValues: object
}> {
   (this: FocusedUpdater<Type & { state: object & NotAnArray }>, computedState: ComputedState<Type>): Type['state']
   (state: Type['state']): Type['state']
}
