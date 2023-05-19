import { StoreDataKey } from './StoreDataKey'
import { StoreType } from './StoreType'

/**
 * Essentially a normalized StoreState (status, errors and data are derived from it)
 */
export type StoreStateRaw<Type extends StoreType> =
   | LoadingStateRaw<Type>
   | ErrorStateRaw<Type>
   | LoadedStateRaw<Type>

// TODO prevent key clashes between loadableValues & (state & values) both compile and run time
export type LoadingStateRaw<Type extends StoreType> = {
   reduxState: Type['reduxState']
   values: Type['values']
   loadableValues: {
      [K in keyof Type['loadableValues']]:
         | { status: 'loading'; value: undefined; error: undefined }
         | {
              status: 'loaded'
              value: Type['loadableValues'][K]
              error: undefined
           }
   }
}

// TODO prevent key clashes between loadableValues & (state & values) both compile and run time
export type ErrorStateRaw<Type extends StoreType> = {
   reduxState: Type['reduxState']
   values: Type['values'] // TODO sync computed values can be in error ? { [K in keyof Type['values']]: Type['values'][K] | Error }
   loadableValues: {
      [K in keyof Type['loadableValues']]:
         | { status: 'loading'; value: undefined; error: undefined }
         | { status: 'error'; value: undefined; error: Error }
         | {
              status: 'loaded'
              value: Type['loadableValues'][K]
              error: undefined
           }
   }
}

// TODO prevent key clashes between loadableValues & state & values both compile and run time
export type LoadedStateRaw<Type extends StoreType> = {
   reduxState: Type['reduxState']
   values: Type['values']
   loadableValues: {
      [K in keyof Type['loadableValues']]: {
         status: 'loaded'
         value: Type['loadableValues'][K]
         error: undefined
      }
   }
}

export type PickedStateRaw<
   Type extends StoreType,
   K extends StoreDataKey<Type>
> = StoreStateRaw<{
   reduxState: Pick<
      Type['reduxState'],
      Exclude<K, keyof Type['values'] | keyof Type['loadableValues']>
   >
   values: Pick<Type['values'], Exclude<K, keyof Type['loadableValues']>>
   loadableValues: Pick<Type['loadableValues'], K>
   actions: Type['actions']
   dependencies: Type['dependencies']
}>
