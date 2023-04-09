import { StoreDataStatus } from './StoreDataStatus'
import { StoreType } from './StoreType'

export type StoreCurrentState<
   Type extends StoreType,
   Status = StoreDataStatus
> = Omit<
   Type['state'],
   | keyof Type['readonlyValues']
   | keyof Type['combinedValues']
   | keyof Type['loadingValues']
> &
   Type['readonlyValues'] & {
      [K in keyof Type['combinedValues']]: Type['combinedValues'][K] | undefined
   } & (Status extends 'loaded'
      ? Type['loadingValues']
      : {
           [K in keyof Type['loadingValues']]:
              | undefined
              | Type['loadingValues'][K]
        })
