import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/switchMap'

import { NotAnArray, Updater } from 'immutable-lens'
import { createStore as createReduxStore, Reducer, StoreEnhancer } from 'redux'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { ActionObject } from './ActionObject'
import { FocusedAction } from './FocusedAction'
import { FocusedHandlers } from './FocusedHandlers'
import { ActionMeta, LenrixStore } from './LenrixStore'
import { createLogger } from './logger/createLogger'
import { LoggerOptions } from './logger/LoggerOptions'
import { Store } from './Store'
import { StoreContext } from './StoreContext'

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

   const input$ = new Subject<{
      action: FocusedAction
      meta: object
   }>()

   const epics$ = new Subject<Record<string, {
      epic: (payload$: Observable<any>, store: Store<any>) => Observable<any>,
      store: Store<any>
   }>>()

   const output$ = epics$.switchMap(epics => {
      const actionTypes = Object.keys(epics)
      return Observable
         .of(...actionTypes)
         .mergeMap(actionType => {
            const { epic, store } = epics[actionType]
            const action$ = input$
               .map(input => input.action)
               .filter(action => action.type === actionType)
               .map(action => action.payload)
            return epic(action$, store)
         })
   })

   output$.subscribe(action => dispatchActionObject(action))

   const dispatchActionObject = (action: ActionObject<any>) => {
      const meta = {} as any
      const types = Object.keys(action)
      if (types.length > 1) throw Error('Lenrix does not support (yet?) dispatch of multiple actions in single object')
      const type = types[0]
      const payload = action[type]
      dispatchAction({ type, payload }, meta)
   }

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
         input$.next({ action, meta })
      }
   }

   const userOptions = options || {}

   let updateHandlers = {} as Record<string, (payload: any) => Updater<State>>
   let epicHandlers = {} as Record<string, {
      epic: (payload$: Observable<any>, store: Store<any>) => Observable<any>,
      store: Store<any>
   }>

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

   const state$ = stateSubject.distinctUntilChanged().skip(1)

   const registerHandlers = <Actions>(newHandlers: FocusedHandlers<any>) => {
      const actionTypes = Object.keys(newHandlers)
      actionTypes.forEach(actionType => {
         updateHandlers[actionType] = (newHandlers as any)[actionType]
      })
   }

   const registerEpics = <Actions>(newEpics: any, store: Store<any>) => {
      const actionTypes = Object.keys(newEpics)
      actionTypes.forEach(actionType => {
         epicHandlers[actionType] = { epic: (newEpics as any)[actionType], store }
      })
      epics$.next(epicHandlers)
   }

   const dispatchCompute = (store: Store<any>, previous: object, next: object) => {
      const meta = {
         previous,
         next
      } as any
      logger.compute(previous, next)
   }

   const context: StoreContext = {
      registerEpics,
      dispatchActionObject,
      dispatchCompute
   }

   return new LenrixStore(
      state$.map(state => ({ state, computedValues: {} })),
      data => data.state as any,
      { state: preloadedState, computedValues: {} },
      registerHandlers,
      context,
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
