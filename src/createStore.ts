import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'

import { NotAnArray, Updater } from 'immutable-lens'
import { createStore as createReduxStore, Reducer, StoreEnhancer } from 'redux'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'

import { FocusedAction } from './FocusedAction'
import { FocusedHandlers } from './FocusedHandlers'
import { ActionMeta, LenrixStore } from './LenrixStore'
import { Store } from './Store'

declare const process: undefined | {
   env?: {
      NODE_ENV?: string
   }
}

export function createFocusableStore<State extends object & NotAnArray>(
   reducer: Reducer<State>,
   preloadedState: State,
   enhancer?: StoreEnhancer<State>
): Store<{
   state: State
   computedValues: {}
   actions: {}
   dependencies: {}
}> {

   let updateHandlers = {} as Record<string, (payload: any) => Updater<State>>
   let epicHandlers = {} as Record<string, (payload$: Observable<any>) => Observable<any>>

   const augmentedReducer: Reducer<State> = (state, action) => {
      if (action.type.startsWith('[MESSAGE]') || action.type.startsWith('[EPIC]')) return state
      if (action.type.startsWith('[UPDATE]')) {
         const actionType = action.type.split('[UPDATE]')[1]
         const updateHandler = updateHandlers[actionType]
         if (!updateHandler) return state
         return updateHandler(action.payload)(state)
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
      const hasUpdateHandler = Object.keys(updateHandlers).indexOf(action.type) >= 0
      const hasEpicHandler = Object.keys(epicHandlers).indexOf(action.type) >= 0
      if (!hasUpdateHandler && !hasEpicHandler) {
         reduxStore.dispatch({
            type: '[MESSAGE]' + action.type,
            payload: action.payload,
            meta
         })
      }
      if (hasUpdateHandler) {
         reduxStore.dispatch({
            type: '[UPDATE]' + action.type,
            payload: action.payload,
            meta
         })
      }
      if (hasEpicHandler) {
         reduxStore.dispatch({
            type: '[EPIC]' + action.type,
            payload: action.payload,
            meta
         })
         const epic = epicHandlers[action.type]
         const action$ = epic(Observable.of(action.payload))
         action$.subscribe((actionOrActions: any) => {
            const meta = {} as any
            if (actionOrActions.type) {
               const { type, payload } = actionOrActions
               dispatchAction({ type, payload }, meta)
            } else {
               Object.keys(actionOrActions).forEach(type => {
                  dispatchAction({ type, payload: actionOrActions[type] }, meta)
               })
            }
         })
      }
   }

   const state$ = stateSubject.distinctUntilChanged().skip(1)

   const registerHandlers = <Actions>(newHandlers: FocusedHandlers<any>) => {
      const actionTypes = Object.keys(newHandlers)
      actionTypes.forEach(actionType => {
         updateHandlers[actionType] = (newHandlers as any)[actionType]
      })
   }

   const registerEpics = <Actions>(newEpics: any) => {
      const actionTypes = Object.keys(newEpics)
      actionTypes.forEach(actionType => {
         epicHandlers[actionType] = (newEpics as any)[actionType]
      })
   }

   return new LenrixStore(
      state$.map(state => ({ state, computedValues: {} })),
      data => data.state as any,
      { state: preloadedState, computedValues: {} },
      registerHandlers,
      registerEpics,
      dispatchAction,
      {},
      'root'
   )
}

export function createStore<State extends object>(initialState: State): Store<{
   state: State
   computedValues: {}
   actions: {}
   dependencies: {}
}> {
   return createFocusableStore(state => state, initialState)
}
