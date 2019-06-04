import {
   cherryPick,
   createLens,
   FieldLenses,
   PlainObject,
   UnfocusedLens
} from 'immutable-lens'
import { BehaviorSubject, combineLatest, Observable } from 'rxjs'
import {
   distinctUntilChanged,
   map,
   scan,
   skip,
   startWith
} from 'rxjs/operators'

import { LenrixLightStore } from './LenrixLightStore'
import { LightStore } from './LightStore'
import { shallowEquals } from './shallowEquals'
import { Store } from './Store'
import { StoreContext } from './StoreContext'
import { ActionObject } from './util/ActionObject'
import { ActionObservable } from './util/ActionObservable'
import { FocusedHandlers } from './util/FocusedHandlers'
import { FocusedReadonlySelection } from './util/FocusedReadonlySelection'
import { OutputState } from './util/OutputState'

export interface ActionMeta {
   store: {
      name?: string
      path: string
      currentState: any
      readonlyValues?: any
   }
}

export interface StoreData<
   Type extends {
      state: unknown & PlainObject
      readonlyValues: PlainObject
   }
> {
   state: Type['state']
   readonlyValues: Type['readonlyValues']
}

function dataEquals<Type extends { state: any; readonlyValues: object }>(
   previous: StoreData<Type>,
   next: StoreData<Type>
): boolean {
   return (
      shallowEquals(previous.state, next.state) &&
      shallowEquals(previous.readonlyValues, next.readonlyValues)
   )
}

export class LenrixStore<
   Type extends {
      state: any
      readonlyValues: object
      actions: object
      dependencies: object
   }
