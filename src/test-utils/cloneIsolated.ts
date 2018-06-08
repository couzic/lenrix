import { createStore } from '../createStore'
import { silentLoggerOptions } from '../logger/silentLoggerOptions'
import { Store } from '../Store'
import { StoreConfig } from './StoreConfig'

export function cloneIsolated<ClonedStore extends Store<any>>(
   store: ClonedStore
): ClonedStore {
   const config = (store as any).__config as StoreConfig
   const clonedStore = createStore(config.initialRootState, {
      logger: silentLoggerOptions
   })
   let s = clonedStore as any
   config.operations.forEach(operation => {
      s = s[operation.name](...operation.params)
   })
   return s
}
