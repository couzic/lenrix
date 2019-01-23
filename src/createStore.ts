import { PlainObject, Updater } from 'immutable-lens'
import { createStore as createReduxStore, Reducer, StoreEnhancer } from 'redux'
import { BehaviorSubject, merge, Observable, of, Subject } from 'rxjs'
import { catchError, distinctUntilChanged, filter, map, mergeMap, skip, switchMap } from 'rxjs/operators'

import { ActionMeta, LenrixStore } from './LenrixStore'
import { createLogger } from './logger/createLogger'
import { LoggerOptions } from './logger/LoggerOptions'
import { Store } from './Store'
import { StoreContext } from './StoreContext'
import { ActionObject } from './util/ActionObject'
import { FocusedAction } from './util/FocusedAction'
import { FocusedHandlers } from './util/FocusedHandlers'

declare const process:
   | undefined
   | {
        env?: {
           NODE_ENV?: string
        }
     }

export function createFocusableStore<State extends PlainObject>(
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
   const action$ = new Subject<any>()
   ;(action$ as any).ofType = (type: string) =>
      action$.pipe(
         filter(action => action.type === type),
         map(action => action.payload)
      )

   const input$ = new Subject<{
      action: FocusedAction
      meta: object
   }>()

   const epics$ = new Subject<
      Record<
         string,
         Array<{
            epic: (payload$: Observable<any>) => Observable<any>
            store: Store<any>
         }>
      >
   >()

   const output$ = epics$.pipe(
      switchMap(epics => {
         const actionTypes = Object.keys(epics)
         return of(...actionTypes).pipe(
            mergeMap(actionType => {
               const payload$ = input$.pipe(
                  map(input => input.action),
                  filter(action => action.type === actionType),
                  map(action => action.payload)
               )
               const outputAction$ = epics[actionType].map(
                  ({ epic, store }) => {
                     const safeEpic = (): any =>
                        // Here, payload$ has already emitted the value causing the error, which is then ignored
                        epic(payload$).pipe(
                           catchError(error => {
                              logger.error({
                                 source: { type: 'epic', store, actionType },
                                 nativeError: error
                              })
                              return safeEpic()
                           })
                        )
                     return safeEpic()
                  }
               )
               return merge(...outputAction$)
            })
         )
      })
   )

   output$.subscribe(action => dispatchActionObject(action))

   let hasDispatched = false

   const dispatchActionObject = (action: ActionObject<any>) => {
      hasDispatched = true
      const meta = {} as any
      const types = Object.keys(action)
      if (types.length > 1)
         throw Error(
            'Lenrix does not support (yet?) dispatch of multiple actions in single object'
         )
      const type = types[0]
      const payload = action[type]
      dispatchAction({ type, payload }, meta)
   }

   const dispatchAction = (action: FocusedAction, meta: ActionMeta) => {
      const hasUpdateHandler = Boolean(updateHandlers[action.type])
      const hasEpicHandler = Boolean(epicHandlers[action.type])
      const hasSideEffect = Boolean(sideEffects[action.type])
      if (!hasUpdateHandler && !hasEpicHandler) {
         // MESSAGE
         logger.message(action)
      }
      if (hasUpdateHandler) {
         // UPDATE
         logger.update(action)
         reduxStore.dispatch({
            type: action.type,
            payload: action.payload,
            meta
         })
      }
      if (hasSideEffect) {
         // SIDE EFFECTS
         const { handler, store } = sideEffects[action.type]
         handler(action.payload, store)
      }
      action$.next(action)
      if (hasEpicHandler) {
         // EPIC
         logger.epic(action)
         input$.next({ action, meta })
      }
   }

   const userOptions = options || {}

   const updateHandlers: Record<string, (payload: any) => Updater<State>> = {}
   const epicHandlers: Record<
      string,
      Array<{
         epic: (payload$: Observable<any>) => Observable<any>
         store: Store<any>
      }>
   > = {}
   const sideEffects: Record<
      string,
      { handler: (payload: any, store: Store<any>) => void; store: Store<any> }
   > = {}

   const augmentedReducer: Reducer<State> = (state, action) => {
      const updateHandler = updateHandlers[action.type]
      if (updateHandler) {
         try {
            return updateHandler(action.payload)(state || preloadedState)
         } catch (e) {
            logger.error({
               source: {
                  type: 'update',
                  actionType: action.type,
                  payload: action.payload
               },
               nativeError: e
            })
            return state || preloadedState
         }
      } else {
         return reducer(state, action)
      }
   }

   const reduxStore = createReduxStore(
      augmentedReducer,
      preloadedState as any,
      enhancer
   )

   const logger = createLogger(reduxStore, userOptions.logger)

   const stateSubject = new BehaviorSubject(preloadedState)

   const subscription = reduxStore.subscribe(() => {
      stateSubject.next(reduxStore.getState())
   })

   const state$ = stateSubject.pipe(
      distinctUntilChanged(),
      skip(1)
   )

   const registerUpdates = <Actions>(newHandlers: FocusedHandlers<any>) => {
      const actionTypes = Object.keys(newHandlers)
      actionTypes.forEach(actionType => {
         if (updateHandlers[actionType] !== undefined) throw Error('Cannot register two updaters for the same action type')
         updateHandlers[actionType] = (newHandlers as any)[actionType]
      })
   }

   const registerEpics = <Actions>(newEpics: any, store: Store<any>) => {
      if (hasDispatched)
         console.log(
            '%c 🔎  ⚠️ WARNING ⚠️',
            'background-color: red; color: #fff; padding: 2px 8px 2px 0; border-radius:6px;',
            'You are trying to register epics after actions have been dispatched. This could lead to strange behavior, including epics being canceled before completion.',
            'We advise you NOT to do this.',
            'Concerned epics:',
            Object.keys(newEpics),
            'store:',
            store.path
         )
      const actionTypes = Object.keys(newEpics)
      actionTypes.forEach(actionType => {
         const currentEpics = epicHandlers[actionType] || []
         const newEpic = newEpics[actionType]
         const nextEpics = [...currentEpics]
         if (newEpic) nextEpics.push({ epic: newEpic, store })
         epicHandlers[actionType] = nextEpics
      })
      epics$.next(epicHandlers)
   }

   const registerSideEffects = (effects: any, store: Store<any>) => {
      const actionTypes = Object.keys(effects)
      actionTypes.forEach(actionType => {
         sideEffects[actionType] = {
            handler: (effects as any)[actionType],
            store
         }
      })
   }

   const dispatchCompute = (
      store: Store<any>,
      previous: object,
      next: object
   ) => {
      const meta = {
         previous,
         next
      } as any
      logger.compute(previous, next)
   }

   const context: StoreContext = {
      action$,
      registerEpics,
      registerSideEffects,
      dispatchActionObject,
      dispatchCompute
   }

   return new LenrixStore(
      state$.pipe(map(state => ({ state, computedValues: {} }))),
      data => data.state as any,
      { state: preloadedState, computedValues: {} },
      registerUpdates,
      context,
      'root'
   )
}

export function createStore<State extends object>(
   initialState: State,
   options?: { logger?: LoggerOptions }
): Store<{
   state: State
   computedValues: {}
   actions: {}
   dependencies: {}
}> {
   return createFocusableStore(
      state => state || initialState,
      initialState,
      undefined,
      options
   )
}
