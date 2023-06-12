import { createLens, UnfocusedLens } from 'immutable-lens'
import {
   catchError,
   combineLatest,
   distinctUntilChanged,
   filter,
   map,
   merge,
   mergeAll,
   Observable,
   of,
   ReplaySubject,
   scan,
   startWith,
   switchMap,
   tap,
   withLatestFrom
} from 'rxjs'
import { isPlainObject } from './util/isPlainObject'

import { LenrixLightStore } from './LenrixLightStore'
import { LightStore } from './LightStore'
import { Store } from './Store'
import { aggregateStatusAndErrors } from './util/aggregateStatusAndErrors'
import { fromRawState } from './util/fromRawState'
import { isLoaded } from './util/isLoaded'
import { pickRawState } from './util/pickRawState'
import { stateEquals } from './util/stateEquals'
import { toData } from './util/toData'
import { ActionMeta } from './utility-types/ActionMeta'
import { ActionObject } from './utility-types/ActionObject'
import { ActionObservable } from './utility-types/ActionObservable'
import { FocusedHandlers } from './utility-types/FocusedHandlers'
import { StoreContext } from './utility-types/StoreContext'
import { StoreDataKey } from './utility-types/StoreDataKey'
import { LoadedState } from './utility-types/StoreState'
import { PickedStateRaw, StoreStateRaw } from './utility-types/StoreStateRaw'
import { StoreType } from './utility-types/StoreType'

export class LenrixStore<Type extends StoreType> implements Store<Type> {
   name?: string

   readonly localLens: UnfocusedLens<Type['reduxState']> =
      createLens<Type['reduxState']>()
   readonly actions: any = {}

   private readonly light: LightStore<Type>

   private __rawState: StoreStateRaw<Type>

   get state$() {
      return this.rawState$.pipe(map(fromRawState))
   }

   get currentState() {
      return fromRawState(this.__rawState)
   }

   get currentStatus() {
      return this.currentState.status
   }

   get data$() {
      return this.state$.pipe(map(_ => _.data))
   }

   get currentData() {
      return this.currentState.data
   }

   get currentErrors() {
      return this.currentState.errors
   }

   get action$(): ActionObservable<Type['actions']> {
      return this.context.action$
   }

   constructor(
      readonly initialRawState: StoreStateRaw<Type>,
      private readonly rawState$: ReplaySubject<StoreStateRaw<Type>>,
      readonly registerHandlers: (handlers: FocusedHandlers<Type>) => void,
      private readonly context: StoreContext,
      public readonly path: string
   ) {
      this.light = new LenrixLightStore(this)
      this.__rawState = initialRawState
      rawState$.subscribe(stateRaw => (this.__rawState = stateRaw))
   }

   ///////////////
   // ACTIVATE //
   /////////////

   onActivate(callback: (store: Store<Type>) => void) {
      this.context.registerActivationCallback(this, callback)
      return this
   }

   activate() {
      this.context.activate()
   }

   //////////////
   // ACTIONS //
   ////////////

   actionTypes(): any {
      return this
   }

   updates(
      focusHandlers:
         | ((lens: UnfocusedLens<Type['reduxState']>) => FocusedHandlers<Type>)
         | FocusedHandlers<Type>
   ) {
      const handlers =
         typeof focusHandlers === 'function'
            ? focusHandlers(this.localLens)
            : focusHandlers
      this.registerHandlers(handlers)
      return new LenrixStore(
         this.__rawState,
         this.rawState$,
         this.registerHandlers,
         this.context,
         this.path
      )
   }

   private makeActionMeta(): ActionMeta {
      return {
         store: {
            name: this.name,
            path: this.path,
            currentData: this.currentData
         }
      }
   }

   dispatch(action: ActionObject<any>) {
      this.context.dispatchActionObject(action, this.makeActionMeta())
   }

   action(action: any): any {
      return (payload: any) => this.dispatch({ [action]: payload })
   }

   epics(epics: any): Store<Type> {
      return this.pureEpics(epics(this.light))
   }

   pureEpics(epics: any): Store<Type> {
      this.context.registerEpics(epics, this as any)
      return this
   }

   sideEffects(effects: any): Store<Type> {
      this.context.registerSideEffects(effects, this as any)
      return this
   }

   ///////////
   // READ //
   /////////

   pick<K extends StoreDataKey<Type>>(...keys: K[]): any {
      return this.pickFromState$(keys).pipe(map(fromRawState))
   }

   private pickFromState$<K extends StoreDataKey<Type>>(
      keys: K[]
   ): Observable<PickedStateRaw<Type, K>> {
      return this.rawState$.pipe(
         map(state => pickRawState(state, keys)),
         distinctUntilChanged(stateEquals)
      )
   }

