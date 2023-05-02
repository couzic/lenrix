import { StoreType } from './StoreType'

export type StoreCurrentData<Type extends StoreType> =
   | {
        status: 'initial' | 'loading'
        state: {
           [K in keyof (Type['state'] &
              Type['readonlyValues'])]: K extends keyof Type['readonlyValues']
              ? Type['readonlyValues'][K] | undefined // Actually, it's not the value that can be undefined, it's the key that can be absent
              : K extends keyof Type['state']
              ? Type['state'][K]
              : never
        }
        error: undefined
     }
   | {
        status: 'loaded'
        state: {
           [K in keyof (Type['state'] &
              Type['readonlyValues'])]: K extends keyof Type['readonlyValues']
              ? Type['readonlyValues'][K]
              : K extends keyof Type['state']
              ? Type['state'][K]
              : never
        }
        error: undefined
     }
   | {
        status: 'error'
        state: {
           [K in keyof (Type['state'] &
              Type['readonlyValues'])]: K extends keyof Type['readonlyValues']
              ? Type['readonlyValues'][K] | undefined // Actually, it's not the value that can be undefined, it's the key that can be absent
              : K extends keyof Type['state']
              ? Type['state'][K]
              : never
        }
        error: Error
     }
