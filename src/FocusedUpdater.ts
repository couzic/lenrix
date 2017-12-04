import { ComputedState } from './ComputedState'

export interface FocusedUpdater<Type extends {
   state: any
   computedValues: object
}> { (computedState: ComputedState<Type>): Type['state'] }
