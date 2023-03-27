import { PlainObject } from 'immutable-lens'
import { StoreStatus } from '../StoreStatus'
import { OutputState } from './OutputState'

export type LoadableData<
   Type extends {
      state: PlainObject
      readonlyValues: PlainObject
      status: StoreStatus
      loadingValues: PlainObject
   }
> = Type['status'] extends 'loaded'
   ? {
        status: 'loaded'
        state: OutputState<Type> & Type['loadingValues']
        error: undefined
     }
   : Type['status'] extends 'error'
   ? {
        status: 'error'
        state: OutputState<Type> &
           Record<keyof Type['loadingValues'], undefined>
        error: Error
     }
   :
        | {
             status: 'loading'
             state: OutputState<Type> &
                Record<keyof Type['loadingValues'], undefined>
             error: undefined
          }
        | {
             status: 'loaded'
             state: OutputState<Type> & Type['loadingValues']
             error: undefined
          }
        | {
             status: 'error'
             state: OutputState<Type> &
                Record<keyof Type['loadingValues'], undefined>
             error: Error
          }
