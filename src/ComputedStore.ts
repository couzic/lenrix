import { ReadableStore } from './ReadableStore'
import { UpdatableStore } from './UpdatableStore'
import { AsyncValueComputers, Store, ValueComputers } from './Store'
import { Observable } from 'rxjs/Observable'
import { FieldLenses, NotAnArray, UnfocusedLens } from 'immutable-lens'

export interface ComputedStore<NormalizedState extends object & NotAnArray, ComputedValues>
   extends ReadableStore<NormalizedState & ComputedValues>, UpdatableStore<NormalizedState> {

   readonly lens: UnfocusedLens<NormalizedState>
   readonly path: string

   //////////////
   // COMPUTE //
   ////////////

   compute<NewComputedValues extends object & NotAnArray>(computer: (state: NormalizedState & ComputedValues) => NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   // compute$<NewComputedValues extends object & NotAnArray>(computer$: (state$: Observable<NormalizedState & ComputedValues>) => Observable<NewComputedValues>, initialValues: NewComputedValues): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   ////////////
   // FOCUS //
   //////////

   focusFields<K extends keyof NormalizedState>(...keys: K[]): Store<Pick<NormalizedState, K>>

   focusFields<K extends keyof NormalizedState>(keys: K[]): Store<Pick<NormalizedState, K>>

   focusFields<NK extends keyof NormalizedState, CK extends keyof ComputedValues>(keys: NK[], computedValues: CK[]): ComputedStore<Pick<NormalizedState, NK>, Pick<ComputedValues, CK>>

   recompose<RecomposedState>(fields: FieldLenses<NormalizedState, RecomposedState>): Store<RecomposedState>

   recompose<RecomposedState, CK extends keyof ComputedValues>(fields: FieldLenses<NormalizedState, RecomposedState>, computedValues: CK[]): ComputedStore<RecomposedState, Pick<ComputedValues, CK>>

   focusPath<K extends keyof NormalizedState>(key: K): Store<NormalizedState[K]>

   focusPath<K extends keyof NormalizedState>(path: [K]): Store<NormalizedState[K]>

   focusPath<NK extends keyof NormalizedState, CK extends keyof ComputedValues>(path: [NK], computedValues: CK[]): ComputedStore<NormalizedState[NK], Pick<ComputedValues, CK>>

   focusPath<K1 extends keyof NormalizedState,
      K2 extends keyof NormalizedState[K1]>(key1: K1, key2: K2): Store<NormalizedState[K1][K2]>

   focusPath<K1 extends keyof NormalizedState,
      K2 extends keyof NormalizedState[K1]>(path: [K1, K2]): Store<NormalizedState[K1][K2]>

   focusPath<K1 extends keyof NormalizedState,
      K2 extends keyof NormalizedState[K1],
      CK extends keyof ComputedValues>(path: [K1, K2], computedValues: CK[]): ComputedStore<NormalizedState[K1][K2], Pick<ComputedValues, CK>>

   focusPath<K1 extends keyof NormalizedState,
      K2 extends keyof NormalizedState[K1],
      K3 extends keyof NormalizedState[K2]>(key1: K1, key2: K2, key3: K3): Store<NormalizedState[K1][K2][K3]>

   focusPath<K1 extends keyof NormalizedState,
      K2 extends keyof NormalizedState[K1],
      K3 extends keyof NormalizedState[K2]>(path: [K1, K2, K3]): Store<NormalizedState[K1][K2][K3]>

   focusPath<K1 extends keyof NormalizedState,
      K2 extends keyof NormalizedState[K1],
      K3 extends keyof NormalizedState[K2],
      CK extends keyof ComputedValues>(path: [K1, K2, K3], computedValues: CK[]): ComputedStore<NormalizedState[K1][K2][K3], Pick<ComputedValues, CK>>

}
