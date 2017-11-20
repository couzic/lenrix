import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'

import { createStore as createReduxStore, Reducer, StoreEnhancer } from 'redux'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { LenrixStore } from './LenrixStore'
import { Store } from './Store'

export function createFocusableStore<State extends object>(reducer: Reducer<State>, preloadedState: State, enhancer?: StoreEnhancer<State>): Store<State> {
   const augmentedReducer: Reducer<State> = (state, action) => {
      if (action.type.startsWith('[UPDATE'))
         return action.payload(state)
      else return reducer(state, action)
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

   const state$ = stateSubject.distinctUntilChanged().skip(1)
   return new LenrixStore(
      state$.map(normalizedState => ({ normalizedState, computedValues: {} })),
      data => data.normalizedState,
      { normalizedState: preloadedState, computedValues: {} },
      updater => reduxStore.dispatch({ type: '[UPDATE]' + updater.name, payload: updater }),
      'root'
   )
}

export function createStore<State extends object>(initialState: State): Store<State> {
   return createFocusableStore(state => state, initialState)
}