   ///////////
   // LOAD //
   /////////

   loadFromFields<K extends StoreDataKey<Type>, LoadableValues extends object>(
      keys: K[],
      loaders: {
         [LK in keyof LoadableValues]: (
            fields: Pick<LoadedState<Type>['data'], K>
         ) => Observable<LoadableValues[LK]>
      }
   ): any {
      const loadableKeys = Object.keys(loaders) as (keyof LoadableValues)[]
      const loadingValues = {} as Record<keyof LoadableValues, any>
      loadableKeys.forEach(key => {
         loadingValues[key] = {
            status: 'loading',
            error: undefined,
            value: undefined
         }
      })

      const pickedState$ = this.pickFromState$(keys).pipe()

      const loading$ = pickedState$.pipe(map(() => loadingValues))

      const loadedOrError$ = pickedState$.pipe(
         filter(isLoaded),
         map(toData),
         tap(data => this.context.dispatchLoading(this as any, data)),
         switchMap(data =>
            merge(
               loadableKeys.map(key =>
                  loaders[key](data as any).pipe(
                     map(result => ({
                        [key]: {
                           status: 'loaded',
                           value: result,
                           error: undefined
                        }
                     })),
                     catchError((error: Error) =>
                        of({
                           [key]: { status: 'error', value: undefined, error }
                        })
                     ) // TODO Recover from Error
                  )
               )
            ).pipe(
               mergeAll(),
               scan((acc, loadableValues) => {
                  return { ...acc, ...loadableValues } as any
               }, loadingValues)
            )
         ),
         tap(loadedValues =>
            this.context.dispatchLoaded(this as any, loadedValues)
         )
      )
      const loadableValues$ = merge(loading$, loadedOrError$)
      const rawState$ = new ReplaySubject<any>(1)

      combineLatest([this.rawState$, loadableValues$])
         .pipe(
            map(([state, loadableValues]) => ({
               ...state,
               loadableValues: { ...state.loadableValues, ...loadableValues }
            }))
         )
         .subscribe(rawState$)
      return new LenrixStore(
         this.__rawState,
         rawState$,
         this.registerHandlers,
         this.context,
         this.path + `.loadFromFields(${loadableKeys.join(', ')})`
      )
   }

   loadFromFields$<K extends StoreDataKey<Type>, LoadableValues>(
      keys: K[],
      loaders: {
         [LVK in keyof LoadableValues]: (
            fields$: Observable<{
               [FK in K]: FK extends keyof Type['loadableValues']
                  ? Type['loadableValues'][FK]
                  : FK extends keyof Type['values']
                  ? Type['values'][FK]
                  : FK extends keyof Type['reduxState']
                  ? Type['reduxState'][FK]
                  : never
            }>
         ) => Observable<LoadableValues[LVK]>
      }
   ): any {
      const loadableKeys = Object.keys(loaders) as (keyof LoadableValues)[]
      const loadingValues = {} as Record<keyof LoadableValues, any>
      loadableKeys.forEach(key => {
         loadingValues[key] = {
            status: 'loading',
            error: undefined,
            value: undefined
         }
      })

      const pickedState$ = this.pickFromState$(keys).pipe()

      const loading$ = pickedState$.pipe(map(() => loadingValues))

      const data$ = pickedState$.pipe(
         filter(isLoaded),
         map(toData),
         tap(data => this.context.dispatchLoading(this as any, data))
      ) // TODO Share !!! Otherwise, dispatchLoading will be called multiple times !

      const loadedOrError$ = merge(
         loadableKeys.map(key =>
            loaders[key](data$ as any).pipe(
               map(result => ({
                  [key]: {
                     status: 'loaded',
                     value: result,
                     error: undefined
                  }
               })),
               catchError((error: Error) =>
                  of({
                     [key]: { status: 'error', value: undefined, error }
                  })
               ) // TODO Recover from Error
            )
         )
      ).pipe(
         mergeAll(),
         scan((acc, loadableValues) => {
            return { ...acc, ...loadableValues } as any
         }, loadingValues),
         tap(loadedValues =>
            this.context.dispatchLoaded(this as any, loadedValues)
         )
      )

      const loadableValues$ = merge(loading$, loadedOrError$)
      const rawState$ = new ReplaySubject<any>(1)

      combineLatest([this.rawState$, loadableValues$])
         .pipe(
            map(([state, loadableValues]) => ({
               ...state,
               loadableValues: { ...state.loadableValues, ...loadableValues }
            }))
         )
         .subscribe(rawState$)
      return new LenrixStore(
         this.__rawState,
         rawState$,
         this.registerHandlers,
         this.context,
         this.path + `.loadFromFields$(${loadableKeys.join(', ')})`
      )
   }

