import { PlainObject, Updater } from 'immutable-lens'
import { Reducer, StoreEnhancer, createStore as createReduxStore } from 'redux'
import {
   Observable,
   ReplaySubject,
   Subject,
   catchError,
   distinctUntilChanged,
   filter,
   map,
   merge,
   mergeMap,
   of,
   startWith,
   switchMap
} from 'rxjs'

import { LenrixStore } from './LenrixStore'
import { Store } from './Store'
import { LoggerOptions } from './logger/LoggerOptions'
import { createLogger } from './logger/createLogger'
import { ActionMeta } from './utility-types/ActionMeta'
import { ActionObject } from './utility-types/ActionObject'
import { FocusedAction } from './utility-types/FocusedAction'
import { FocusedHandlers } from './utility-types/FocusedHandlers'
import { IsPlainObject } from './utility-types/IsPlainObject'
import { StoreContext } from './utility-types/StoreContext'

declare const process:
   | undefined
   | {
        env?: {
           NODE_ENV?: string
        }
     }

export function createFocusableStore<ReduxState>(
   reducer: Reducer<ReduxState>,
   preloadedReduxState: ReduxState,
   enhancer?: StoreEnhancer<ReduxState>,
   options?: { logger?: LoggerOptions }
): IsPlainObject<ReduxState> extends true
   ? Store<{
        reduxState: PlainObject<ReduxState>
        values: {}
        loadableValues: {}
        actions: {}
        dependencies: {}
     }>
   : never {
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

   const output$: Observable<any> = epics$.pipe(
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
      types.forEach(type => {
         const payload = action[type]
         dispatchAction({ type, payload }, meta)
      })
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

   const updateHandlers: Record<string, (payload: any) => Updater<ReduxState>> =
      {}
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

   const augmentedReducer: Reducer<ReduxState> = (state, action) => {
      const updateHandler = updateHandlers[action.type]
      if (updateHandler) {
         try {
            return updateHandler(action.payload)(state || preloadedReduxState)
         } catch (e) {
            logger.error({
               source: {
                  type: 'update',
                  actionType: action.type,
                  payload: action.payload
               },
               nativeError: e as any
            })
            return state || preloadedReduxState
         }
      } else {
         return reducer(state, action)
      }
   }

   const reduxStore = createReduxStore(
      augmentedReducer as any,
      preloadedReduxState as any,
      enhancer
   )

   const logger = createLogger(reduxStore, userOptions.logger)

   const registerUpdates = <Actions>(newHandlers: FocusedHandlers<any>) => {
      const actionTypes = Object.keys(newHandlers)
      actionTypes.forEach(actionType => {
         if (updateHandlers[actionType] !== undefined)
            throw Error('Cannot register two updaters for the same action type')
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
      previous: object | null | undefined,
      next: object
   ) => {
      const meta = {
         previous,
         next
      } as any
      logger.compute(previous, next)
   }

   const dispatchLoading = (store: Store<any>, selection: any) => {
      logger.loading(selection)
   }

   const dispatchLoaded = (store: Store<any>, loadedValues: object) => {
      logger.loaded(loadedValues)
   }

   const activationCallbacks = [] as Array<() => void>
   const registerActivationCallback = (
      store: Store<any>,
      callback: (store: Store<any>) => void
   ) => {
      activationCallbacks.push(() => callback(store))
   }
   const activate = () => {
      activationCallbacks.forEach(callback => callback())
   }

   const context: StoreContext = {
      action$,
      registerEpics,
      registerSideEffects,
      registerActivationCallback,
      activate,
      dispatchActionObject,
      dispatchCompute,
      dispatchLoading,
      dispatchLoaded
   }

   const toStoreState = (reduxState: ReduxState) => ({
      reduxState,
      data: reduxState,
      values: {},
      loadableValues: {},
      status: 'loaded' as const,
      error: undefined
   })
   const initialState = toStoreState(preloadedReduxState)
   const state$ = new ReplaySubject<any>(1)
   const reduxState$ = new ReplaySubject<ReduxState>(1)
   reduxState$
      .pipe(
         startWith(preloadedReduxState),
         distinctUntilChanged(),
         map(toStoreState)
      )
      .subscribe(state$)

   const subscription = reduxStore.subscribe(() => {
      reduxState$.next(reduxStore.getState() as any)
   })

   return new LenrixStore(
      initialState as any,
      state$,
      registerUpdates,
      context,
      'root'
   ) as any
}

export function createStore<ReduxState extends object>(
   initialState: PlainObject<ReduxState>,
   options?: { logger?: LoggerOptions }
): Store<{
   reduxState: PlainObject<ReduxState>
   values: {}
   loadableValues: {}
   actions: {}
   dependencies: {}
}> {
   return createFocusableStore(
      state => state || initialState,
      initialState,
      undefined,
      options
   ) as any
}
