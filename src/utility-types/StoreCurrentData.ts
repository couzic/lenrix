import { StoreType } from './StoreType'

export type StoreCurrentData<Type extends StoreType> = {
   state: Omit<
      Type['state'],
      | keyof Type['readonlyValues']
      | keyof Type['combinedValues']
      | keyof Type['loadingValues']
   > &
      Type['readonlyValues'] & {
         [K in keyof Type['combinedValues']]:
            | Type['combinedValues'][K]
            | undefined
      }
} & (
   | {
        status: 'initial' | 'loading'
        state: Record<keyof Type['loadingValues'], undefined>
        error: undefined
     }
   | {
        status: 'loaded'
        state: Type['loadingValues']
        error: undefined
     }
   | {
        status: 'error'
        state: Record<keyof Type['loadingValues'], undefined>
        error: Error
     }
)
