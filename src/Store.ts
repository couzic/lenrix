import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/distinctUntilChanged'
import { FieldsUpdater, Lens, NotAnArray, UnfocusedLens, Updater } from 'immutable-lens'
import { ReadableStore } from './ReadableStore'
import { UpdatableStore } from './UpdatableStore'
import { ComputedStore } from './ComputedStore'

export type FieldLenses<State, RecomposedState> = object & NotAnArray & {[K in keyof RecomposedState]: Lens<State, RecomposedState[K]>}

export type ValueComputers<State, ComputedValues> = {[K in keyof ComputedValues]: (state: State) => ComputedValues[K]}

export type AsyncValueComputers<State, ComputedValues> = {[K in keyof ComputedValues]: (state$: Observable<State>) => Observable<ComputedValues[K]>}

export interface Store<State> extends ReadableStore<State>, UpdatableStore<State> {

   readonly state$: Observable<State>
   readonly currentState: State
   readonly lens: UnfocusedLens<State>
   readonly path: string

   ////////////
   // FOCUS //
   //////////

   focusOn<K extends keyof State>(this: Store<State & NotAnArray>,
                                  key: K): Store<State[K]>

   focusWith<Target>(lens: Lens<State, Target>): Store<Target>

   focusPath<K extends keyof State>(this: Store<State & NotAnArray>,
                                    key: K): Store<State[K]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1]>(key1: K1, key2: K2): Store<State[K1][K2]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2]>(key1: K1, key2: K2, key3: K3): Store<State[K1][K2][K3]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3]>(key1: K1, key2: K2, key3: K3, key4: K4): Store<State[K1][K2][K3][K4]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3],
      K5 extends keyof State[K1][K2][K3][K4]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5): Store<State[K1][K2][K3][K4][K5]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3],
      K5 extends keyof State[K1][K2][K3][K4],
      K6 extends keyof State[K1][K2][K3][K4][K5]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5, key6: K6): Store<State[K1][K2][K3][K4][K5][K6]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3],
      K5 extends keyof State[K1][K2][K3][K4],
      K6 extends keyof State[K1][K2][K3][K4][K5],
      K7 extends keyof State[K1][K2][K3][K4][K5][K6]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5, key6: K6, key7: K7): Store<State[K1][K2][K3][K4][K5][K6][K7]>

   focusFields<K extends keyof State>(this: Store<State & NotAnArray>, ...keys: K[]): Store<Pick<State, K>>

   recompose<RecomposedState>(this: Store<State & object & NotAnArray>,
                              fields: FieldLenses<State & object, RecomposedState>): Store<RecomposedState>

   // TODO API DESIGN
   // setIndexValues()
   // updateIndexes()
   // updateIndexValues()

   /////////////
   // UPDATE //
   ///////////

   update(updater: Updater<State>): void

   updateFieldValues(this: Store<State & NotAnArray>,
                     fieldsUpdater: FieldsUpdater<State>): void

   pipe(...updaters: Updater<State>[]): void

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues>(this: UpdatableStore<State & object & NotAnArray>, computer: (state: State) => ComputedValues): ComputedStore<State, ComputedValues>

   computeValues<ComputedValues>(this: UpdatableStore<State & object & NotAnArray>, values: ValueComputers<State, ComputedValues>): ComputedStore<State, ComputedValues>

   compute$<ComputedValues>(this: UpdatableStore<State & object & NotAnArray>, computer$: (state$: Observable<State>) => Observable<ComputedValues>, initialValues: ComputedValues): ComputedStore<State, ComputedValues>

   computeValues$<ComputedValues>(this: UpdatableStore<State & object & NotAnArray>, values$: AsyncValueComputers<State, ComputedValues>, initialValues: ComputedValues): ComputedStore<State, ComputedValues>

}
