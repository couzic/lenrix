import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';

import { FieldLenses, Lens, NotAnArray } from 'immutable-lens';
import { Observable } from 'rxjs/Observable';

import { ComputedStore } from './ComputedStore';
import { ReadableStore } from './ReadableStore';
import { UpdatableStore } from './UpdatableStore';

export type ValueComputers<State, ComputedValues> = {[K in keyof ComputedValues]: (state: State) => ComputedValues[K]}

export type AsyncValueComputers<State, ComputedValues> = {[K in keyof ComputedValues]: (state$: Observable<State>) => Observable<ComputedValues[K]>}

export interface Store<State> extends ReadableStore<State>, UpdatableStore<State> {

   // TODO API DESIGN
   // setIndexValues()
   // updateIndexes()
   // updateIndexValues()

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues extends object & NotAnArray>(computer: (state: State) => ComputedValues): ComputedStore<State, ComputedValues>

   // compute$<ComputedValues extends object & NotAnArray>(computer$: (state$: Observable<State>) => Observable<ComputedValues>, initialValues: ComputedValues): ComputedStore<State, ComputedValues>

   ////////////
   // FOCUS //
   //////////

   focusOn<K extends keyof State>(this: Store<State & NotAnArray>,
      key: K): Store<State[K]>

   focusWith<Target>(lens: Lens<State, Target>): Store<Target>

   recompose<RecomposedState>(this: Store<State & object & NotAnArray>,
      fields: FieldLenses<State & object, RecomposedState>): Store<RecomposedState>

   focusFields<K extends keyof State>(this: Store<State & NotAnArray>,
      ...keys: K[]): Store<Pick<State, K>>

   focusFields<K extends keyof State>(this: Store<State & NotAnArray>,
      keys: K[]): Store<Pick<State, K>>

   focusPath<K extends keyof State>(this: Store<State & NotAnArray>,
      key: K): Store<State[K]>

   focusPath<K extends keyof State>(this: Store<State & NotAnArray>,
      path: [K]): Store<State[K]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1]>(key1: K1, key2: K2): Store<State[K1][K2]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1]>(path: [K1, K2]): Store<State[K1][K2]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2]>(key1: K1, key2: K2, key3: K3): Store<State[K1][K2][K3]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2]>(path: [K1, K2, K3]): Store<State[K1][K2][K3]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3]>(key1: K1, key2: K2, key3: K3, key4: K4): Store<State[K1][K2][K3][K4]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3]>(path: [K1, K2, K3, K4]): Store<State[K1][K2][K3][K4]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3],
      K5 extends keyof State[K1][K2][K3][K4]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5): Store<State[K1][K2][K3][K4][K5]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3],
      K5 extends keyof State[K1][K2][K3][K4]>(path: [K1, K2, K3, K4, K5]): Store<State[K1][K2][K3][K4][K5]>

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
      K6 extends keyof State[K1][K2][K3][K4][K5]>(path: [K1, K2, K3, K4, K5, K6]): Store<State[K1][K2][K3][K4][K5][K6]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3],
      K5 extends keyof State[K1][K2][K3][K4],
      K6 extends keyof State[K1][K2][K3][K4][K5],
      K7 extends keyof State[K1][K2][K3][K4][K5][K6]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5, key6: K6, key7: K7): Store<State[K1][K2][K3][K4][K5][K6][K7]>

   focusPath<K1 extends keyof State,
      K2 extends keyof State[K1],
      K3 extends keyof State[K1][K2],
      K4 extends keyof State[K1][K2][K3],
      K5 extends keyof State[K1][K2][K3][K4],
      K6 extends keyof State[K1][K2][K3][K4][K5],
      K7 extends keyof State[K1][K2][K3][K4][K5][K6]>(path: [K1, K2, K3, K4, K5, K6, K7]): Store<State[K1][K2][K3][K4][K5][K6][K7]>

}
