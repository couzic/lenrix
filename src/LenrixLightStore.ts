import { Observable } from 'rxjs'

import { LightStore } from './LightStore'
import { Store } from './Store'
import { ActionObservable } from './utility-types/ActionObservable'
import { StoreType } from './utility-types/StoreType'

export class LenrixLightStore<Type extends StoreType>
   implements LightStore<Type>
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
