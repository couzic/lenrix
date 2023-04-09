import { StoreState } from './StoreState'
import { StoreType } from './StoreType'

// TODO handle overloading store state with cascading computed, combined and loaded values of different types using this strategy:
// Use one single object for values (probably just called readonly values), and just the keys to differentiate sync, combined and loaded ones
// That way, we can change the value types on the "readonlyValues" object type in a cascading way, while retaining which ones are of what type
// Careful, might need to think this through, since in some cases at runtime the downstream value might be undefined, so the upstream one might appear

export type StoreData<Type extends StoreType> =
   Type['waitingToBeLoaded'] extends true
      ? {
           status: 'loaded'
           state: StoreState<Type, 'loaded'>
           error: undefined
        }
      :
           | {
                status: 'initial' | 'loading'
                state: StoreState<Type, 'initial' | 'loaded'>
                error: undefined
             }
           | {
                status: 'loaded'
                state: StoreState<Type, 'loaded'>
                error: undefined
             }
           | {
                status: 'error'
                state: StoreState<Type, 'error'>
                error: Error
             }
