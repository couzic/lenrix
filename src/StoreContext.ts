import { ActionObject } from './ActionObject'
import { Store } from './Store'

export interface StoreContext {
   registerEpics: (epics: any, store: Store<any>) => void
   dispatchActionObject: (action: ActionObject<any>, meta: any) => void
   dispatchCompute: (store: Store<any>, previous: any, next: any) => void
}
