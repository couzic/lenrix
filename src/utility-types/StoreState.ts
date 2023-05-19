import { StoreDataKey } from './StoreDataKey'
import { StoreType } from './StoreType'

export type StoreState<Type extends StoreType> =
   | LoadingState<Type>
   | ErrorState<Type>
   | LoadedState<Type>

// TODO prevent key clashes between loadableValues & (state & values) both compile and run time
export type LoadingState<Type extends StoreType> = {
   status: 'loading'
   errors: []
   data: LoadingData<Type>
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
export type ErrorState<Type extends StoreType> = {
   status: 'error'
   errors: Error[]
   data: LoadingData<Type>
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
export type LoadedState<Type extends StoreType> = {
   status: 'loaded'
   errors: []
   data: LoadedData<Type>
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

export type StoreData<Type extends StoreType> =
   | LoadingData<Type>
   | LoadedData<Type>

export type LoadingData<Type extends StoreType> = {
   [K in StoreDataKey<Type>]: K extends keyof Type['loadableValues']
      ? Type['loadableValues'][K] | undefined
      : K extends keyof Type['values']
      ? Type['values'][K]
      : K extends keyof Type['reduxState']
      ? Type['reduxState'][K]
      : never
}

export type LoadedData<Type extends StoreType> = {
   [K in StoreDataKey<Type>]: K extends keyof Type['loadableValues']
      ? Type['loadableValues'][K]
      : K extends keyof Type['values']
      ? Type['values'][K]
      : K extends keyof Type['reduxState']
      ? Type['reduxState'][K]
      : never
}

export type PickedLoadedState<
   Type extends StoreType,
   K extends StoreDataKey<Type>
> = LoadedState<{
   reduxState: {
      [K in Exclude<
         keyof Type['reduxState'],
         keyof Type['values'] | keyof Type['loadableValues']
      >]: Type['reduxState'][K]
   }
   values: Pick<Type['values'], Exclude<K, keyof Type['loadableValues']>>
   loadableValues: Pick<Type['loadableValues'], K>
   actions: Type['actions']
   dependencies: Type['dependencies']
}>
