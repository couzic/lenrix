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
import { createLogger } from './logger/createLogger'
import { LoggerOptions } from './logger/LoggerOptions'
import { Store } from './Store'

declare const process: undefined | {
   env?: {
      NODE_ENV?: string
   }
}

export function createFocusableStore<State extends object & NotAnArray>(
   reducer: Reducer<State>,
   preloadedState: State,
   enhancer?: StoreEnhancer<State>,
   options?: { logger?: LoggerOptions }
): Store<{
   state: State
   computedValues: {}
   actions: {}
   dependencies: {}
}> {

   const userOptions = options || {}

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

   const logger = createLogger(reduxStore, userOptions.logger)

   const stateSubject = new BehaviorSubject(preloadedState)

   const subscription = reduxStore.subscribe(() => {
      stateSubject.next(reduxStore.getState())
   })

   const dispatchAction = (action: FocusedAction, meta: ActionMeta) => {
      const hasUpdateHandler = Boolean(updateHandlers[action.type])
      const hasEpicHandler = Boolean(epicHandlers[action.type])
      if (!hasUpdateHandler && !hasEpicHandler) { // MESSAGE
         logger.message(action)
      }
      if (hasUpdateHandler) { // UPDATE
         logger.update(action)
         reduxStore.dispatch({
            type: '[UPDATE]' + action.type,
            payload: action.payload,
            meta
         })
      }
      if (hasEpicHandler) { // EPIC
         logger.epic(action)
         const epic = epicHandlers[action.type]
         const action$ = epic(Observable.of(action.payload))
         action$.subscribe((action: any) => {
            const meta = {} as any
            const types = Object.keys(action)
            if (types.length > 1) throw Error('Lenrix does not support (yet?) dispatch of multiple actions in single object')
            const type = types[0]
            dispatchAction({ type, payload: action[type] }, meta)
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

   const dispatchCompute = (store: Store<any>, previous: object, next: object) => {
      const meta = {
         previous,
         next
      } as any
      logger.compute(previous, next)
   }

   return new LenrixStore(
      state$.map(state => ({ state, computedValues: {} })),
      data => data.state as any,
      { state: preloadedState, computedValues: {} },
      registerHandlers,
      registerEpics,
      dispatchAction,
      dispatchCompute,
      'root'
   )
}

export function createStore<State extends object>(initialState: State, options?: { logger?: LoggerOptions }): Store<{
   state: State
   computedValues: {}
   actions: {}
   dependencies: {}
}> {
   return createFocusableStore(state => state, initialState, undefined, options)
}
