import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'

import { FieldLenses, NotAnArray } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

import { ComputedStore } from './ComputedStore'
import { ReadableStore } from './ReadableStore'
import { UpdatableStore } from './UpdatableStore'

export type ValueComputers<State, ComputedValues> = {[K in keyof ComputedValues]: (state: State) => ComputedValues[K]}

export type AsyncValueComputers<State, ComputedValues> = {[K in keyof ComputedValues]: (state$: Observable<State>) => Observable<ComputedValues[K]>}

export interface StoreType<State> {
   state: State
}

export interface Store<Type extends StoreType<any>> extends ReadableStore<Type['state']>, UpdatableStore<Type['state']> {

   // TODO API DESIGN
   // setIndexValues()
   // updateIndexes()
   // updateIndexValues()

   name?: string

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues extends object & NotAnArray>(
      this: Store<{ state: Type['state'] & object & NotAnArray }>,
      computer: (state: Type['state']) => ComputedValues
   ): ComputedStore<{ normalizedState: Type['state'], computedValues: ComputedValues }>

   computeFrom<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: Store<{ state: Type['state'] & object & NotAnArray }>,
      selection: FieldLenses<Type['state'], Selection>,
      computer: (selection: Selection) => ComputedValues
   ): ComputedStore<{ normalizedState: Type['state'], computedValues: ComputedValues }>

   // TODO Implement
   // computeFromFields<K extends keyof State, ComputedValues extends object & NotAnArray>(
   //    this: Store<State & object & NotAnArray>,
   //    fields: K[],
   //    computer: (fields: Pick<State, K>) => ComputedValues
   // ): ComputedStore<State, ComputedValues>

   compute$<ComputedValues extends object & NotAnArray>(
      this: Store<{ state: Type['state'] & object & NotAnArray }>,
      computer$: (state$: Observable<Type['state']>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): ComputedStore<{ normalizedState: Type['state'], computedValues: ComputedValues }>

   compute$<ComputedValues extends object & NotAnArray>(
      this: Store<{ state: Type['state'] & object & NotAnArray }>,
      computer$: (state$: Observable<Type['state']>) => Observable<ComputedValues>
   ): ComputedStore<{ normalizedState: Type['state'], computedValues: Partial<ComputedValues> }>

   // TODO Implement
   // computeFrom$<ComputedValues extends object & NotAnArray>(
   //    this: Store<State & object & NotAnArray>,
   //    selection: FieldLenses<State, Selection>,
   //    computer$: (selection$: Observable<Selection>) => Observable<ComputedValues>,
   //    initialValues: ComputedValues
   // ): ComputedStore<State, ComputedValues>

   // TODO Implement
   // computeFrom$<ComputedValues extends object & NotAnArray>(
   //    this: Store<State & object & NotAnArray>,
   //    selection: FieldLenses<State, Selection>,
   //    computer$: (selection$: Observable<Selection>) => Observable<ComputedValues>
   // ): ComputedStore<State, Partial<ComputedValues>>

   // TODO Implement
   // computeFromFields$<K extends keyof State, ComputedValues extends object & NotAnArray>(
   //    this: Store<State & object & NotAnArray>,
   //    fields: K[],
   //    computer$: (fields$: Observable<Pick<State, K>>) => Observable<ComputedValues>,
   //    initialValues: ComputedValues
   // ): ComputedStore<State, ComputedValues>

   // TODO Implement
   // computeFromFields$<K extends keyof State, ComputedValues extends object & NotAnArray>(
   //    this: Store<State & object & NotAnArray>,
   //    fields: K[],
   //    computer$: (fields$: Observable<Pick<State, K>>) => Observable<ComputedValues>
   // ): ComputedStore<State, Partial<ComputedValues>>

   ////////////
   // FOCUS //
   //////////

   // focusOn<K extends keyof State>(this: Store<State & NotAnArray>,
   //    key: K): Store<State[K]>

   // focusWith<Target>(lens: Lens<State, Target>): Store<Target>

   recompose<RecomposedState>(
      this: Store<{ state: Type['state'] & object & NotAnArray }>,
      fields: FieldLenses<Type['state'] & object, RecomposedState>
   ): Store<{ state: RecomposedState }>

   focusFields<K extends keyof Type['state']>(
      this: Store<{ state: Type['state'] & NotAnArray }>,
      ...keys: K[]
   ): Store<{ state: Pick<Type['state'], K> }>

   focusFields<K extends keyof Type['state']>(
      this: Store<{ state: Type['state'] & NotAnArray }>,
      keys: K[]
   ): Store<{ state: Pick<Type['state'], K> }>

   focusPath<K extends keyof Type['state']>(
      this: Store<{ state: Type['state'] & NotAnArray }>,
      key: K
   ): Store<{ state: Type['state'][K] }>

   focusPath<K extends keyof Type['state']>(
      this: Store<{ state: Type['state'] & NotAnArray }>,
      path: [K]
   ): Store<{ state: Type['state'][K] }>

   focusPath<K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]>(key1: K1, key2: K2): Store<{ state: Type['state'][K1][K2] }>

   focusPath<K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]>(path: [K1, K2]): Store<{ state: Type['state'][K1][K2] }>

   focusPath<K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]>(key1: K1, key2: K2, key3: K3): Store<{ state: Type['state'][K1][K2][K3] }>

   focusPath<K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]>(path: [K1, K2, K3]): Store<{ state: Type['state'][K1][K2][K3] }>

   focusPath<K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2],
      K4 extends keyof Type['state'][K1][K2][K3]>(key1: K1, key2: K2, key3: K3, key4: K4): Store<{ state: Type['state'][K1][K2][K3][K4] }>

   // focusPath<K1 extends keyof State,
   //    K2 extends keyof State[K1],
   //    K3 extends keyof State[K1][K2],
   //    K4 extends keyof State[K1][K2][K3]>(path: [K1, K2, K3, K4]): Store<State[K1][K2][K3][K4]>

   // focusPath<K1 extends keyof State,
   //    K2 extends keyof State[K1],
   //    K3 extends keyof State[K1][K2],
   //    K4 extends keyof State[K1][K2][K3],
   //    K5 extends keyof State[K1][K2][K3][K4]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5): Store<State[K1][K2][K3][K4][K5]>

   // focusPath<K1 extends keyof State,
   //    K2 extends keyof State[K1],
   //    K3 extends keyof State[K1][K2],
   //    K4 extends keyof State[K1][K2][K3],
   //    K5 extends keyof State[K1][K2][K3][K4]>(path: [K1, K2, K3, K4, K5]): Store<State[K1][K2][K3][K4][K5]>

   // focusPath<K1 extends keyof State,
   //    K2 extends keyof State[K1],
   //    K3 extends keyof State[K1][K2],
   //    K4 extends keyof State[K1][K2][K3],
   //    K5 extends keyof State[K1][K2][K3][K4],
   //    K6 extends keyof State[K1][K2][K3][K4][K5]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5, key6: K6): Store<State[K1][K2][K3][K4][K5][K6]>

   // focusPath<K1 extends keyof State,
   //    K2 extends keyof State[K1],
   //    K3 extends keyof State[K1][K2],
   //    K4 extends keyof State[K1][K2][K3],
   //    K5 extends keyof State[K1][K2][K3][K4],
   //    K6 extends keyof State[K1][K2][K3][K4][K5]>(path: [K1, K2, K3, K4, K5, K6]): Store<State[K1][K2][K3][K4][K5][K6]>

   // focusPath<K1 extends keyof State,
   //    K2 extends keyof State[K1],
   //    K3 extends keyof State[K1][K2],
   //    K4 extends keyof State[K1][K2][K3],
   //    K5 extends keyof State[K1][K2][K3][K4],
   //    K6 extends keyof State[K1][K2][K3][K4][K5],
   //    K7 extends keyof State[K1][K2][K3][K4][K5][K6]>(key1: K1, key2: K2, key3: K3, key4: K4, key5: K5, key6: K6, key7: K7): Store<State[K1][K2][K3][K4][K5][K6][K7]>

   // focusPath<K1 extends keyof State,
   //    K2 extends keyof State[K1],
   //    K3 extends keyof State[K1][K2],
   //    K4 extends keyof State[K1][K2][K3],
   //    K5 extends keyof State[K1][K2][K3][K4],
   //    K6 extends keyof State[K1][K2][K3][K4][K5],
   //    K7 extends keyof State[K1][K2][K3][K4][K5][K6]>(path: [K1, K2, K3, K4, K5, K6, K7]): Store<State[K1][K2][K3][K4][K5][K6][K7]>

}
