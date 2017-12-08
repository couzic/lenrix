import { FocusedAction } from './FocusedAction'
import { Store } from './Store'

export interface StoreContext {
   registerEpics: (epics: any, store: Store<any>) => void
   dispatchAction: (action: FocusedAction, meta: any) => void
   dispatchCompute: (store: Store<any>, previous: any, next: any) => void
}
