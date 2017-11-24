import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'

import { createLens, Updater } from 'immutable-lens'
import { createStore as createReduxStore, Reducer, StoreEnhancer } from 'redux'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { ActionMeta, LenrixStore } from './LenrixStore'
import { Store } from './Store'

declare const process: undefined | {
   env?: {
      NODE_ENV?: string
   }
}

export function createFocusableStore<State extends object>(reducer: Reducer<State>, preloadedState: State, enhancer?: StoreEnhancer<State>): Store<{ state: State }> {
   const augmentedReducer: Reducer<State> = (state, action) => {
      if (action.type.startsWith('[UPDATE]')) {
         const { updater, newState } = action.payload
         if (typeof updater === 'function') {
            return updater(state)
         } else if (newState) {
            console.warn('Unable to apply update (Updater is not serializable) : fallback to precomputed newState')
            return newState
         } else {
            console.warn('Unable to apply update (Updater is not serializable), Unable to fallback to precomputed state: fallback to redux reducer')
            console.info('Have you tried setting NODE_ENV to development ?')
            return reducer(state, action)
         }
      } else {
         return reducer(state, action)
      }
   }

   const reduxStore = createReduxStore(
      augmentedReducer,
      preloadedState,
      enhancer
   )

   const stateSubject = new BehaviorSubject(preloadedState)

   const subscription = reduxStore.subscribe(() => {
      stateSubject.next(reduxStore.getState())
   })

   const dispatchUpdate = (updater: Updater<State>, meta: ActionMeta) => {
      const type = '[UPDATE]'
         + (meta.store.name ? meta.store.name + '.' : '')
         + meta.updater.name
      const payload = { updater }
      if (process && process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
         (payload as any).newState = updater(reduxStore.getState())
      }
      reduxStore.dispatch({
         type,
         payload,
         meta
      })
   }

   const state$ = stateSubject.distinctUntilChanged().skip(1)
   return new LenrixStore(
      state$.map(normalizedState => ({ normalizedState, computedValues: {} })),
      data => data.normalizedState,
      { normalizedState: preloadedState, computedValues: {} },
      createLens<State>(),
      dispatchUpdate,
      'root'
   )
}

export function createStore<State extends object>(initialState: State): Store<{ state: State }> {
   return createFocusableStore(state => state, initialState)
}
