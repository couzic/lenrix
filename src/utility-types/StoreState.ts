import { StoreDataStatus } from './StoreDataStatus'
import { StoreType } from './StoreType'

export type StoreState<Type extends StoreType, Status = StoreDataStatus> = Omit<
   Type['state'],
   | keyof Type['readonlyValues']
   | keyof Type['combinedValues']
   | keyof Type['loadingValues']
> &
   Type['readonlyValues'] &
   Type['combinedValues'] &
   (Type['waitingToBeLoaded'] extends true
      ? Type['loadingValues']
      : Status extends 'loaded'
      ? Type['loadingValues']
      : {
           [K in keyof Type['loadingValues']]: undefined
        })
