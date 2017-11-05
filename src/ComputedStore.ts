import { ReadableStore } from './ReadableStore'
import { UpdatableStore } from './UpdatableStore'
import { AsyncValueComputers, ValueComputers } from './Store'
import { Observable } from 'rxjs/Observable'
import { FieldValues, NotAnArray, UnfocusedLens } from 'immutable-lens'

export interface ComputedStore<NormalizedState extends object & NotAnArray, ComputedValues extends object & NotAnArray> extends ReadableStore<NormalizedState & ComputedValues>, UpdatableStore<NormalizedState> {

   readonly lens: UnfocusedLens<NormalizedState>
   readonly path: string

   /////////////
   // UPDATE //
   ///////////

   update(updater: (state: NormalizedState & ComputedValues) => NormalizedState): void

   updateFieldValues(fieldsUpdater: (state: NormalizedState & ComputedValues) => FieldValues<NormalizedState>): void

   pipe(...updaters: ((state: NormalizedState & ComputedValues) => NormalizedState)[]): void

   //////////////
   // COMPUTE //
   ////////////

   compute<NewComputedValues>(this: UpdatableStore<NormalizedState & object & NotAnArray>, computer: (state: NormalizedState & ComputedValues) => NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   computeValues<NewComputedValues>(this: UpdatableStore<NormalizedState & object & NotAnArray>, values: ValueComputers<NormalizedState & ComputedValues, NewComputedValues>): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   compute$<NewComputedValues>(this: UpdatableStore<NormalizedState & object & NotAnArray>, computer$: (state$: Observable<NormalizedState & ComputedValues>) => Observable<NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   computeValues$<NewComputedValues>(this: UpdatableStore<NormalizedState & object & NotAnArray>, values$: AsyncValueComputers<NormalizedState & ComputedValues, NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

}
