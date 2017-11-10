import 'rxjs/add/observable/combineLatest'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/pluck'
import 'rxjs/add/operator/startWith'

import {
   cherryPick,
   createLens,
   FieldLenses,
   FieldsUpdater,
   FieldUpdaters,
   FieldValues,
   UnfocusedLens,
   Updater,
} from 'immutable-lens'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'

import { ReadableStore } from './ReadableStore'
import { shallowEquals } from './shallowEquals'
import { Store } from './Store'
import { UpdatableStore } from './UpdatableStore'

export interface StoreData<NormalizedState, ComputedValues> {
   normalizedState: NormalizedState,
   computedValues: ComputedValues
}

function dataEquals<NormalizedState, ComputedValues>(previous: StoreData<NormalizedState, ComputedValues>, next: StoreData<NormalizedState, ComputedValues>): boolean {
   return shallowEquals(previous.normalizedState, next.normalizedState)
      && shallowEquals(previous.computedValues, next.computedValues)
}

export class LenrixStore<NormalizedState, ComputedValues, State> implements ReadableStore<State>, UpdatableStore<NormalizedState> {

   lens: UnfocusedLens<NormalizedState> = createLens<NormalizedState>()

   private readonly dataSubject: BehaviorSubject<StoreData<NormalizedState, ComputedValues>>
   private readonly stateSubject: BehaviorSubject<State>

   get data$(): Observable<StoreData<NormalizedState, ComputedValues>> {
      return this.dataSubject
   }

   get state$(): Observable<State> {
      return this.stateSubject
   }

   get currentState(): State {
      return this.stateSubject.getValue()
   }

   constructor(data$: Observable<StoreData<NormalizedState, ComputedValues>>,
      private readonly dataToState: (data: StoreData<NormalizedState, ComputedValues>) => State,
      private readonly initialData: StoreData<NormalizedState, ComputedValues>,
      private readonly updateOnParent: (updater: Updater<NormalizedState>) => void,
      public readonly path: string) {
      this.dataSubject = new BehaviorSubject(initialData)
      this.stateSubject = new BehaviorSubject(dataToState(initialData))
      data$.subscribe(this.dataSubject)
      this.dataSubject
         .map(dataToState)
         .subscribe(this.stateSubject)
   }

   ////////////
   // FOCUS //
   //////////

   focusOn(key: any): any {
      const focusedLens = this.lens.focusOn(key)
      return this.focusWith(focusedLens)
   }

   focusWith<Target>(lens: any): Store<Target> {
      const focusedInitialState = lens.read(this.initialData.normalizedState)
      return new LenrixStore(
         this.dataSubject
            .map(data => ({
               normalizedState: lens.read(data.normalizedState),
               computedValues: {}
            }))
            .distinctUntilChanged(shallowEquals, data => data.normalizedState),
         data => data.normalizedState,
         { normalizedState: focusedInitialState, computedValues: {} },
         updater => this.update(lens.update(updater)),
         this.path + lens.path,
      )
   }

   focusPath(...params: any[]): any {
      const keys = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      const focusedLens = (this.lens as any).focusPath(...keys)
      const computedValueKeys: (keyof ComputedValues)[] = (params.length === 2 && Array.isArray(params[1]))
         ? params[1]
         : []
      const toFocusedData = (data: StoreData<NormalizedState, ComputedValues>) => {
         const normalizedState = focusedLens.read(data.normalizedState)
         const computedValues: Partial<ComputedValues> = {}
         computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
         return { normalizedState, computedValues }
      }
      return new LenrixStore(
         this.dataSubject.map(toFocusedData).distinctUntilChanged(dataEquals),
         (data: any) => (Array.isArray(data.normalizedState) || typeof data.normalizedState !== 'object')
            ? data.normalizedState
            : { ...data.normalizedState, ...data.computedValues as object },
         toFocusedData(this.initialData),
         updater => this.update(focusedLens.update(updater)),
         this.path + focusedLens.path
      )
   }

   focusFields(...params: any[]): any {
      const keys: (keyof NormalizedState)[] = Array.isArray(params[0]) ? params[0] : params // Handle spread keys
      const path = this.path + '.pick(' + keys.join(',') + ')'
      const pickFields = (state: NormalizedState) => {
         const fields: Partial<NormalizedState> = {}
         keys.forEach(key => fields[key] = state[key])
         return fields
      }
      const computedValueKeys: (keyof ComputedValues)[] = (params.length === 2 && Array.isArray(params[1]))
         ? params[1]
         : []
      const toPickedData = (data: StoreData<NormalizedState, ComputedValues>) => {
         const normalizedState = pickFields(data.normalizedState)
         const computedValues: Partial<ComputedValues> = {}
         computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
         return { normalizedState, computedValues }
      }
      const updateOnParent = (updater: Updater<Partial<NormalizedState>>) => this.update(state => {
         const fields = pickFields(state)
         const updatedFields = updater(fields)
         Object.keys(updatedFields).forEach(key => {
            if (keys.indexOf(key as any) < 0) throw Error(key + ' is not part of the updatable fields: ' + keys)
         })
         return { ...state as any, ...updatedFields as any }
      })
      return new LenrixStore(
         this.dataSubject.map(toPickedData).distinctUntilChanged(dataEquals),
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         toPickedData(this.initialData),
         updateOnParent,
         path
      )
   }

