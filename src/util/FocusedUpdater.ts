import { OutputState } from './ComputedState'

export type FocusedUpdater<
   Type extends {
      state: any
      readonlyValues: object
   }
> = (state: OutputState<Type>) => Type['state']
