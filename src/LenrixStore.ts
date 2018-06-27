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
   filter,
   map,
   scan,
   skip,
   startWith
} from 'rxjs/operators'

import { ActionObject } from './ActionObject'
import { ComputedState } from './ComputedState'
import { FocusedHandlers } from './FocusedHandlers'
import { FocusedReadonlySelection } from './FocusedReadonlySelection'
import { LenrixLightStore } from './LenrixLightStore'
import { LightStore } from './LightStore'
import { shallowEquals } from './shallowEquals'
import { HmrHandlers, Store } from './Store'
import { StoreContext } from './StoreContext'

export interface ActionMeta {
   store: {
      name?: string
      path: string
      currentState: any
      computedValues?: any
   }
}

export interface StoreData<
   Type extends {
      state: any
      computedValues: object
   }
> {
   state: Type['state']
   computedValues: Type['computedValues']
}

function dataEquals<Type extends { state: any; computedValues: object }>(
   previous: StoreData<Type>,
   next: StoreData<Type>
): boolean {
   return (
      shallowEquals(previous.state, next.state) &&
      shallowEquals(previous.computedValues, next.computedValues)
   )
}

export class LenrixStore<
   Type extends {
      state: any
      computedValues: object
      actions: object
      dependencies: object
   },
   RootState extends object
