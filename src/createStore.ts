import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'

import { createStore as createReduxStore, Reducer, StoreEnhancer } from 'redux'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { FocusedAction } from './FocusedAction'
import { FocusedHandlers } from './FocusedHandlers'
import { ActionMeta, LenrixStore } from './LenrixStore'
import { Store } from './Store'

declare const process: undefined | {
   env?: {
      NODE_ENV?: string
   }
}

export function createFocusableStore<State extends object>(reducer: Reducer<State>, preloadedState: State, enhancer?: StoreEnhancer<State>): Store<{ state: State }> {
   let handlers = {} as any

   const augmentedReducer: Reducer<State> = (state, action) => {
      if (action.type.startsWith('[UPDATE]')) {
         const { type, payload } = action
         const handler = handlers[type]
         return handler(payload)(state)
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

   const dispatchAction = (action: FocusedAction, meta: ActionMeta) => {
      const type = '[UPDATE]' + action.type
      reduxStore.dispatch({
         type,
         payload: action.payload,
         meta
      })
   }

   const state$ = stateSubject.distinctUntilChanged().skip(1)

   const registerHandlers = <Actions>(newHandlers: FocusedHandlers<State, Actions>) => {
      const actionTypes = Object.keys(newHandlers)
      actionTypes.forEach(actionType => {
         const key = '[UPDATE]' + actionType
         handlers[key] = (newHandlers as any)[actionType]
      })
   }

   return new LenrixStore(
      state$.map(normalizedState => ({ normalizedState, computedValues: {} })),
      data => data.normalizedState,
      { normalizedState: preloadedState, computedValues: {} },
      registerHandlers,
      dispatchAction,
      'root'
   )
}

export function createStore<State extends object>(initialState: State): Store<{ state: State }> {
   return createFocusableStore(state => state, initialState)
}
