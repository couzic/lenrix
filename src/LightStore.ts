import { Observable } from 'rxjs'

import { ActionObservable } from './util/ActionObservable'
import { OutputState } from './util/OutputState'

export interface LightStore<
   Type extends {
      state: any
      readonlyValues: object
      actions: object
      dependencies: object
   }
> {
   readonly state$: Observable<OutputState<Type>>
   readonly currentState: OutputState<Type>
   readonly computedState$: Observable<OutputState<Type>>
   readonly currentComputedState: OutputState<Type>
   readonly action$: ActionObservable<Type['actions']>
}
