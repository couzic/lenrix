import { Observable } from 'rxjs'

import { LightStore } from './LightStore'
import { Store } from './Store'
import { ActionObservable } from './util/ActionObservable'
import { ComputedState } from './util/ComputedState'

export class LenrixLightStore<
   Type extends {
      state: any
      computedValues: object
      actions: object
      dependencies: object
   }
> implements LightStore<Type> {
   constructor(private readonly store: Store<Type>) {}

   get state$(): Observable<Type['state']> {
      return this.store.state$
   }

   get currentState(): Type['state'] {
      return this.store.currentState
   }

   get computedState$(): Observable<ComputedState<Type>> {
      return this.store.computedState$
   }

   get currentComputedState(): ComputedState<Type> {
      return this.store.currentComputedState
   }

   get action$(): ActionObservable<Type['actions']> {
      return this.store.action$
   }
}