   loadFromStream<Input, LoadableValues extends object>(
      input$: Observable<Input>,
      loaders: {
         [LK in keyof LoadableValues]: (
            input: Input
         ) => Observable<LoadableValues[LK]>
      }
   ): any {
      const loadableKeys = Object.keys(loaders) as (keyof LoadableValues)[]

      const allLoading = {} as Record<
         keyof LoadableValues,
         { status: 'loading'; error: undefined; value: undefined }
      >
      loadableKeys.forEach(
         key =>
            (allLoading[key] = {
               status: 'loading',
               error: undefined,
               value: undefined
            })
      )

      const loadableValues$ = input$.pipe(
         switchMap(input =>
            merge(
               of(allLoading),
               ...loadableKeys.map(key =>
                  // TODO Handle error in loader
                  loaders[key](input).pipe(
                     map(value => ({
                        [key]: {
                           status: 'loaded',
                           error: undefined,
                           value
                        }
                     }))
                  )
               )
            )
         ),
         scan((acc, next) => ({ ...acc, ...next }), allLoading)
      )

      const rawState$ = new ReplaySubject<any>(1)

      combineLatest(
         [this.rawState$, loadableValues$],
         (state, loadableValues) => ({
            ...state,
            loadableValues: { ...state.loadableValues, ...loadableValues }
         })
      ).subscribe(rawState$)

      const initialState = {
         ...this.__rawState,
         loadableValues: { ...this.__rawState.loadableValues, ...allLoading }
      }

      return new LenrixStore(
         initialState,
         rawState$,
         this.registerHandlers,
         this.context,
         this.path + '.loadFromStream()'
      )
   }

   load<LoadableValues>(loaders: {
      [LK in keyof LoadableValues]: Observable<LoadableValues[LK]>
   }): any {
      const loadableKeys = Object.keys(loaders) as (keyof LoadableValues)[]

      const allLoading = {} as Record<
         keyof LoadableValues,
         { status: 'loading'; error: undefined; value: undefined }
      >
      loadableKeys.forEach(
         key =>
            (allLoading[key] = {
               status: 'loading',
               error: undefined,
               value: undefined
            })
      )

      const initialState = {
         ...this.__rawState,
         loadableValues: { ...this.__rawState.loadableValues, ...allLoading }
      }
      // TODO dispatchLoading()

      const rawState$ = new ReplaySubject<any>(1)

      const loadableValues$ = merge(
         loadableKeys.map(key =>
            loaders[key].pipe(
               map(result => ({
                  [key]: {
                     status: 'loaded',
                     value: result,
                     error: undefined
                  }
               })),
               catchError((error: Error) =>
                  of({
                     [key]: { status: 'error', value: undefined, error }
                  })
               ) // TODO Recover from Error
            )
         )
      ).pipe(
         mergeAll(),
         scan((acc, loadableValues) => {
            return { ...acc, ...loadableValues } as any
         }, allLoading),
         startWith(allLoading)
      )

      combineLatest(
         [this.rawState$, loadableValues$],
         (state, loadableValues) => ({
            ...state,
            loadableValues: { ...state.loadableValues, ...loadableValues }
         })
      ).subscribe(rawState$)

      return new LenrixStore(
         initialState,
         rawState$,
         this.registerHandlers,
         this.context,
         this.path + '.load()'
      )
   }

   //////////////
   // COMPUTE //
   ////////////

   computeFromFields<
      K extends StoreDataKey<Type>,
      ComputedValues extends object
   >(
      keys: K[],
      computers: {
         [CK in keyof ComputedValues]: (
            fields: Pick<LoadedState<Type>['data'], K>,
            store: LightStore<Type>
         ) => ComputedValues[CK]
      }
   ): any {
      const rawState$ = new ReplaySubject<any>(1)

      const computedKeys = Object.keys(computers) as Array<keyof ComputedValues>

      const computedValues$ = this.pickFromState$(keys).pipe(
         map(state => {
            const { status } = aggregateStatusAndErrors(state)
            let fromLoadable = false
            const loadableKeys = Object.keys(state.loadableValues)
            keys.forEach(key => {
               if (loadableKeys.includes(key as string)) {
                  fromLoadable = true
               }
            })
            const data = toData(state)
            const computedValues = {} as any
            computedKeys.forEach(key => {
               if (fromLoadable) {
                  if (status === 'loaded') {
                     const value = computers[key](data as any, this.light) // TODO catch errors ?
                     computedValues[key] = { status, value, error: undefined }
                  } else {
                     computedValues[key] = {
                        status,
                        value: undefined,
                        error: undefined
                     }
                  }
               } else {
                  computedValues[key] =
                     status === 'loaded'
                        ? computers[key](data as any, this.light) // TODO catch errors ?
                        : undefined
               }
            })
            return { computedValues, fromLoadable, status }
         }),
         scan((previous, next) => {
            if (next.status === 'loaded')
               this.context.dispatchCompute(
                  this as any,
                  previous,
                  next.computedValues
               )
            return next
         })
      )

      this.rawState$
         .pipe(
            withLatestFrom(computedValues$),
            map(([state, { computedValues, fromLoadable }]) =>
               fromLoadable
                  ? {
                       ...state,
                       loadableValues: {
                          ...state.loadableValues,
                          ...computedValues
                       }
                    }
                  : {
                       ...state,
                       values: { ...state.values, ...computedValues }
                    }
            )
         )
         .subscribe(rawState$)

      return new LenrixStore(
         this.__rawState,
         rawState$,
         this.registerHandlers,
         this.context,
         this.path + `.computeFromFields(${keys.join(', ')})`
      )
   }

