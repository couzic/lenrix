import 'rxjs/add/observable/combineLatest'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/pluck'
import 'rxjs/add/operator/skip'
import 'rxjs/add/operator/startWith'

import { cherryPick, createLens, FieldLenses, NotAnArray, UnfocusedLens, UpdaterWithMeta } from 'immutable-lens'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'

import { ActionDispatchers } from './ActionDispatchers'
import { ComputedState } from './ComputedState'
import { FocusedAction } from './FocusedAction'
import { FocusedHandlers } from './FocusedHandlers'
import { FocusedSelection } from './FocusedSelection'
import { shallowEquals } from './shallowEquals'
import { Store } from './Store'

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

   // getState(this: LenrixStore<Type & { state: object & NotAnArray }, RootState>): ComputedState<Type>
   // getState(): Type['state']
   // getState(): ComputedState<Type> | Type['state'] {
   //    return this.currentState
   // }

   constructor(data$: Observable<StoreData<Type>>,
      private readonly dataToComputedState: (data: StoreData<Type>) => ComputedState<Type>,
      private readonly initialData: { state: Type['state'], computedValues: Type['computedValues'] },
      private readonly registerHandlers: (handlers: FocusedHandlers<Type>) => void,
      private readonly dispatchAction: (action: FocusedAction, actionMeta: ActionMeta) => void,
      actionDispatchers: ActionDispatchers<Type['actions']>,
      public readonly path: string) {
      this.dataSubject = new BehaviorSubject(initialData)
      this.computedStateSubject = new BehaviorSubject(dataToComputedState(initialData))
      data$.subscribe(this.dataSubject)
      this.dataSubject
         .map(dataToComputedState)
         .subscribe(this.computedStateSubject)
      this.actionDispatchers = actionDispatchers
   }

   //////////////
   // ACTIONS //
   ////////////

   private actionDispatchers: ActionDispatchers<Type['actions']>

   get actions() {
      return this.actionDispatchers
   }

   actionTypes<NewActions>(): any {
      return this
   }

   // actionHandlers(
   //    this: Store<Type & { state: object & NotAnArray }>,
   //    focusedHandlers: (lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type>
   // ): Store<Type>

   // actionHandlers(
   //    focusedHandlers: (lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type>
   // ): Store<Type>

   actionHandlers(focusHandlers: (lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type>) {
      const handlers = focusHandlers(this.localLens)
      this.registerHandlers(handlers)
      const actionTypes = Object.keys(handlers)
      const actions = {} as any
      const meta: ActionMeta = {
         store: {
            name: this.name || '',
            path: this.path,
            currentState: this.currentState,
            computedValues: this.currentComputedValues
         }
      }
      actionTypes.forEach(actionType => {
         const handler = (handlers as any)[actionType]
         actions[actionType] = (payload: any) => this.dispatchAction({ type: actionType, payload }, meta)
      })
      this.actionDispatchers = {
         ...this.actionDispatchers as any,
         ...actions
      }
      return this
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
      return this.dataSubject
         .map(_ => _.state)
         .map(state => keys.reduce((acc: any, key: any) => acc[key], state))
   }

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues>(computer: (state: ComputedState<Type>) => ComputedValues): any {
      const dataToComputedValues = (data: StoreData<Type>): Type['computedValues'] & ComputedValues => {
         const computedState = { ...data.state as any, ...data.computedValues as any }
         const newComputedValues = computer(computedState)
         if (typeof newComputedValues === 'function') throw Error('LenrixStore.compute() does not accept higher order functions as arguments')
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
         this.dispatchAction,
         this.actionDispatchers,
         this.path + '.compute()'
         // this.path + '.compute(' + Object.keys({}).join(', ') + ')'
      )
   }

   computeFrom<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      selection: FocusedSelection<Type, Selection>,
      computer: (selection: Selection) => ComputedValues
   ): any {
      const select = (data: StoreData<Type>): { data: StoreData<Type>, selected: Selection } => ({
         data,
         selected: cherryPick(this.dataToComputedState(data), selection(this.localLens))
      })
      const computeData = (
         dataAndSelected: { data: StoreData<Type>, selected: Selection }
      ): StoreData<{ state: Type['state'], computedValues: Type['computedValues'] & ComputedValues }> => {
         const { data, selected } = dataAndSelected
         const newComputedValues = computer(selected)
         return {
            state: data.state,
            computedValues: { ...data.computedValues as any, ...newComputedValues as any }
         }
      }
      const data$ = this.dataSubject
         .map(select)
         .distinctUntilChanged((a, b) => shallowEquals(a.selected, b.selected))
         .map(computeData)
      const initialData = computeData(select(this.initialData))
      return new LenrixStore(
         data$ as any,
         (data: any) => ({ ...data.state, ...data.computedValues }),
         initialData,
         this.registerHandlers,
         this.dispatchAction,
         this.actionDispatchers,
         this.path + '.computeFrom()'
      )
   }

   computeFromFields(...params: any[]): any { } // TODO implement

   compute$<ComputedValues>(
      computer$: (state$: Observable<ComputedState<Type>>) => Observable<ComputedValues>,
      initialValues?: ComputedValues
   ): any {
      const computedValues$ = computer$(this.computedStateSubject).startWith(initialValues)
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
         this.dispatchAction,
         this.actionDispatchers,
         this.path + '.compute$(' + Object.keys(initialValues || {}).join(', ') + ')'
      )
   }

   computeFrom$(...params: any[]): any { }

   computeFromFields$(...params: any[]): any { }

   ////////////
   // FOCUS //
   //////////

   focusPath(...params: any[]): any {
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
         this.dispatchAction,
         this.actionDispatchers,
         this.path + focusedLens.path
      )
   }

   focusFields(...params: any[]): any {
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
         this.dispatchAction,
         this.actionDispatchers,
         path
      )
   }

   recompose(...params: any[]): any {
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
         this.dispatchAction,
         this.actionDispatchers,
         path
      )
   }


   /////////////
   // UPDATE //
   ///////////


   private dispatchWithMeta(updater: UpdaterWithMeta<RootState>) {
      // this.dispatchUpdate(updater, {
      //    store: {
      //       name: this.name,
      //       path: this.path,
      //       currentState: this.currentState
      //    },
      //    updater: updater.meta
      // })
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
