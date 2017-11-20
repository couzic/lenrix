import 'rxjs/add/observable/combineLatest'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/pluck'
import 'rxjs/add/operator/skip'
import 'rxjs/add/operator/startWith'

import {
   cherryPick,
   createLens,
   FieldLenses,
   FieldsUpdater,
   FieldUpdaters,
   FieldValues,
   Lens,
   NotAnArray,
   UnfocusedLens,
   Updater,
} from 'immutable-lens'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'

import { ReadableStore } from './ReadableStore'
import { shallowEquals } from './shallowEquals'
import { UpdatableStore } from './UpdatableStore'

export interface StoreData<NormalizedState, ComputedValues extends object> {
   normalizedState: NormalizedState,
   computedValues: ComputedValues
}

function dataEquals<NormalizedState extends object, ComputedValues extends object>(
   previous: StoreData<NormalizedState, ComputedValues>,
   next: StoreData<NormalizedState, ComputedValues>
): boolean {
   return shallowEquals(previous.normalizedState, next.normalizedState)
      && shallowEquals(previous.computedValues, next.computedValues)
}

export class LenrixStore<NormalizedState extends object, ComputedValues extends object, State extends NormalizedState & ComputedValues, RootState extends object>
   implements ReadableStore<State>, UpdatableStore<NormalizedState> {

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
      private readonly rootLens: Lens<RootState, NormalizedState>,
      private readonly updateRootState: (updater: Updater<RootState>) => void,
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

   // focusOn(key: any): any {
   //    const focusedLens = this.lens.focusOn(key)
   //    return this.focusWith(focusedLens)
   // }

   // focusWith<Target>(lens: any): Store<Target> {
   //    const focusedInitialState = lens.read(this.initialData.normalizedState)
   //    return new LenrixStore(
   //       this.dataSubject
   //          .map(data => ({
   //             normalizedState: lens.read(data.normalizedState),
   //             computedValues: {}
   //          }))
   //          .distinctUntilChanged(shallowEquals, data => data.normalizedState),
   //       data => data.normalizedState,
   //       { normalizedState: focusedInitialState, computedValues: {} },
   //       this.rootLens.fo
   //       updater => this.update(lens.update(updater)),
   //       this.path + lens.path,
   //    )
   // }

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
            : { ...data.normalizedState, ...data.computedValues },
         toFocusedData(this.initialData),
         (this.rootLens as any).focusPath(...keys),
         this.updateRootState,
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
      // const updateOnParent = (updater: Updater<Partial<NormalizedState>>) => this.update(state => {
      //    const fields = pickFields(state)
      //    const updatedFields = updater(fields)
      //    Object.keys(updatedFields).forEach(key => { // TODO Write test
      //       if (keys.indexOf(key as any) < 0) throw Error(key + ' is not part of the updatable fields: ' + keys)
      //    })
      //    return { ...state as any, ...updatedFields as any }
      // })
      return new LenrixStore(
         this.dataSubject.map(toPickedData).distinctUntilChanged(dataEquals),
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         toPickedData(this.initialData),
         this.rootLens.focus(pickFields, fields => state => {
            Object.keys(fields).forEach(key => { // TODO Write test
               if (keys.indexOf(key as any) < 0) throw Error(key + ' is not part of the updatable fields: ' + keys)
            })
            return { ...state as any, ...fields as any }
         }),
         this.updateRootState,
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
         this.dataSubject.map(toRecomposedData).distinctUntilChanged(dataEquals).skip(1),
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         toRecomposedData(this.initialData),
         this.rootLens.recompose(fields),
         this.updateRootState,
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
      this.updateRootState(this.rootLens.setValue(newValue))
   }

   update(updater: Updater<NormalizedState>) {
      this.updateRootState(this.rootLens.update(updater))
   }

   setFieldValues(newValues: FieldValues<NormalizedState>) {
      this.updateRootState(this.rootLens.setFieldValues(newValues))
   }

   updateFields(updaters: FieldUpdaters<NormalizedState>) {
      this.updateRootState(this.rootLens.updateFields(updaters))
   }

   updateFieldValues(fieldsUpdater: FieldsUpdater<NormalizedState>) {
      this.updateRootState(this.rootLens.updateFieldValues(fieldsUpdater))
   }

   pipe(...updaters: Updater<NormalizedState>[]) {
      this.updateRootState(this.rootLens.pipe(...updaters))
   }

   //////////////
   // COMPUTE //
   ////////////

   compute<NewComputedValues>(computer: (state: NormalizedState) => NewComputedValues): any {
      const dataToComputedValues = (data: StoreData<NormalizedState, ComputedValues>): ComputedValues & NewComputedValues => {
         const state = { ...data.normalizedState as any, ...data.computedValues as any }
         const newComputedValues = computer(state)
         if (typeof newComputedValues === 'function') throw Error('LenrixStore.compute() does not support higher order functions as arguments')
         return {
            ...data.computedValues as any,
            ...newComputedValues as any
         }
      }
      const initialData: StoreData<NormalizedState, ComputedValues & NewComputedValues> = {
         normalizedState: this.initialData.normalizedState,
         computedValues: dataToComputedValues(this.initialData)
      }
      const data$ = this.dataSubject.skip(1).map(data => ({
         normalizedState: data.normalizedState,
         computedValues: dataToComputedValues(data)
      }))
      return new LenrixStore(
         data$,
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         initialData,
         this.rootLens,
         this.updateRootState,
         this.path + '.compute(todoListLength, caret)'
         // this.path + '.compute(' + Object.keys({}).join(', ') + ')'
      )
   }

   computeFrom<Selection extends object & NotAnArray, NewComputedValues extends object & NotAnArray>(
      selection: FieldLenses<State, Selection>,
      computer: (selection: Selection) => NewComputedValues
   ): any {
      const select = (
         data: StoreData<NormalizedState, ComputedValues>
      ): { data: StoreData<NormalizedState, ComputedValues>, selected: Selection } => ({
         data,
         selected: cherryPick(this.dataToState(data), selection)
      })
      const computeData = (
         dataAndSelected: { data: StoreData<NormalizedState, ComputedValues>, selected: Selection }
      ): StoreData<NormalizedState, ComputedValues & NewComputedValues> => {
         const { data, selected } = dataAndSelected
         const newComputedValues = computer(selected)
         return {
            normalizedState: data.normalizedState,
            computedValues: { ...data.computedValues as any, ...newComputedValues as any }
         }
      }
      const data$ = this.data$
         .map(select)
         .distinctUntilChanged((a, b) => shallowEquals(a.selected, b.selected))
         .map(computeData)
      const initialData = computeData(select(this.initialData))
      return new LenrixStore(
         data$,
         data => ({ ...data.normalizedState as any, ...data.computedValues as any }),
         initialData,
         this.rootLens,
         this.updateRootState,
         this.path + '.computeFrom()'
      )
   }

   computeFromFields(...params: any[]): any { }

   compute$<NewComputedValues>(computer$: (state$: Observable<State>) => Observable<NewComputedValues>, initialValues?: NewComputedValues): any {
      const newComputedValues$ = computer$(this.data$.map(this.dataToState)).startWith(initialValues)
      const data$ = Observable.combineLatest(
         this.data$,
         newComputedValues$,
         (data, newComputedValues) => ({
            normalizedState: data.normalizedState,
            computedValues: { ...data.computedValues as any, ...newComputedValues as any }
         })
      )
      const initialData: StoreData<NormalizedState, ComputedValues & NewComputedValues> = initialValues
         ? {
            normalizedState: this.initialData.normalizedState,
            computedValues: { ...this.initialData.computedValues as any, ...initialValues as any }
         }
         : this.initialData
      return new LenrixStore(
         data$.skip(1),
         (data: any) => ({ ...data.normalizedState, ...data.computedValues }),
         initialData,
         this.rootLens,
         this.updateRootState,
         this.path + '.compute$(' + Object.keys(initialValues || {}).join(', ') + ')'
      )
   }

   computeFrom$(...params: any[]): any { }

   computeFromFields$(...params: any[]): any { }

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