   computeFromStream<Input, Computers extends object>(
      input$: Observable<Input>,
      computers: Computers
   ): any {
      const rawState$ = new ReplaySubject<any>(1)

      const computedKeys = Object.keys(computers) as (keyof Computers)[]

      const allLoading = {} as Record<
         keyof Computers,
         { status: 'loading'; error: undefined; value: undefined }
      >
      computedKeys.forEach(
         key =>
            (allLoading[key] = {
               status: 'loading',
               error: undefined,
               value: undefined
            })
      )

      const computedValues$ = input$.pipe(
         map(input => {
            const computedValues = {} as any
            computedKeys.forEach(key => {
               computedValues[key] = {
                  status: 'loaded',
                  value: (computers[key] as any)(input),
                  error: undefined
               }
            })
            return computedValues
         })
      )

      combineLatest(
         [this.rawState$, computedValues$],
         (state, computedValues) => ({
            ...state,
            loadableValues: { ...state.loadableValues, ...computedValues }
         })
      ).subscribe(rawState$)

      const initialState = {
         ...this.__rawState,
         loadableValues: { ...this.__rawState.loadableValues, ...allLoading }
      }

      return new LenrixStore(
         initialState,
         rawState$,
         this.registerHandlers,
         this.context,
         this.path + '.computeFromStream()'
      )
   }

   ////////////
   // FOCUS //
   //////////

   focusPath(...params: any[]): any {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handles spread keys
      const passedDownKeys = Array.isArray(params[1]) ? params[1] : []
      const focusedLens = (this.localLens as any).focusPath(...keys)
      const toFocusedState = (
         state: StoreStateRaw<Type>
      ): StoreStateRaw<any> => {
         const reduxState = focusedLens.read(state.reduxState)
         if (!isPlainObject(reduxState))
            throw Error(
               'Can NOT focus on redux state slice that is not a plain object'
            )
         const pickedState = pickRawState(state, passedDownKeys)
         passedDownKeys.forEach(key => {
            if (key in state.reduxState) {
               // TODO warn if key already in values ?
               ;(pickedState.values as any)[key] = (state.reduxState as any)[
                  key
               ]
            }
         })
         return {
            ...pickedState,
            reduxState
         }
      }
      const registerHandlers: (
         handlersToRegister: FocusedHandlers<any>
      ) => void = handlersToRegister => {
         const handlers = {} as any
         Object.keys(handlersToRegister).forEach(actionType => {
            const handler = handlersToRegister[actionType] as any
            handlers[actionType] = (payload: any) =>
               focusedLens.update(handler(payload))
         })
         return this.registerHandlers(handlers as any)
      }
      const rawState$ = new ReplaySubject<any>(1)
      this.rawState$
         .pipe(map(toFocusedState), distinctUntilChanged(stateEquals))
         .subscribe(rawState$)
      return new LenrixStore(
         toFocusedState(this.__rawState),
         rawState$,
         registerHandlers,
         this.context,
         this.path + focusedLens.path
      )
   }

   focusFields(...params: any[]): any {
      const keys: StoreDataKey<Type>[] = Array.isArray(params[0])
         ? [...params[0], ...(params[1] || [])]
         : params // Handle spread keys
      const path = this.path + '.focusFields(' + keys.join(',') + ')'

      const rawState$ = new ReplaySubject<any>(1)
      this.pickFromState$(keys).subscribe(rawState$)

      const initialState = pickRawState(this.currentState, keys)

      return new LenrixStore(
         initialState,
         rawState$,
         this.registerHandlers as any,
         this.context,
         path
      )
   }
}
