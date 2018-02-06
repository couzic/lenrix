import 'rxjs/add/observable/combineLatest'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/pluck'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/skip'
import 'rxjs/add/operator/startWith'
import 'rxjs/add/operator/withLatestFrom'

import { cherryPick, createLens, FieldLenses, NotAnArray, UnfocusedLens } from 'immutable-lens'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'

import { ActionObject } from './ActionObject'
import { ComputedState } from './ComputedState'
import { FocusedHandlers } from './FocusedHandlers';
import { FocusedSelection } from './FocusedSelection'
import { shallowEquals } from './shallowEquals'
import { Store } from './Store'
import { StoreContext } from './StoreContext'
import { StoreConfig } from './test-utils/StoreConfig';
import { MergedFields } from './MergedFields';
import { LightStore } from './LightStore';
import { LenrixLightStore } from './LenrixLightStore';

export interface ActionMeta {
   store: {
      name?: string
      path: string
      currentState: any
      computedValues?: any
   }
}

export interface StoreData<Type extends {
   state: any
   computedValues: object
}> {
   state: Type['state']
   computedValues: Type['computedValues']
}

function dataEquals<Type extends { state: any, computedValues: object }>(
   previous: StoreData<Type>,
   next: StoreData<Type>
): boolean {
   return shallowEquals(previous.state, next.state) && shallowEquals(previous.computedValues, next.computedValues)
}

