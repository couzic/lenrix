import { Observable } from 'rxjs'

import { ActionObservable } from './utility-types/ActionObservable'
import { StoreState } from './utility-types/StoreState'
import { StoreType } from './utility-types/StoreType'

export interface LightStore<Type extends StoreType> {
   readonly state$: Observable<StoreState<Type>>
   readonly currentState: StoreState<Type>
   readonly action$: ActionObservable<Type['actions']>
}
