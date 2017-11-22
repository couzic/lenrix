import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'

import { createLens, Updater } from 'immutable-lens'
import { createStore as createReduxStore, Reducer, StoreEnhancer } from 'redux'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { ActionMeta, LenrixStore } from './LenrixStore'
import { Store } from './Store'

export function createFocusableStore<State extends object>(reducer: Reducer<State>, preloadedState: State, enhancer?: StoreEnhancer<State>): Store<State> {
   const augmentedReducer: Reducer<State> = (state, action) => {
      if (action.type.startsWith('[UPDATE]')) {
         const { updater, newState } = action.payload
         if (typeof updater === 'function') {
            return updater(state)
         } else {
            return newState
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
         + updater.name
      const newState = updater(reduxStore.getState())
      reduxStore.dispatch({
         type,
         payload: { updater, newState },
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

export function createStore<State extends object>(initialState: State): Store<State> {
   return createFocusableStore(state => state, initialState)
}
