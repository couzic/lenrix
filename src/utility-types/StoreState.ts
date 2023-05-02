import { StoreDataStatus } from './StoreDataStatus'
import { StoreType } from './StoreType'

export type StoreState<
   Type extends StoreType,
   Status = StoreDataStatus
> = Status extends 'loaded'
   ? {
        [K in keyof (Type['state'] &
           Type['readonlyValues'])]: K extends keyof Type['readonlyValues']
           ? Type['readonlyValues'][K]
           : K extends keyof Type['state']
           ? Type['state'][K]
           : never
     }
   : {
        [K in keyof (Type['state'] &
           Type['readonlyValues'])]: K extends keyof Type['readonlyValues']
           ? Type['readonlyValues'][K] | undefined // Actually, it's not the value that can be undefined, it's the key that can be absent
           : K extends keyof Type['state']
           ? Type['state'][K]
           : never
     }
