import { ComputedStore } from './ComputedStore'
import { Observable } from 'rxjs/Observable'
import { ReadableStore } from './ReadableStore'
import { createLens, FieldLenses, FieldUpdaters, FieldValues, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'
import { AsyncValueComputers, ValueComputers } from './Store'
import { UpdatableStore } from './UpdatableStore'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

export interface ComputedStoreData<NormalizedState extends object & NotAnArray, ComputedValues extends object & NotAnArray> {
   normalizedState: NormalizedState,
   computedValues: ComputedValues
}

export class LenrixComputedStore<NormalizedState extends object & NotAnArray, ComputedValues extends object & NotAnArray, State extends NormalizedState & ComputedValues> implements ComputedStore<NormalizedState, ComputedValues> {

   lens: UnfocusedLens<State> = createLens<State>()

   private readonly dataSubject: BehaviorSubject<ComputedStoreData<NormalizedState, ComputedValues>>
   private readonly stateSubject: BehaviorSubject<State>

   get state$(): Observable<State> {
      return this.stateSubject
   }

   get currentState(): State {
      return this.stateSubject.getValue()
   }

   constructor(private data$: Observable<ComputedStoreData<NormalizedState, ComputedValues>>,
               public readonly path: string,
               private readonly updateOnParent: (updater: Updater<NormalizedState>) => void,
               private readonly initialData: ComputedStoreData<NormalizedState, ComputedValues>) {
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

   pluck<K extends keyof State>(this: ReadableStore<State & NotAnArray>, key: K): Observable<State[K]> {
      throw new Error('Method not implemented.')
   }

   map<T>(selector: (state: State) => T): Observable<T> {
      throw new Error('Method not implemented.')
   }

   pick<K extends keyof (NormalizedState & ComputedValues)>(...keys: K[]): Observable<Pick<(NormalizedState & ComputedValues), K>> {
      throw new Error('Method not implemented.')
   }

   cherryPick<ExtractedState>(fields: FieldLenses<(NormalizedState & ComputedValues), ExtractedState>): Observable<ExtractedState> {
      throw new Error('Method not implemented.')
   }

   setValue(newValue: NormalizedState) {
      throw new Error('Method not implemented.')
   }

   update(updater: (state: State) => NormalizedState) {
      throw new Error('Method not implemented.')
   }

   setFieldValues(this: UpdatableStore<NormalizedState & NotAnArray>, newValues: FieldValues<NormalizedState>) {
      throw new Error('Method not implemented.')
   }

   updateFields(this: UpdatableStore<NormalizedState & NotAnArray>, updaters: FieldUpdaters<NormalizedState>) {
      throw new Error('Method not implemented.')
   }

   updateFieldValues(fieldsUpdater: (state: State) => FieldValues<NormalizedState>) {
      throw new Error('Method not implemented.')
   }

   reset() {
      throw new Error('Method not implemented.')
   }

   pipe(...updaters: ((state: State) => NormalizedState)[]) {
      throw new Error('Method not implemented.')
   }

}