export class LenrixStore<
   Type extends { state: any, computedValues: object, actions: object, dependencies: object },
   RootState extends object> implements Store<Type> {

   name?: string

   readonly localLens: UnfocusedLens<Type['state']> = createLens<Type['state']>()
   readonly localReadonlyLens: UnfocusedLens<ComputedState<Type>> = createLens<ComputedState<Type>>()

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
      return this.dataSubject.map(_ => _.state)
   }

   get currentState(): Type['state'] {
      return this.dataSubject.getValue().state
   }

   get computedValues$(): Observable<Type['computedValues']> {
      return this.dataSubject.map(data => data.computedValues).distinctUntilChanged()
   }

   get currentComputedValues(): Type['computedValues'] {
      return this.dataSubject.getValue().computedValues
   }

   // getState$(this: LenrixStore<Type & { state: object & NotAnArray }, RootState>): Observable<ComputedState<Type>>
   // getState$(): Observable<Type['state']>
   // getState$(): Observable<ComputedState<Type> | Type['state']> {
   //    return this.computedState$
   // }

   // getState(this: LenrixSdatatore<Type & { state: object & NotAnArray }, RootState>): ComputedState<Type>
   // getState(): Type['state']
   // getState(): ComputedState<Type> | Type['state'] {
   //    return this.currentState
   // }

   constructor(
      data$: Observable<StoreData<Type>>,
      private readonly dataToComputedState: (data: StoreData<Type>) => ComputedState<Type>,
      private readonly initialData: { state: Type['state'], computedValues: Type['computedValues'] },
      private readonly registerHandlers: (handlers: FocusedHandlers<Type>) => void,
      private readonly context: StoreContext,
      public readonly path: string,
      private readonly __config: StoreConfig) {
      this.light = new LenrixLightStore(this)
      this.dataSubject = new BehaviorSubject(initialData)
      this.computedStateSubject = new BehaviorSubject(dataToComputedState(initialData))
      data$.subscribe(this.dataSubject)
      this.dataSubject
         .map(dataToComputedState)
         .subscribe(this.computedStateSubject)
   }

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<NewActions>(): any {
      return this
   }

   updates(focusHandlers: ((lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type>) | FocusedHandlers<Type>) {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'updates', params: [focusHandlers] }]
      }
      const handlers = typeof focusHandlers === 'function' ? focusHandlers(this.localLens) : focusHandlers
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
         this.path,
         config
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

   dispatch(action: ActionObject<any>) {
      this.context.dispatchActionObject(action, this.makeActionMeta())
   }

   epics(epics: any): Store<Type> {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'epics', params: [epics] }]
      }
      this.context.registerEpics(epics, this as any)
      return new LenrixStore(
         this.dataSubject,
         (data: any) => ({ ...data.state, ...data.computedValues }),
         this.initialData,
         this.registerHandlers,
         this.context,
         this.path,
         config
      )
   }

   ///////////
   // READ //
   /////////

   pick<K extends keyof ComputedState<Type>>(...keys: K[]): Observable<Pick<ComputedState<Type>, K>> {
      return this.computedStateSubject.map(state => {
         const subset = {} as any
         keys.forEach(key => subset[key] = state[key])
         return subset
      }).distinctUntilChanged(shallowEquals)
   }

   cherryPick<Selection>(
      this: Store<Type & { state: object & NotAnArray }>,
      selection: FocusedSelection<Type, Selection>
   ): Observable<Selection> {
      const selectedFields = selection(this.localLens)
      if (typeof selectedFields === 'function')
         throw Error('LenrixStore.cherryPick() does not accept higher order functions as arguments')
      return this.state$.map(state => cherryPick(state, selectedFields)).distinctUntilChanged(shallowEquals)
   }

   pluck(...params: any[]): Observable<any> {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      return this.computedStateSubject
         .map(state => keys.reduce((acc: any, key: any) => acc[key], state))
         .distinctUntilChanged()
   }

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues>(computer: (state: ComputedState<Type>, store: LightStore<Type>) => ComputedValues): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'compute', params: [computer] }]
      }
      const dataToComputedValues = (data: StoreData<Type>): Type['computedValues'] & ComputedValues => {
         const computedState = { ...data.state as any, ...data.computedValues as any }
         const newComputedValues = computer(computedState, this.light)
         if (typeof newComputedValues === 'function') throw Error('LenrixStore.compute() does not accept higher order functions as arguments')
         this.context.dispatchCompute(this as any, data.computedValues, newComputedValues)
         return {
            ...data.computedValues as any,
            ...newComputedValues as any
         }
      }
      const initialData: StoreData<Type> = {
         state: this.initialData.state,
         computedValues: dataToComputedValues(this.initialData)
      }
      const data$ = this.dataSubject.skip(1).map(data => ({
         state: data.state,
         computedValues: dataToComputedValues(data)
      }))
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.computedValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.compute()',
         config
      )
   }

   computeFrom<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      selection: FocusedSelection<Type, Selection>,
      computer: (selection: Selection, store?: LightStore<Type>) => ComputedValues
   ): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'computeFrom', params: [selection, computer] }]
      }
      const select = (data: StoreData<Type>): Selection => cherryPick(this.dataToComputedState(data), selection(this.localLens))
      return this.computeFromSelector(select, computer, config)
   }

   computeFromFields<K extends keyof ComputedState<Type>, ComputedValues extends object & NotAnArray>(
      fields: K[],
      computer: (fields: Pick<ComputedState<Type>, K>, store?: LightStore<Type>) => ComputedValues
   ): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'computeFromFields', params: [fields, computer] }]
      }
      const select = (data: StoreData<Type>): Pick<ComputedState<Type>, K> => {
         const selected = {} as any
         const computedState = this.dataToComputedState(data)
         fields.forEach(field => selected[field] = computedState[field])
         return selected
      }
      return this.computeFromSelector(select, computer, config)
   }

   private computeFromSelector<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      selector: (data: StoreData<Type>) => Selection,
      computer: (selection: Selection, store?: LightStore<Type>) => ComputedValues,
      config: StoreConfig
   ): any {
      const initialSelection = selector(this.initialData)
      const doCompute = (selection: Selection, previouslyComputedValues?: ComputedValues): ComputedValues => {
         const computedValues = computer(selection, this.light)
         this.context.dispatchCompute(this as any, previouslyComputedValues, computedValues)
         return computedValues
      }
      const initialComputedValues = doCompute(initialSelection)
      const initialData = {
         state: this.initialData.state,
         computedValues: { ...this.initialData.computedValues as any, ...initialComputedValues as any }
      }
      const data$ = this.dataSubject
         .map(data => ({ data, selection: selector(data) }))
         .scan((previous, next) => {
            const { data, selection } = next
            const locallyComputedValues = shallowEquals(selection, previous.selection)
               ? (previous as any).locallyComputedValues
               : doCompute(next.selection, (previous as any).locallyComputedValues)
            return { data, selection, locallyComputedValues }
         }, { data: this.initialData, selection: initialSelection, locallyComputedValues: initialComputedValues })
         .map(({ data, locallyComputedValues }) => ({
            state: data.state,
            computedValues: { ...data.computedValues as any, ...locallyComputedValues as any }
         }))
         .skip(1)
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.computedValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.computeFrom()',
         config
      )
   }

   ////////////////////
   // COMPUTE ASYNC //
   //////////////////

   compute$<ComputedValues>(
      computer$: (state$: Observable<ComputedState<Type>>) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'compute$', params: [computer$, initialValues] }]
      }
      const computedValues$ = computer$(this.computedStateSubject)
         .startWith(initialValues)
         .scan((previous, next) => {
            this.context.dispatchCompute(this as any, previous, next)
            return next
         })
      const data$ = Observable.combineLatest(
         this.dataSubject,
         computedValues$,
         (data, computedValues) => ({
            state: data.state,
            computedValues: { ...data.computedValues as any, ...computedValues as any }
         })
      )
      const initialData: StoreData<{ state: Type['state'], computedValues: Type['computedValues'] & ComputedValues }> = initialValues
         ? {
            state: this.initialData.state,
            computedValues: { ...this.initialData.computedValues as any, ...initialValues as any }
         }
         : this.initialData
      return new LenrixStore(
         data$.skip(1),
         (data: any) => ({ ...data.state, ...data.computedValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.compute$(' + Object.keys(initialValues || {}).join(', ') + ')',
         config
      )
   }

   computeFrom$<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      selection: FocusedSelection<Type, Selection>,
      computer$: (selection$: Observable<Selection>) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'computeFrom$', params: [selection, computer$, initialValues] }]
      }
      const select = (data: StoreData<Type>): Selection => cherryPick(this.dataToComputedState(data), selection(this.localLens))
      return this.computeFromSelector$(config, select, computer$, initialValues)
   }

   computeFromFields$<K extends keyof ComputedState<Type>, ComputedValues extends object & NotAnArray>(
      fields: K[],
      computer$: (fields$: Observable<Pick<ComputedState<Type>, K>>) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'computeFromFields$', params: [fields, computer$, initialValues] }]
      }
      const select = (data: StoreData<Type>): Pick<ComputedState<Type>, K> => {
         const selected = {} as any
         const computedState = this.dataToComputedState(data)
         fields.forEach(field => selected[field] = computedState[field])
         return selected
      }
      return this.computeFromSelector$(config, select, computer$, initialValues)
   }

   private computeFromSelector$<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      config: StoreConfig,
      selector: (data: StoreData<Type>) => Selection,
      computer$: (selection$: Observable<Selection>) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const initialData: StoreData<{ state: Type['state'], computedValues: Type['computedValues'] & ComputedValues }> = initialValues
         ? {
            state: this.initialData.state,
            computedValues: { ...this.initialData.computedValues as any, ...initialValues as any }
         }
         : this.initialData
      const selection$ = this.dataSubject.map(selector)
      const newComputedValues$ = computer$(selection$)
         .scan((previous, next) => {
            this.context.dispatchCompute(this as any, previous, next)
            return next
         })
      const data$ = Observable.combineLatest(this.dataSubject, newComputedValues$,
         (data, newComputedValues) => ({
            state: data.state,
            computedValues: { ...data.computedValues as any, ...newComputedValues as any }
         }))

      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.state, ...data.computedValues }),
         initialData,
         this.registerHandlers,
         this.context,
         this.path + '.computeFrom$()',
         config
      )
   }

   ////////////
   // FOCUS //
   //////////

   focusPath(...params: any[]): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'focusPath', params }]
      }
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      const focusedLens = (this.localLens as any).focusPath(...keys)
      const computedValueKeys: (keyof Type['computedValues'])[] = (params.length === 2 && Array.isArray(params[1]))
         ? params[1]
         : []
      const toFocusedData = (data: StoreData<Type>) => {
         const state = focusedLens.read(data.state)
         const computedValues: Partial<Type['computedValues']> = {}
         computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
         return { state, computedValues }
      }
      const registerHandlers: (handlersToRegister: FocusedHandlers<any>) => void = (handlersToRegister) => {
         const handlers = {} as any
         Object.keys(handlersToRegister).forEach(actionType => {
            const handler = handlersToRegister[actionType] as any
            handlers[actionType] = (payload: any) => focusedLens.update(handler(payload))
         })
         return this.registerHandlers(handlers as any)
      }
      return new LenrixStore(
         this.dataSubject.map(toFocusedData).distinctUntilChanged(dataEquals),
         (data: any) => (Array.isArray(data.state) || typeof data.state !== 'object')
            ? data.state
            : { ...data.state, ...data.computedValues },
         toFocusedData(this.initialData),
         registerHandlers,
         this.context,
         this.path + focusedLens.path,
         config
      )
   }

   focusFields(...params: any[]): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'focusFields', params }]
      }
      const keys: (keyof Type['state'])[] = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      const path = this.path + '.pick(' + keys.join(',') + ')'
      const pickFields = (state: Type['state']) => {
         const fields: Partial<Type['state']> = {}
         keys.forEach(key => fields[key] = state[key])
         return fields
      }
      const computedValueKeys: (keyof Type['computedValues'])[] = (params.length === 2 && Array.isArray(params[1]))
         ? params[1]
         : []
      const toPickedData = (data: StoreData<Type>) => {
         const state = pickFields(data.state)
         const computedValues: Partial<Type['computedValues']> = {}
         computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
         return { state, computedValues }
      }
      return new LenrixStore(
         this.dataSubject.map(toPickedData).distinctUntilChanged(dataEquals),
         (data: any) => ({ ...data.state, ...data.computedValues }),
         toPickedData(this.initialData),
         this.registerHandlers as any,
         this.context,
         path,
         config
      )
   }

   recompose(...params: any[]): any {
      const config: StoreConfig = {
         initialRootState: this.__config.initialRootState,
         operations: [...this.__config.operations, { name: 'recompose', params }]
      }
      const focusedSelection = params[0]
      const computedValueKeys: (keyof Type['computedValues'])[] = params[1] || []
      const fields = focusedSelection(this.localLens) as FieldLenses<Type['state'], any>
      // if (typeof params === 'function') throw Error('recompose() does not accept functions as arguments.') // TODO Test error message
      const recomposedLens = (this.localLens as any).recompose(fields)
      const path = this.path + '.' + recomposedLens.path
      const toRecomposedData = (data: StoreData<Type>) => {
         const state = recomposedLens.read(data.state)
         const computedValues: Partial<Type['computedValues']> = {}
         computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
         return { state, computedValues }
      }
      const registerHandlers: (handlersToRegister: FocusedHandlers<any>) => void = (handlersToRegister) => {
         const handlers = {} as any
         Object.keys(handlersToRegister).forEach(actionType => {
            const handler = handlersToRegister[actionType] as any
            handlers[actionType] = (payload: any) => recomposedLens.update(handler(payload))
         })
         return this.registerHandlers(handlers as any)
      }
      return new LenrixStore(
         this.dataSubject.map(toRecomposedData).distinctUntilChanged(dataEquals).skip(1),
         (data: any) => ({ ...data.state, ...data.computedValues }),
         toRecomposedData(this.initialData),
         registerHandlers,
         this.context,
         path,
         config
      )
   }

   // computeJoin$<NewComputedValues>(computer$: (state$: Observable<State>) => Observable<NewComputedValues>, initialValues?: NewComputedValues): any {
   //    const data$ = this.data$.mergeMap(data => {
   //       const state = this.dataToState(data)
   //       const newComputedValues$ = computer$(Observable.of(state))
   //       return newComputedValues$.map(newComputedValues => ({
   //          normalizedState: data.normalizedState,
   //          computedValues: { ...data.computedValues as any, ...newComputedValues as any }
   //       }))
   //    })
   //    const initialData: StoreData<NormalizedState, ComputedValues & NewComputedValues> = initialValues
   //       ? {
   //          normalizedState: this.initialData.normalizedState,
   //          computedValues: { ...this.initialData.computedValues as any, ...initialValues as any }
   //       }
   //       : this.initialData
   //    return new LenrixStore(
   //       data$,
   //       (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
   //       initialData,
   //       (updater: any) => this.update(updater),
   //       this.path + '.computeJoin$()'
   //    )
   // }

}
