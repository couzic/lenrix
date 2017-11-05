import { ReadableStore } from './ReadableStore'
import { UpdatableStore } from './UpdatableStore'
import { AsyncValueComputers, ValueComputers } from './Store'
import { Observable } from 'rxjs/Observable'

export interface ComputedStore<NormalizedState, ComputedValues> extends ReadableStore<NormalizedState & ComputedValues>, UpdatableStore<NormalizedState> {

   //////////////
   // COMPUTE //
   ////////////

   compute<NewComputedValues>(computer: (state: NormalizedState & ComputedValues) => NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   computeValues<NewComputedValues>(values: ValueComputers<NormalizedState & ComputedValues, NewComputedValues>): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   compute$<NewComputedValues>(computer$: (state$: Observable<NormalizedState & ComputedValues>) => Observable<NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   computeValues$<NewComputedValues>(values$: AsyncValueComputers<NormalizedState & ComputedValues, NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

}
