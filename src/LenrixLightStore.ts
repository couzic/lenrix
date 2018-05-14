import { Observable } from 'rxjs'

import { ComputedState } from './ComputedState'
import { LightStore } from './LightStore'
import { Store } from './Store'

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
}
