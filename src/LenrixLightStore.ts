import { Observable } from 'rxjs'

import { LightStore } from './LightStore'
import { Store } from './Store'
import { ActionObservable } from './utility-types/ActionObservable'
import { StoreState } from './utility-types/StoreState'
import { StoreType } from './utility-types/StoreType'

export class LenrixLightStore<Type extends StoreType>
   implements LightStore<Type>
{
   state$: Observable<StoreState<Type>>

   constructor(private readonly store: Store<Type>) {
      this.state$ = store.state$
   }

   get currentState() {
      return this.store.currentState
   }

   get currentStatus() {
      return this.store.currentStatus
   }

   get data$() {
      return this.store.data$
   }

   get currentData() {
      return this.store.currentData
   }

   get action$(): ActionObservable<Type['actions']> {
      return this.store.action$
   }
}
