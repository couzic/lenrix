import { ComputedState } from './ComputedState'

export type FocusedUpdater<
   Type extends {
      state: any
      computedValues: object
   }
> = (computedState: ComputedState<Type>) => Type['state']