> implements Store<Type> {
   public name?: string

   public readonly localLens: UnfocusedLens<Type['state']> = createLens<
      Type['state']
   >()
   public readonly localReadonlyLens: UnfocusedLens<
      OutputState<Type>
   > = createLens<OutputState<Type>>()
   public readonly actions: any = {}

   private readonly dataSubject: BehaviorSubject<StoreData<Type>>
   private readonly outputStateSubject: BehaviorSubject<OutputState<Type>>

   private readonly light: LightStore<Type>

   // TODO Deprecate
   get computedState$(): Observable<OutputState<Type>> {
      return this.outputStateSubject
   }

   // TODO Deprecate
   get currentComputedState(): OutputState<Type> {
      return this.outputStateSubject.getValue()
   }

   get state$(): Observable<OutputState<Type>> {
      return this.outputStateSubject
   }

   get currentState(): OutputState<Type> {
      return this.outputStateSubject.getValue()
   }

   get action$(): ActionObservable<Type['actions']> {
      return this.context.action$
   }

   private get currentReadonlyValues(): Type['readonlyValues'] {
      return this.dataSubject.getValue().readonlyValues
   }

   // getState$(this: LenrixStore<Type & { state: PlainObject<Type['state']>}, RootState>): Observable<ComputedState<Type>>
   // getState$(): Observable<Type['state']>
   // getState$(): Observable<ComputedState<Type> | Type['state']> {
   //    return this.computedState$
   // }

   // getState(this: LenrixSdatatore<Type & { state: PlainObject<Type['state']>}, RootState>): ComputedState<Type>
   // getState(): Type['state']
   // getState(): ComputedState<Type> | Type['state'] {
   //    return this.currentState
   // }

   constructor(
      data$: Observable<StoreData<Type>>,
      private readonly dataToOutputState: (
         data: StoreData<Type>
      ) => OutputState<Type>,
      private readonly initialData: {
         state: Type['state']
         readonlyValues: Type['readonlyValues']
      },
      private readonly registerHandlers: (
         handlers: FocusedHandlers<Type>
      ) => void,
      private readonly context: StoreContext,
      public readonly path: string
   ) {
      this.light = new LenrixLightStore(this)
      this.dataSubject = new BehaviorSubject(initialData)
      this.outputStateSubject = new BehaviorSubject(
         dataToOutputState(initialData)
      )
      data$.subscribe(this.dataSubject)
      this.dataSubject
         .pipe(map(dataToOutputState))
         .subscribe(this.outputStateSubject)
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

   public actionTypes<NewActions>(): any {
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
         this.dataSubject,
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         this.initialData,
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
            currentState: this.currentState,
            readonlyValues: this.currentReadonlyValues
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
      return new LenrixStore(
         this.dataSubject,
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         this.initialData,
         this.registerHandlers,
         this.context,
         this.path
      )
   }

   public sideEffects(effects: any): Store<Type> {
      this.context.registerSideEffects(effects, this as any)
      return new LenrixStore(
         this.dataSubject,
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         this.initialData,
         this.registerHandlers,
         this.context,
         this.path
      )
   }

   ///////////
   // READ //
   /////////

   public pick<K extends keyof OutputState<Type>>(
      ...keys: K[]
   ): Observable<Pick<OutputState<Type>, K>> {
      return this.outputStateSubject.pipe(
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
      return this.computedState$.pipe(
         map(state => cherryPick(state, selectedFields as any)),
         distinctUntilChanged(shallowEquals)
      ) as any
   }

   public pluck(...params: any[]): Observable<any> {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      return this.outputStateSubject.pipe(
         map(state => keys.reduce((acc: any, key: any) => acc[key], state)),
         distinctUntilChanged()
      )
   }

   //////////////
   // COMPUTE //
   ////////////

   public compute<ComputedValues>(
      computer: (
         state: OutputState<Type>,
         store: LightStore<Type>
      ) => ComputedValues
   ): any {
      const dataToReadonlyValues = (
         data: StoreData<Type>
      ): Type['readonlyValues'] & ComputedValues => {
         const outputState = {
            ...(data.state as any),
            ...(data.readonlyValues as any)
         }
         const computedValues = computer(outputState, this.light)
         if (computedValues === undefined)
            throw Error(
               'LenrixStore.compute() provided function MUST return an object (empty objects are allowed)'
            )
         if (typeof computedValues === 'function')
            throw Error(
               'LenrixStore.compute() does not accept higher order functions as arguments'
            )
         this.context.dispatchCompute(
            this as any,
            data.readonlyValues,
            computedValues
         )
         return {
            ...(data.readonlyValues as any),
            ...(computedValues as any)
         }
      }
      const initialData: StoreData<Type> = {
         state: this.initialData.state,
         readonlyValues: dataToReadonlyValues(this.initialData)
      }
      const data$ = this.dataSubject.pipe(
         skip(1),
         map(data => ({
            state: data.state,
            readonlyValues: dataToReadonlyValues(data)
         }))
      )
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.compute()'
      )
   }

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
         cherryPick(this.dataToOutputState(data), selection(this.localLens))
      return this.computeFromSelector(select, computer)
   }

   public computeFromFields<
      K extends keyof OutputState<Type>,
      readonlyValues extends PlainObject
   >(
      fields: K[],
      computer: (
         fields: Pick<OutputState<Type>, K>,
         store: LightStore<Type>
      ) => readonlyValues
   ): any {
      const select = (data: StoreData<Type>): Pick<OutputState<Type>, K> => {
         const selected = {} as any
         const outputState = this.dataToOutputState(data)
         fields.forEach(field => (selected[field] = outputState[field]))
         return selected
      }
      return this.computeFromSelector(select, computer)
   }

   public computeFromField<
      K extends keyof OutputState<Type>,
      readonlyValues extends PlainObject
   >(
      field: K,
      computer: (
         field: OutputState<Type>[K],
         store: LightStore<Type>
      ) => readonlyValues
   ): any {
      const select = (data: StoreData<Type>): OutputState<Type>[K] => {
         const outputState = this.dataToOutputState(data)
         return outputState[field]
      }
      return this.computeFromSelector(select, computer)
   }

   private computeFromSelector<
      Selection extends PlainObject,
      ComputedValues extends PlainObject
   >(
      selector: (data: StoreData<Type>) => Selection,
      computer: (
         selection: Selection,
         store: LightStore<Type>
      ) => ComputedValues
   ): any {
      const initialSelection = selector(this.initialData)
      const doCompute = (
         selection: Selection,
         previouslyreadonlyValues?: ComputedValues
      ): ComputedValues => {
         const computedValues = computer(selection, this.light)
         if (computedValues === undefined)
            throw Error(
               'LenrixStore.computeFrom() and .computeFromFields() provided function MUST return an object (empty objects are allowed)'
            )
         if (typeof computedValues === 'function')
            throw Error(
               'LenrixStore.computeFrom() and .computeFromFields() does not accept higher order functions as arguments'
            )
         this.context.dispatchCompute(
            this as any,
            previouslyreadonlyValues,
            computedValues
         )
         return computedValues
      }
      const initialComputedValues = doCompute(initialSelection)
      const initialData = {
         state: this.initialData.state,
         readonlyValues: {
            ...(this.initialData.readonlyValues as any),
            ...(initialComputedValues as any)
         }
      }
      const data$ = this.dataSubject.pipe(
         map(data => ({ data, selection: selector(data as any) })) as any, // TODO Remove any
         scan(
            (previous, next) => {
               const { data, selection } = next
               const locallyComputedValues = shallowEquals(
                  selection,
                  previous.selection
               )
                  ? (previous as any).locallyComputedValues // TODO Test breaking this line
                  : doCompute(
                       next.selection,
                       (previous as any).locallyComputedValues // TODO Test breaking this line
                    )
               return { data, selection, locallyComputedValues } as any // TODO Remove as any
            },
            {
               data: this.initialData,
               selection: initialSelection,
               locallyComputedValues: initialComputedValues // TODO Test breaking this line
            }
         ),
         map(({ data, locallyComputedValues }) => ({
            state: data.state,
            readonlyValues: {
               ...(data.readonlyValues as any),
               ...(locallyComputedValues as any)
            }
         })),
         skip(1)
      )
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.computeFrom()'
      )
   }

   ////////////////////
   // COMPUTE ASYNC //
   //////////////////

   public compute$<ComputedValues>(
      computer$: (
         state$: Observable<OutputState<Type>>
      ) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const readonlyValues$ = computer$(this.outputStateSubject).pipe(
         startWith(initialValues),
         scan((previous, next) => {
            this.context.dispatchCompute(this as any, previous, next)
            return next
         })
      )
      const data$ = combineLatest(
         this.dataSubject,
         readonlyValues$,
         (data, readonlyValues) => ({
            state: data.state,
            readonlyValues: {
               ...(data.readonlyValues as any),
               ...(readonlyValues as any)
            }
         })
      )
      const initialData: StoreData<{
         state: Type['state']
         readonlyValues: Type['readonlyValues'] & ComputedValues
      }> = initialValues
         ? {
              state: this.initialData.state,
              readonlyValues: {
                 ...(this.initialData.readonlyValues as any),
                 ...(initialValues as any)
              }
           }
         : this.initialData
      return new LenrixStore(
         data$.pipe(skip(1) as any),
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path +
            '.compute$(' +
            Object.keys(initialValues || {}).join(', ') +
            ')'
      )
   }

   public computeFrom$<
      Selection extends PlainObject,
      readonlyValues extends PlainObject
   >(
      selection: FocusedReadonlySelection<Type, Selection>,
      computer$: (
         selection$: Observable<Selection>
      ) => Observable<readonlyValues>,
      initialValues?: readonlyValues
   ): any {
      const select = (data: StoreData<Type>): Selection =>
         cherryPick(this.dataToOutputState(data), selection(this.localLens))
      return this.computeFromSelector$(select, computer$, initialValues)
   }

   public computeFromFields$<
      K extends keyof OutputState<Type>,
      readonlyValues extends PlainObject
   >(
      fields: K[],
      computer$: (
         fields$: Observable<Pick<OutputState<Type>, K>>
      ) => Observable<readonlyValues>,
      initialValues?: readonlyValues
   ): any {
      const select = (data: StoreData<Type>): Pick<OutputState<Type>, K> => {
         const selected = {} as any
         const outputState = this.dataToOutputState(data)
         fields.forEach(field => (selected[field] = outputState[field]))
         return selected
      }
      return this.computeFromSelector$(select, computer$, initialValues)
   }

   private computeFromSelector$<
      Selection extends PlainObject,
      readonlyValues extends PlainObject
   >(
      selector: (data: StoreData<Type>) => Selection,
      computer$: (
         selection$: Observable<Selection>
      ) => Observable<readonlyValues>,
      initialValues?: readonlyValues
   ): any {
      const initialData: StoreData<{
         state: Type['state']
         readonlyValues: Type['readonlyValues'] & readonlyValues
      }> = initialValues
         ? {
              state: this.initialData.state,
              readonlyValues: {
                 ...(this.initialData.readonlyValues as any),
                 ...(initialValues as any)
              }
           }
         : this.initialData
      const newreadonlyValues$ = this.dataSubject.pipe(
         map(selector),
         computer$,
         scan((previous, next) => {
            this.context.dispatchCompute(this as any, previous, next)
            return next
         })
      )
      const data$ = combineLatest(
         this.dataSubject,
         newreadonlyValues$,
         (data, newreadonlyValues) => ({
            state: data.state,
            readonlyValues: {
               ...(data.readonlyValues as any),
               ...(newreadonlyValues as any)
            }
         })
      )

      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.computeFrom$()'
      )
   }

   ////////////
   // FOCUS //
   //////////

   public focusPath(...params: any[]): any {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      const focusedLens = (this.localLens as any).focusPath(...keys)
      const readonlyValueKeys: Array<keyof OutputState<Type>> =
         params.length === 2 && Array.isArray(params[1]) ? params[1] : []
      const toFocusedData = (data: StoreData<Type>) => {
         const state = focusedLens.read(data.state)
         const readonlyValues: Partial<OutputState<Type>> = {}
         readonlyValueKeys.forEach(key => {
            // TODO Prevent state field and readonly values from having same name (dangerous clash)
            // TODO Merge state and readonly values first ?
            readonlyValues[key] = data.state[key] || data.readonlyValues[key]
         })
         return { state, readonlyValues }
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
      return new LenrixStore(
         this.dataSubject.pipe(
            map(toFocusedData),
            distinctUntilChanged<any>(
               (previous, next) =>
                  previous.state === next.state &&
                  shallowEquals(previous.readonlyValues, next.readonlyValues)
            )
         ),
         (data: any) =>
            Array.isArray(data.state) || typeof data.state !== 'object'
               ? data.state
               : { ...data.state, ...data.readonlyValues },
         toFocusedData(this.initialData),
         registerHandlers,
         this.context,
         this.path + focusedLens.path
      )
   }

   public focusFields(...params: any[]): any {
      const keys: Array<keyof Type['state']> = Array.isArray(params[0])
         ? params[0]
         : params // Handle spread keys
      const path = this.path + '.pick(' + keys.join(',') + ')'
      const pickFields = (state: Type['state']) => {
         const fields: Partial<Type['state']> = {}
         keys.forEach(key => (fields[key] = state[key]))
         return fields
      }
      const readonlyValueKeys: Array<keyof OutputState<Type>> =
         params.length === 2 && Array.isArray(params[1]) ? params[1] : []
      const toPickedData = (data: StoreData<Type>) => {
         const state = pickFields(data.state)
         const readonlyValues: Partial<OutputState<Type>> = {}
         readonlyValueKeys.forEach(key => {
            // TODO Prevent state field and readonly values from having same name (dangerous clash)
            // TODO Merge state and readonly values first ?
            readonlyValues[key] = data.state[key] || data.readonlyValues[key]
         })
         return { state, readonlyValues }
      }
      return new LenrixStore(
         this.dataSubject.pipe(
            map(toPickedData),
            distinctUntilChanged<any>(dataEquals)
         ),
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         toPickedData(this.initialData),
         this.registerHandlers as any,
         this.context,
         path
      )
   }

   public recompose(...params: any[]): any {
      const focusedSelection = params[0]
      const readonlyValueKeys: Array<keyof OutputState<Type>> = params[1] || []
      const fields = focusedSelection(this.localLens) as FieldLenses<
         Type['state'],
         any
      >
      // if (typeof params === 'function') throw Error('recompose() does not accept functions as arguments.') // TODO Test error message
      const recomposedLens = (this.localLens as any).recompose(fields)
      const path = this.path + '.' + recomposedLens.path
      const toRecomposedData = (data: StoreData<Type>) => {
         const state = recomposedLens.read(data.state)
         const readonlyValues: Partial<Type['readonlyValues']> = {}
         readonlyValueKeys.forEach(key => {
            // TODO Prevent state field and readonly values from having same name (dangerous clash)
            // TODO Merge state and readonly values first ?
            readonlyValues[key] = data.state[key] || data.readonlyValues[key]
         })
         return { state, readonlyValues }
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
      return new LenrixStore(
         this.dataSubject.pipe(
            map(toRecomposedData),
            distinctUntilChanged(dataEquals),
            skip(1) as any
         ),
         (data: any) => ({ ...data.state, ...data.readonlyValues }),
         toRecomposedData(this.initialData),
         registerHandlers,
         this.context,
         path
      )
   }

   // computeJoin$<NewreadonlyValues>(computer$: (state$: Observable<State>) => Observable<NewreadonlyValues>, initialValues?: NewreadonlyValues): any {
   //    const data$ = this.data$.mergeMap(data => {
   //       const state = this.dataToState(data)
   //       const newreadonlyValues$ = computer$(Observable.of(state))
   //       return newreadonlyValues$.map(newreadonlyValues => ({
   //          normalizedState: data.normalizedState,
   //          readonlyValues: { ...data.readonlyValues as any, ...newreadonlyValues as any }
   //       }))
   //    })
   //    const initialData: StoreData<NormalizedState, readonlyValues & NewreadonlyValues> = initialValues
   //       ? {
   //          normalizedState: this.initialData.normalizedState,
   //          readonlyValues: { ...this.initialData.readonlyValues as any, ...initialValues as any }
   //       }
   //       : this.initialData
   //    return new LenrixStore(
   //       data$,
   //       (data: any) => ({ ...data.normalizedState, ...data.readonlyValues }),
   //       initialData,
   //       (updater: any) => this.update(updater),
   //       this.path + '.computeJoin$()'
   //    )
   // }
}
