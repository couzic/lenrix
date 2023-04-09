import {
   cherryPick,
   createLens,
   FieldLenses,
   PlainObject,
   UnfocusedLens
} from 'immutable-lens'
import {
   catchError,
   combineLatest,
   distinctUntilChanged,
   filter,
   map,
   mergeWith,
   Observable,
   of,
   ReplaySubject,
   scan,
   switchMap,
   tap,
   withLatestFrom
} from 'rxjs'

import { LenrixLightStore } from './LenrixLightStore'
import { LightStore } from './LightStore'
import { Store } from './Store'
import { dataEquals } from './util/dataEquals'
import { shallowEquals } from './util/shallowEquals'
import { ActionMeta } from './utility-types/ActionMeta'
import { ActionObject } from './utility-types/ActionObject'
import { ActionObservable } from './utility-types/ActionObservable'
import { FocusedHandlers } from './utility-types/FocusedHandlers'
import { FocusedReadonlySelection } from './utility-types/FocusedReadonlySelection'
import { StoreContext } from './utility-types/StoreContext'
import { StoreData } from './utility-types/StoreData'
import { StoreState } from './utility-types/StoreState'
import { StoreType } from './utility-types/StoreType'

export class LenrixStore<Type extends StoreType> implements Store<Type> {
   public name?: string

   public readonly localLens: UnfocusedLens<Type['state']> =
      createLens<Type['state']>()
   public readonly actions: any = {}

   private readonly light: LightStore<Type>

   private lastData: StoreData<Type>

   get currentData() {
      return this.lastData as any
   }

   get state$() {
      return this.data$.pipe(map(data => data.state))
   }

   get currentState() {
      return this.lastData.state
   }

   get action$(): ActionObservable<Type['actions']> {
      return this.context.action$
   }

   constructor(
      readonly initialData: StoreData<Type>,
      public readonly data$: ReplaySubject<StoreData<Type>>,
      private readonly registerHandlers: (
         handlers: FocusedHandlers<Type>
      ) => void,
      private readonly context: StoreContext,
      public readonly path: string
   ) {
      this.light = new LenrixLightStore(this)
      this.lastData = initialData
      data$.subscribe(data => (this.lastData = data))
   }

   ///////////////
   // ACTIVATE //
   /////////////

   public onActivate(callback: (store: Store<Type>) => void) {
      this.context.registerActivationCallback(this, callback)
      return this
   }
   public activate() {
      this.context.activate()
   }

   //////////////
   // ACTIONS //
   ////////////

   public actionTypes(): any {
      return this
   }

