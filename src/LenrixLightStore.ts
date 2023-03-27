import { Observable } from 'rxjs'

import { LightStore } from './LightStore'
import { Store } from './Store'
import { StoreStatus } from './StoreStatus'
import { ActionObservable } from './util/ActionObservable'

export class LenrixLightStore<
   Type extends {
      state: any
      readonlyValues: object
      status: StoreStatus
      loadingValues: object
      actions: object
      dependencies: object
   }
> implements LightStore<Type>
{
   constructor(private readonly store: Store<Type>) {}

   get state$(): Observable<Type['state']> {
      return this.store.state$
   }

   get currentState(): Type['state'] {
      return this.store.currentState
   }

   get action$(): ActionObservable<Type['actions']> {
      return this.store.action$
   }
}
