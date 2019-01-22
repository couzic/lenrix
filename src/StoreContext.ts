import { Store } from './Store'
import { ActionObject } from './util/ActionObject'

export interface StoreContext {
   action$: any
   registerEpics: (epics: any, store: Store<any>) => void
   registerSideEffects: (effects: any, store: Store<any>) => void
   dispatchActionObject: (action: ActionObject<any>, meta: any) => void
   dispatchCompute: (store: Store<any>, previous: any, next: any) => void
}