   public updates(
      focusHandlers:
         | ((lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type>)
         | FocusedHandlers<Type>
   ) {
      const handlers =
         typeof focusHandlers === 'function'
            ? focusHandlers(this.localLens)
            : focusHandlers
      this.registerHandlers(handlers)
      return new LenrixStore(
         this.initialData,
         this.data$,
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

   public dispatch(action: ActionObject<any>) {
      this.context.dispatchActionObject(action, this.makeActionMeta())
   }

   public action(action: any): any {
      return (payload: any) => this.dispatch({ [action]: payload })
   }

   public epics(epics: any): Store<Type> {
      return this.pureEpics(epics(this.light))
   }

   public pureEpics(epics: any): Store<Type> {
      this.context.registerEpics(epics, this as any)
      return this
   }

   public sideEffects(effects: any): Store<Type> {
      this.context.registerSideEffects(effects, this as any)
      return this
   }

   ///////////
   // READ //
   /////////

   public pick<K extends keyof StoreState<Type>>(
      ...keys: K[]
   ): Observable<Pick<StoreState<Type>, K>> {
      return this.state$.pipe(
         map(state => {
            const subset = {} as any
            keys.forEach(key => (subset[key] = state[key]))
            return subset
         }),
         distinctUntilChanged(shallowEquals)
      )
   }

   public cherryPick<Selection>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      selection: FocusedReadonlySelection<Type, Selection>
   ): Observable<Selection> {
      const selectedFields = selection(this.localLens as any)
      if (typeof selectedFields === 'function')
         throw Error(
            'LenrixStore.cherryPick() does not accept higher order functions as arguments'
         )
      return this.state$.pipe(
         map(state => cherryPick(state, selectedFields as any)),
         distinctUntilChanged(shallowEquals)
      ) as any
   }

   public pluck(...params: any[]): Observable<any> {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      return this.state$.pipe(
         map(state => keys.reduce((acc: any, key: any) => acc[key], state)),
         distinctUntilChanged()
      )
   }

   ///////////
   // LOAD //
   /////////

   public loadFromFields<
      K extends keyof Type['state'] | keyof Type['readonlyValues'],
      LoadedValues extends object
   >(
      fields: K[],
      load: (fields: {
         [P in K]: StoreState<Type>[P]
      }) => Observable<LoadedValues>
   ): any {
      const selectFields = (
         data: StoreData<Type>
      ): {
         data: StoreData<Type>
         selection: Pick<StoreState<Type>, K>
      } => {
         const selection = {} as any
         const outputState = data.state
         fields.forEach(field => (selection[field] = outputState[field]))
         return { data, selection }
      }
      const selection$ = this.data$.pipe(
         filter(data => data.status !== 'error'),
         map(selectFields),
         distinctUntilChanged((previous, next) =>
            shallowEquals(previous.selection, next.selection)
         )
      )
      const loading$ = selection$.pipe(
         tap(({ selection }) =>
            this.context.dispatchLoading(this as any, selection)
         ),
         map(({ data }) => ({
            state: data.state,
            status: 'loading' as const
         }))
      )
      const loadedValuesOrError$ = selection$.pipe(
         map(_ => _.selection),
         switchMap(load),
         tap(loadedValues =>
            this.context.dispatchLoaded(this as any, loadedValues)
         ),
         map(loadedValues => ({ loadedValues })),
         catchError((error: Error) => of({ error }))
      )
      const loadingOrLoadedOrError$ = loading$.pipe(
         mergeWith(loadedValuesOrError$)
      )
      const data$ = new ReplaySubject<any>(1)
      combineLatest([this.data$, loadingOrLoadedOrError$])
         .pipe(
            map(([data, loadingOrLoadedOrError]) => {
               if (data.status === 'error') {
                  return data
               }
               if ('error' in loadingOrLoadedOrError) {
                  return {
                     ...data,
                     status: 'error',
                     error: loadingOrLoadedOrError.error
                  }
               }
               if (
                  data.status === 'loading' &&
                  'loadedValues' in loadingOrLoadedOrError
               ) {
                  return {
                     ...data,
                     state: {
                        ...data.state,
                        ...loadingOrLoadedOrError.loadedValues
                     }
                  }
               }
               if (data.status === 'loading') {
                  return data
               }
               if ('loadedValues' in loadingOrLoadedOrError) {
                  return {
                     status: 'loaded',
                     state: {
                        ...data.state,
                        ...loadingOrLoadedOrError.loadedValues
                     }
                  }
               }
               if (loadingOrLoadedOrError['status'] === 'loading') {
                  return {
                     status: 'loading',
                     state: data.state
                  }
               }
               return data
            })
         )
         .subscribe(data$)
      return new LenrixStore(
         this.currentData,
         data$,
         this.registerHandlers,
         this.context,
         this.path + '.loadFromFields()'
      )
   }

   public waitUntilLoaded(): any {
      const data$ = new ReplaySubject<any>(1)
      this.data$.pipe(filter(_ => _.status === 'loaded')).subscribe(data$)
      return new LenrixStore(
         this.currentData,
         data$,
         this.registerHandlers,
         this.context,
         this.path + '.waitUntilLoaded()'
      )
   }

   //////////////
   // COMPUTE //
   ////////////

   public computeFrom<
      Selection extends PlainObject,
      readonlyValues extends PlainObject
   >(
      selection: FocusedReadonlySelection<Type, Selection>,
      computer: (
         selection: Selection,
         store: LightStore<Type>
      ) => readonlyValues
   ): any {
      const select = (data: StoreData<Type>): Selection =>
         cherryPick(data.state, selection(this.localLens))
      return this.computeFromSelector(select, computer, 'computeFrom')
   }

   public computeFromFields<
      K extends keyof StoreState<Type>,
      readonlyValues extends PlainObject
   >(
      fields: K[],
      computer: (
         fields: Pick<StoreState<Type>, K>,
         store: LightStore<Type>
      ) => readonlyValues
   ): any {
      const select = (data: StoreData<Type>): Pick<StoreState<Type>, K> => {
         const selected = {} as any
         const outputState = data.state
         fields.forEach(field => (selected[field] = outputState[field]))
         return selected
      }
      return this.computeFromSelector(select, computer, 'computeFromFields')
   }

   public computeFromField<
      K extends keyof StoreState<Type>,
      readonlyValues extends PlainObject
   >(
      field: K,
      computer: (
         field: StoreState<Type>[K],
         store: LightStore<Type>
      ) => readonlyValues
   ): any {
      const select = (data: StoreData<Type>): StoreState<Type>[K] => {
         const outputState = data.state
         return outputState[field] // TODO Pass down selection comparator, because currently it will be shallowEqual()
      }
      return this.computeFromSelector(select, computer, 'computeFromField')
   }

   private computeFromSelector<
      Selection extends PlainObject,
      ComputedValues extends PlainObject
   >(
      selector: (data: StoreData<Type>) => Selection,
      computer: (
         selection: Selection,
         store: LightStore<Type>
      ) => ComputedValues,
      functionName: string
   ): any {
      const data$ = new ReplaySubject<any>(1)
      const computedValues$ = this.data$.pipe(
         map(selector),
         distinctUntilChanged(shallowEquals), // TODO Inject comparator function
         map(selection => computer(selection, this.light)),
         scan((previous, next) => {
            this.context.dispatchCompute(this as any, previous, next)
            return next
         })
      )
      this.data$
         .pipe(
            withLatestFrom(computedValues$),
            map(([data, computedValues]) => {
               let error: Error | undefined
               if (computedValues === undefined) {
                  error = new Error(
                     `LenrixStore.${functionName}() provided function MUST return an object (empty objects are allowed)`
                  )
               }
               if (typeof computedValues === 'function') {
                  error = new Error(
                     `LenrixStore.${functionName}() do not accept higher order functions as arguments`
                  )
               }
               if (error !== undefined) {
                  console.error(error)
                  return {
                     status: 'error' as const,
                     state: data.state,
                     error
                  }
               }
               return {
                  ...data,
                  state: { ...data.state, ...computedValues }
               }
            })
         )
         .subscribe(data$)
      return new LenrixStore(
         this.currentData,
         data$,
         this.registerHandlers,
         this.context,
         this.path + `.${functionName}()`
      )
   }

   //////////////
   // COMBINE //
   ////////////

   combineValues<CombinedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      combinedValues$: Observable<CombinedValues>
   ): any {
      const data$ = new ReplaySubject<any>(1)
      combineLatest([this.data$, combinedValues$], (data, combinedValues) => ({
         ...data,
         state: { ...data.state, ...combinedValues }
      })).subscribe(data$)
      return new LenrixStore(
         this.currentData as any,
         data$,
         (this as any).registerHandlers,
         (this as any).context,
         this.path + '.computeFrom$()'
      )
   }

   ////////////
   // FOCUS //
   //////////

   public focusPath(...params: any[]): any {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      const focusedLens = (this.localLens as any).focusPath(...keys)
      const readonlyValueKeys: Array<keyof StoreState<Type>> =
         params.length === 2 && Array.isArray(params[1]) ? params[1] : []
      const toFocusedData = (data: StoreData<Type>): StoreData<any> => {
         const state = focusedLens.read(data.state)
         const readonlyValues: Partial<StoreState<Type>> = {}
         readonlyValueKeys.forEach(key => {
            // TODO Prevent state field and readonly values from having same name (dangerous clash)
            readonlyValues[key] = data.state[key]
         })
         return Array.isArray(state) || typeof state !== 'object'
            ? { ...data, state }
            : {
                 ...data,
                 state: { ...state, ...readonlyValues }
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
      const data$ = new ReplaySubject<any>(1)
      this.data$
         .pipe(map(toFocusedData), distinctUntilChanged(dataEquals))
         .subscribe(data$)
      return new LenrixStore(
         toFocusedData(this.currentData),
         data$,
         registerHandlers,
         this.context,
         this.path + focusedLens.path
      )
   }

   public focusFields(...params: any[]): any {
      const keys: Array<keyof StoreState<Type>> = Array.isArray(params[0])
         ? [...params[0], ...(params[1] || [])]
         : params // Handle spread keys
      const path = this.path + '.pick(' + keys.join(',') + ')'
      const pickFields = (state: StoreState<Type>) => {
         const fields: Partial<StoreState<Type>> = {}
         keys.forEach(key => (fields[key] = state[key]))
         return fields
      }
      const toPickedData = (data: StoreData<Type>) => {
         const state = pickFields(data.state)
         return {
            ...data,
            state
         }
      }
      const data$ = new ReplaySubject<any>(1)
      this.data$
         .pipe(map(toPickedData), distinctUntilChanged(dataEquals))
         .subscribe(data$)
      return new LenrixStore(
         toPickedData(this.currentData),
         data$,
         this.registerHandlers as any,
         this.context,
         path
      )
   }

   public recompose(...params: any[]): any {
      if (typeof params === 'function')
         throw Error('recompose() does not accept functions as arguments.') // TODO Test error message
      const focusedSelection = params[0]
      const readonlyValueKeys: Array<keyof StoreState<Type>> = params[1] || []
      const fields = focusedSelection(this.localLens) as FieldLenses<
         Type['state'],
         any
      >
      const recomposedLens = (this.localLens as any).recompose(fields)
      const path = this.path + '.' + recomposedLens.path
      const toRecomposedData = (data: StoreData<Type>): StoreData<any> => {
         const state = recomposedLens.read(data.state)
         const readonlyValues: Partial<Type['readonlyValues']> = {}
         readonlyValueKeys.forEach(key => {
            // TODO Prevent state field and readonly values from having same name (dangerous clash)
            readonlyValues[key] = data.state[key]
         })
         return { ...data, state: { ...state, ...readonlyValues } }
      }
      const registerHandlers: (
         handlersToRegister: FocusedHandlers<any>
      ) => void = handlersToRegister => {
         const handlers = {} as any
         Object.keys(handlersToRegister).forEach(actionType => {
            const handler = handlersToRegister[actionType] as any
            handlers[actionType] = (payload: any) =>
               recomposedLens.update(handler(payload))
         })
         return this.registerHandlers(handlers as any)
      }
      const data$ = new ReplaySubject<any>(1)
      this.data$
         .pipe(map(toRecomposedData), distinctUntilChanged(dataEquals))
         .subscribe(data$)
      return new LenrixStore(
         toRecomposedData(this.currentData),
         data$,
         registerHandlers,
         this.context,
         path
      )
   }
}