   recompose(...params: any[]): any {
      if (typeof params === 'function') throw Error('recompose() does not accept functions as arguments.') // TODO Test error message
      const fields = params[0] as FieldLenses<NormalizedState, any>
      const recomposedLens = (this.lens as any).recompose(fields)
      const path = this.path + '.' + recomposedLens.path
      const computedValueKeys: (keyof ComputedValues)[] = params[1] || []
      const toRecomposedData = (data: StoreData<NormalizedState, ComputedValues>) => {
         const normalizedState = recomposedLens.read(data.normalizedState)
         const computedValues: Partial<ComputedValues> = {}
         computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
         return { normalizedState, computedValues }
      }
      return new LenrixStore(
         this.dataSubject.map(toRecomposedData).distinctUntilChanged(dataEquals),
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         toRecomposedData(this.initialData),
         updater => this.update(recomposedLens.update(updater)),
         path
      )
   }

   ///////////
   // READ //
   /////////

   pluck<K extends keyof State>(key: K): Observable<State[K]> {
      return this.map(state => state[key])
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      return this.state$.map(selector).distinctUntilChanged()
   }

   pick<K extends keyof State>(...
      keys: K[]): Observable<Pick<State, K>> {
      return this.state$.map(state => {
         const subset = {} as any
         keys.forEach(key => subset[key] = state[key])
         return subset
      }).distinctUntilChanged(shallowEquals)
   }

   cherryPick<E>(this: ReadableStore<State & object>, fields: FieldLenses<State & object, E>): Observable<E> {
      if (typeof fields === 'function')
         throw Error('cherryPick() does not accept functions as arguments')
      return this.state$.map(state => cherryPick(state, fields)).distinctUntilChanged(shallowEquals)
   }

   /////////////
   // UPDATE //
   ///////////

   reset() {
      this.setValue(this.initialData.normalizedState)
   }

   setValue(newValue: NormalizedState) {
      this.updateOnParent(this.lens.setValue(newValue))
   }

   update(updater: Updater<NormalizedState>) {
      this.updateOnParent(this.lens.update(updater))
   }

   setFieldValues(newValues: FieldValues<NormalizedState>) {
      this.updateOnParent(this.lens.setFieldValues(newValues))
   }

   updateFields(updaters: FieldUpdaters<NormalizedState>) {
      this.updateOnParent(this.lens.updateFields(updaters))
   }

   updateFieldValues(fieldsUpdater: FieldsUpdater<NormalizedState>) {
      this.updateOnParent(this.lens.updateFieldValues(fieldsUpdater))
   }

   pipe(...updaters: Updater<NormalizedState>[]) {
      this.updateOnParent(this.lens.pipe(...updaters))
   }

   //////////////
   // COMPUTE //
   ////////////

   compute<NewComputedValues>(computer: (state: NormalizedState) => NewComputedValues): any {
      const initialComputedValues = computer(this.initialData.normalizedState)
      if (typeof initialComputedValues === 'function') throw Error('LenrixStore.compute() does not support higher order functions as arguments')
      const dataToComputedValues = (data: StoreData<NormalizedState, ComputedValues>) => ({
         ...data.computedValues as any,
         ...computer({
            ...data.normalizedState as any,
            ...data.computedValues as any
         }) as any
      })
      const data$ = this.dataSubject.map(data => ({
         normalizedState: data.normalizedState,
         computedValues: dataToComputedValues(data)
      }))
      const initialData: StoreData<NormalizedState, ComputedValues & NewComputedValues> = {
         normalizedState: this.initialData.normalizedState,
         computedValues: {} as any
      }
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         initialData,
         (updater: any) => this.update(updater),
         this.path + '.compute(' + Object.keys(initialComputedValues).join(', ') + ')'
      )
   }

   compute$<NewComputedValues>(computer$: (state$: Observable<State>) => Observable<NewComputedValues>, initialValues: NewComputedValues): any {
      const computedSubject = new BehaviorSubject(initialValues)
      const newComputedValues$ = computer$(this.data$.map(this.dataToState)).startWith(initialValues)
      const data$ = Observable.combineLatest(
         this.data$,
         newComputedValues$,
         (data, newComputedValues) => ({
            normalizedState: data.normalizedState,
            computedValues: { ...data.computedValues as any, ...newComputedValues as any }
         })
      )
      const initialData: StoreData<NormalizedState, ComputedValues & NewComputedValues> = {
         normalizedState: this.initialData.normalizedState,
         computedValues: { ...this.initialData.computedValues as any, ...initialValues as any }
      }
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         this.initialData,
         (updater: any) => this.update(updater),
         this.path + '.compute$(' + Object.keys(initialValues).join(', ') + ')'
      )
   }

}
