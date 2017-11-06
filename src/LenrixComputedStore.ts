import { ComputedStore } from './ComputedStore'
import { Observable } from 'rxjs/Observable'
import { FieldLenses, NotAnArray, Updater } from 'immutable-lens'
import { AsyncValueComputers, ValueComputers } from './Store'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { LenrixAbstractStore } from './LenrixAbstractStore'
import { LenrixStore } from './LenrixStore'
import { shallowEquals } from './shallowEquals'

export interface ComputedStoreData<NormalizedState extends object & NotAnArray, ComputedValues extends object & NotAnArray> {
   normalizedState: NormalizedState,
   computedValues: ComputedValues
}

export class LenrixComputedStore<NormalizedState extends object & NotAnArray, ComputedValues extends object & NotAnArray, State extends NormalizedState & ComputedValues>
   extends LenrixAbstractStore<NormalizedState, ComputedValues, NormalizedState & ComputedValues>
   implements ComputedStore<NormalizedState, ComputedValues> {

   private readonly dataSubject: BehaviorSubject<ComputedStoreData<NormalizedState, ComputedValues>>
   private readonly stateSubject: BehaviorSubject<State>

   get state$(): Observable<State> {
      return this.stateSubject
   }

   get currentState(): State {
      return this.stateSubject.getValue()
   }

   constructor(data$: Observable<ComputedStoreData<NormalizedState, ComputedValues>>,
               public readonly path: string,
               updateOnParent: (updater: Updater<NormalizedState>) => void,
               private readonly initialData: ComputedStoreData<NormalizedState, ComputedValues>) {
      super(updateOnParent, initialData.normalizedState)
      this.dataSubject = new BehaviorSubject(initialData)
      const initialState: State = { ...initialData.normalizedState as any, ...initialData.computedValues as any }
      this.stateSubject = new BehaviorSubject(initialState)
      data$.subscribe(this.dataSubject)
      this.dataSubject
         .map(data => ({
            ...data.normalizedState as any,
            ...data.computedValues as any
         }))
         .subscribe(this.stateSubject)
   }

   focusPath(...params: any[]): any {
      const keys = params[0] instanceof Array ? params[0] : params // Handle spread keys
      const focusedLens = (this.lens as any).focusPath(...keys)
      if (params.length === 2 && params[1] instanceof Array) { // With computed values
         const computedValueKeys: (keyof ComputedValues)[] = params[1]
         const toFocusedData = (data: ComputedStoreData<NormalizedState, ComputedValues>) => {
            const normalizedState = focusedLens.read(data.normalizedState)
            const computedValues: Partial<ComputedValues> = {}
            computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
            return { normalizedState, computedValues }
         }
         return new LenrixComputedStore(
            this.dataSubject.map(toFocusedData),
            this.path + focusedLens.path,
            updater => this.update(updater),
            toFocusedData(this.initialData)
         )
      } else { // Without computed values
         return new LenrixStore(
            this.map(state => focusedLens.read(state)),
            this.path + focusedLens.path,
            updater => this.update(focusedLens.update(updater)),
            focusedLens.read(this.initialData.normalizedState))
      }
   }

   focusFields(...params: any[]): any {
      const keys: (keyof NormalizedState)[] = params[0] instanceof Array ? params[0] : params // Handle spread keys
      const path = this.path + '.pick(' + keys.join(',') + ')'
      const pickFields = (state: NormalizedState) => {
         const fields: Partial<NormalizedState> = {}
         keys.forEach(key => fields[key] = state[key])
         return fields
      }
      const updateOnParent = (updater: Updater<Partial<NormalizedState>>) => this.update(state => {
         const fields = pickFields(state)
         const updatedFields = updater(fields)
         return { ...state as object, ...updatedFields as object } as NormalizedState
      })
      if (params.length === 2 && params[1] instanceof Array) { // With computed values
         const computedValueKeys: (keyof ComputedValues)[] = params[1]
         const toPickedData = (data: ComputedStoreData<NormalizedState, ComputedValues>) => {
            const normalizedState = pickFields(data.normalizedState)
            const computedValues: Partial<ComputedValues> = {}
            computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
            return { normalizedState, computedValues }
         }
         return new LenrixComputedStore(
            this.dataSubject.map(toPickedData),
            path,
            updateOnParent,
            toPickedData(this.initialData)
         )
      } else { // Without computed values
         return new LenrixStore(
            this.map(pickFields),
            path,
            updateOnParent,
            pickFields(this.initialState)
         )
      }
   }

   recompose(...params: any[]): any {
      if (typeof params === 'function') throw Error('recompose() does not accept functions as arguments.')
      const fields = params[0] as FieldLenses<NormalizedState, any>
      const recomposedLens = this.lens.recompose(fields)
      const path = this.path + recomposedLens.path
      const updateOnParent = (updater: any) => this.update(recomposedLens.update(updater))
      if (params.length === 2) { // With computed values
         const computedValueKeys: (keyof ComputedValues)[] = params[1]
         const toRecomposedData = (data: ComputedStoreData<NormalizedState, ComputedValues>) => {
            const normalizedState = recomposedLens.read(data.normalizedState)
            const computedValues: Partial<ComputedValues> = {}
            computedValueKeys.forEach(key => computedValues[key] = data.computedValues[key])
            return { normalizedState, computedValues }
         }
         return new LenrixComputedStore(
            this.dataSubject.map(toRecomposedData),
            path,
            updateOnParent,
            toRecomposedData(this.initialData)
         )
      } else { // Without computed values
         const recomposedState$ = this.state$.map(state => recomposedLens.read(state)).distinctUntilChanged(shallowEquals)
         const recomposedInitialState = recomposedLens.read(this.initialState)
         return new LenrixStore(
            recomposedState$,
            path,
            updateOnParent,
            recomposedInitialState)
      }
   }

   compute<NewComputedValues>(computer: (state: State) => NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

   computeValues<NewComputedValues>(values: ValueComputers<State, NewComputedValues>): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

   compute$<NewComputedValues>(computer$: (state$: Observable<State>) => Observable<NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

   computeValues$<NewComputedValues>(values$: AsyncValueComputers<State, NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues> {
      throw new Error('Method not implemented.')
   }

}
