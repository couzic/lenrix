import { Observable } from 'rxjs'

import { ActionObservable } from './util/ActionObservable'
import { OutputState } from './util/ComputedState'

export interface LightStore<
   Type extends {
      state: any
      readonlyValues: object
      actions: object
      dependencies: object
   }
> {
   readonly state$: Observable<Type['state']>
   readonly currentState: Type['state']
   readonly computedState$: Observable<OutputState<Type>>
   readonly currentComputedState: OutputState<Type>
   readonly action$: ActionObservable<Type['actions']>
}
