import { Observable } from 'rxjs/Observable'

import { ComputedState } from './ComputedState'

export interface LightStore<Type extends {
   state: any
   computedValues: object
   actions: object
   dependencies: object
}> {
   readonly state$: Observable<Type['state']>
   readonly currentState: Type['state']
   readonly computedState$: Observable<ComputedState<Type>>
   readonly currentComputedState: ComputedState<Type>
}