> implements Store<Type> {
   public name?: string

   public readonly localLens: UnfocusedLens<Type['state']> = createLens<
      Type['state']
   >()
   public readonly localReadonlyLens: UnfocusedLens<
      ComputedState<Type>
   > = createLens<ComputedState<Type>>()

   private readonly dataSubject: BehaviorSubject<StoreData<Type>>
   private readonly computedStateSubject: BehaviorSubject<ComputedState<Type>>

   private readonly light: LightStore<Type>

   get computedState$(): Observable<ComputedState<Type>> {
      return this.computedStateSubject
   }

   get currentComputedState(): ComputedState<Type> {
      return this.computedStateSubject.getValue()
   }

   get state$(): Observable<Type['state']> {
      return this.dataSubject.pipe(map(_ => _.state))
   }

   get currentState(): Type['state'] {
      return this.dataSubject.getValue().state
   }

   get computedValues$(): Observable<Type['computedValues']> {
      return this.dataSubject.pipe(
         map(data => data.computedValues),
         distinctUntilChanged()
      )
   }

   get currentComputedValues(): Type['computedValues'] {
      return this.dataSubject.getValue().computedValues
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
      private readonly dataToComputedState: (
         data: StoreData<Type>
      ) => ComputedState<Type>,
      private readonly initialData: {
         state: Type['state']
         computedValues: Type['computedValues']
      },
      private readonly registerHandlers: (
         handlers: FocusedHandlers<Type>
      ) => void,
      private readonly context: StoreContext,
      public readonly path: string
   ) {
      this.light = new LenrixLightStore(this)
      this.dataSubject = new BehaviorSubject(initialData)
      this.computedStateSubject = new BehaviorSubject(
         dataToComputedState(initialData)
      )
      data$.subscribe(this.dataSubject)
      this.dataSubject
         .pipe(map(dataToComputedState))
         .subscribe(this.computedStateSubject)
   }

   public hmrUpdate({
      epics,
      handlers,
      effects
   }: HmrHandlers<FocusedHandlers<Type>>): void {
      !!handlers && this.registerHandlers(handlers)

      !!epics && this.context.registerEpics(epics, this as any)

      !!effects && this.context.registerSideEffects(effects, this as any)
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
      const actionTypes = Object.keys(handlers)
      const meta: ActionMeta = {
         store: {
            name: this.name || '',
            path: this.path,
            currentState: this.currentState,
            computedValues: this.currentComputedValues
         }
      }
      return new LenrixStore(
         this.dataSubject,
         (data: any) => ({ ...data.state, ...data.computedValues }),
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
            computedValues: this.currentComputedValues
         }
      }
   }

   public dispatch(action: ActionObject<any>) {
      this.context.dispatchActionObject(action, this.makeActionMeta())
   }

   public epics(epics: any): Store<Type> {
      this.context.registerEpics(epics, this as any)
      return new LenrixStore(
         this.dataSubject,
         (data: any) => ({ ...data.state, ...data.computedValues }),
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
         (data: any) => ({ ...data.state, ...data.computedValues }),
         this.initialData,
         this.registerHandlers,
         this.context,
         this.path
      )
   }

   ///////////
   // READ //
   /////////

   public pick<K extends keyof ComputedState<Type>>(
      ...keys: K[]
   ): Observable<Pick<ComputedState<Type>, K>> {
      return this.computedStateSubject.pipe(
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
      const selectedFields = selection(this.localLens)
      if (typeof selectedFields === 'function')
         throw Error(
            'LenrixStore.cherryPick() does not accept higher order functions as arguments'
         )
      return this.computedState$.pipe(
         map(state => cherryPick(state, selectedFields)),
         distinctUntilChanged(shallowEquals)
      )
   }

   public pluck(...params: any[]): Observable<any> {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      return this.computedStateSubject.pipe(
         map(state => keys.reduce((acc: any, key: any) => acc[key], state)),
         distinctUntilChanged()
      )
   }

   ///////////////
   // OPTIMIZE //
   /////////////

   public filter(
      predicate: (
         state: { [K in keyof ComputedState<Type>]: ComputedState<Type>[K] }
      ) => boolean
   ): Store<Type> {
      return new LenrixStore(
         this.dataSubject.pipe(
            filter(data => {
               const state = this.currentComputedState
               return predicate(state)
            })
         ),
         (data: any) => ({ ...data.state, ...data.computedValues }),
         this.initialData,
         this.registerHandlers,
         this.context,
         this.path
      )
   }

   //////////////
   // COMPUTE //
   ////////////

   public compute<ComputedValues>(
      computer: (
         state: ComputedState<Type>,
         store: LightStore<Type>
      ) => ComputedValues
   ): any {
      const dataToComputedValues = (
         data: StoreData<Type>
      ): Type['computedValues'] & ComputedValues => {
         const computedState = {
            ...(data.state as any),
            ...(data.computedValues as any)
         }
         const newComputedValues = computer(computedState, this.light)
         if (typeof newComputedValues === 'function')
            throw Error(
               'LenrixStore.compute() does not accept higher order functions as arguments'
            )
         this.context.dispatchCompute(
            this as any,
            data.computedValues,
            newComputedValues
         )
         return {
            ...(data.computedValues as any),
            ...(newComputedValues as any)
         }
      }
      const initialData: StoreData<Type> = {
         state: this.initialData.state,
         computedValues: dataToComputedValues(this.initialData)
      }
      const data$ = this.dataSubject.pipe(
         skip(1),
         map(data => ({
            state: data.state,
            computedValues: dataToComputedValues(data)
         }))
      )
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.computedValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.compute()'
      )
   }

   public computeFrom<
      Selection extends PlainObject,
      ComputedValues extends PlainObject
   >(
      selection: FocusedReadonlySelection<Type, Selection>,
      computer: (
         selection: Selection,
         store: LightStore<Type>
      ) => ComputedValues
   ): any {
      const select = (data: StoreData<Type>): Selection =>
         cherryPick(this.dataToComputedState(data), selection(this.localLens))
      return this.computeFromSelector(select, computer)
   }

   public computeFromFields<
      K extends keyof ComputedState<Type>,
      ComputedValues extends PlainObject
   >(
      fields: K[],
      computer: (
         fields: Pick<ComputedState<Type>, K>,
         store: LightStore<Type>
      ) => ComputedValues
   ): any {
      const select = (data: StoreData<Type>): Pick<ComputedState<Type>, K> => {
         const selected = {} as any
         const computedState = this.dataToComputedState(data)
         fields.forEach(field => (selected[field] = computedState[field]))
         return selected
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
         previouslyComputedValues?: ComputedValues
      ): ComputedValues => {
         const computedValues = computer(selection, this.light)
         this.context.dispatchCompute(
            this as any,
            previouslyComputedValues,
            computedValues
         )
         return computedValues
      }
      const initialComputedValues = doCompute(initialSelection)
      const initialData = {
         state: this.initialData.state,
         computedValues: {
            ...(this.initialData.computedValues as any),
            ...(initialComputedValues as any)
         }
      }
      const data$ = this.dataSubject.pipe(
         map(data => ({ data, selection: selector(data) })),
         scan(
            (previous, next) => {
               const { data, selection } = next
               const locallyComputedValues = shallowEquals(
                  selection,
                  previous.selection
               )
                  ? (previous as any).locallyComputedValues
                  : doCompute(
                       next.selection,
                       (previous as any).locallyComputedValues
                    )
               return { data, selection, locallyComputedValues } as any // TODO Remove as any
            },
            {
               data: this.initialData,
               selection: initialSelection,
               locallyComputedValues: initialComputedValues
            }
         ),
         map(({ data, locallyComputedValues }) => ({
            state: data.state,
            computedValues: {
               ...(data.computedValues as any),
               ...(locallyComputedValues as any)
            }
         })),
         skip(1)
      )
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.computedValues }),
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
         state$: Observable<ComputedState<Type>>
      ) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const computedValues$ = computer$(this.computedStateSubject).pipe(
         startWith(initialValues),
         scan((previous, next) => {
            this.context.dispatchCompute(this as any, previous, next)
            return next
         })
      )
      const data$ = combineLatest(
         this.dataSubject,
         computedValues$,
         (data, computedValues) => ({
            state: data.state,
            computedValues: {
               ...(data.computedValues as any),
               ...(computedValues as any)
            }
         })
      )
      const initialData: StoreData<{
         state: Type['state']
         computedValues: Type['computedValues'] & ComputedValues
      }> = initialValues
         ? {
              state: this.initialData.state,
              computedValues: {
                 ...(this.initialData.computedValues as any),
                 ...(initialValues as any)
              }
           }
         : this.initialData
      return new LenrixStore(
         data$.pipe(skip(1)),
         (data: any) => ({ ...data.state, ...data.computedValues }),
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
      ComputedValues extends PlainObject
   >(
      selection: FocusedReadonlySelection<Type, Selection>,
      computer$: (
         selection$: Observable<Selection>
      ) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const select = (data: StoreData<Type>): Selection =>
         cherryPick(this.dataToComputedState(data), selection(this.localLens))
      return this.computeFromSelector$(select, computer$, initialValues)
   }

   public computeFromFields$<
      K extends keyof ComputedState<Type>,
      ComputedValues extends PlainObject
   >(
      fields: K[],
      computer$: (
         fields$: Observable<Pick<ComputedState<Type>, K>>
      ) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const select = (data: StoreData<Type>): Pick<ComputedState<Type>, K> => {
         const selected = {} as any
         const computedState = this.dataToComputedState(data)
         fields.forEach(field => (selected[field] = computedState[field]))
         return selected
      }
      return this.computeFromSelector$(select, computer$, initialValues)
   }

   private computeFromSelector$<
      Selection extends PlainObject,
      ComputedValues extends PlainObject
   >(
      selector: (data: StoreData<Type>) => Selection,
      computer$: (
         selection$: Observable<Selection>
      ) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const initialData: StoreData<{
         state: Type['state']
         computedValues: Type['computedValues'] & ComputedValues
      }> = initialValues
         ? {
              state: this.initialData.state,
              computedValues: {
                 ...(this.initialData.computedValues as any),
                 ...(initialValues as any)
              }
           }
         : this.initialData
      const newComputedValues$ = this.dataSubject.pipe(
         map(selector),
         computer$,
         scan((previous, next) => {
            this.context.dispatchCompute(this as any, previous, next)
            return next
         })
      )
      const data$ = combineLatest(
         this.dataSubject,
         newComputedValues$,
         (data, newComputedValues) => ({
            state: data.state,
            computedValues: {
               ...(data.computedValues as any),
               ...(newComputedValues as any)
            }
         })
      )

      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.computedValues }),
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
      const computedValueKeys: Array<keyof Type['computedValues']> =
         params.length === 2 && Array.isArray(params[1]) ? params[1] : []
      const toFocusedData = (data: StoreData<Type>) => {
         const state = focusedLens.read(data.state)
         const computedValues: Partial<Type['computedValues']> = {}
         computedValueKeys.forEach(
            key => (computedValues[key] = data.computedValues[key])
         )
         return { state, computedValues }
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
            distinctUntilChanged(
               (previous, next) =>
                  previous.state === next.state &&
                  shallowEquals(previous.computedValues, next.computedValues)
            )
         ),
         (data: any) =>
            Array.isArray(data.state) || typeof data.state !== 'object'
               ? data.state
               : { ...data.state, ...data.computedValues },
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
      const computedValueKeys: Array<keyof Type['computedValues']> =
         params.length === 2 && Array.isArray(params[1]) ? params[1] : []
      const toPickedData = (data: StoreData<Type>) => {
         const state = pickFields(data.state)
         const computedValues: Partial<Type['computedValues']> = {}
         computedValueKeys.forEach(
            key => (computedValues[key] = data.computedValues[key])
         )
         return { state, computedValues }
      }
      return new LenrixStore(
         this.dataSubject.pipe(
            map(toPickedData),
            distinctUntilChanged(dataEquals)
         ),
         (data: any) => ({ ...data.state, ...data.computedValues }),
         toPickedData(this.initialData),
         this.registerHandlers as any,
         this.context,
         path
      )
   }

   public recompose(...params: any[]): any {
      const focusedSelection = params[0]
      const computedValueKeys: Array<keyof Type['computedValues']> =
         params[1] || []
      const fields = focusedSelection(this.localLens) as FieldLenses<
         Type['state'],
         any
      >
      // if (typeof params === 'function') throw Error('recompose() does not accept functions as arguments.') // TODO Test error message
      const recomposedLens = (this.localLens as any).recompose(fields)
      const path = this.path + '.' + recomposedLens.path
      const toRecomposedData = (data: StoreData<Type>) => {
         const state = recomposedLens.read(data.state)
         const computedValues: Partial<Type['computedValues']> = {}
         computedValueKeys.forEach(
            key => (computedValues[key] = data.computedValues[key])
         )
         return { state, computedValues }
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
            skip(1)
         ),
         (data: any) => ({ ...data.state, ...data.computedValues }),
         toRecomposedData(this.initialData),
         registerHandlers,
         this.context,
         path
      )
   }
}
