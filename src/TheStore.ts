import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'

import { FieldLenses, NotAnArray, UnfocusedLens } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

import { ActionDispatchers } from './ActionDispatch'
import { FocusedHandlers } from './FocusedHandlers'
import { MergedFields } from './MergedFields'
import { ReadableStore } from './ReadableStore'

export interface TheStore<Type extends {
   state: any
   computedValues: object
   actions: object
   dependencies: object
}> extends ReadableStore<Type['state']> {

   name?: string
   readonly state$: Observable<Type['state']>
   readonly currentState: Type['state']
   readonly path: string

   ///////////
   // READ //
   /////////

   pick<K extends keyof (Type['state'] & Type['computedValues'])>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      ...keys: K[]
   ): Observable<Pick<Type['state'], K>>

   cherryPick<Selection>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      fields: FieldLenses<Type['state'] & Type['computedValues'], Selection> // TODO Allow ReadonlyLens
   ): Observable<Selection>

   pluck<K extends keyof Type['state']>(key: K): Observable<Type['state'][K]>

   pluck<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]>(key1: K1, key2: K2): Observable<Type['state'][K1][K2]>

   pluck<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]>(key1: K1, key2: K2, key3: K3): Observable<Type['state'][K1][K2][K3]>

   pluck<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2],
      K4 extends keyof Type['state'][K1][K2][K3]>(key1: K1, key2: K2, key3: K3, key4: K4): Observable<Type['state'][K1][K2][K3][K4]>

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      computer: (state: Type['state'] & Type['computedValues']) => ComputedValues
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      selection: FieldLenses<Type['state'], Selection>,
      computer: (selection: Selection & Type['computedValues']) => ComputedValues
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields<K extends keyof (Type['state'] & Type['computedValues']), ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      fields: K[],
      computer: (fields: Pick<Type['state'] & Type['computedValues'], K>) => ComputedValues
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      computer$: (state$: Observable<Type['state'] & Type['computedValues']>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      computer$: (state$: Observable<Type['state'] & Type['computedValues']>) => Observable<ComputedValues>
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], Partial<ComputedValues>>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom$<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      selection: FieldLenses<Type['state'], Selection>,
      computer$: (selection$: Observable<Selection & Type['computedValues']>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom$<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      selection: FieldLenses<Type['state'], Selection>,
      computer$: (selection$: Observable<Selection & Type['computedValues']>) => Observable<ComputedValues>,
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], Partial<ComputedValues>>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<K extends keyof (Type['state'] & Type['computedValues']), ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      fields: K[],
      computer$: (fields$: Observable<Pick<Type['state'] & Type['computedValues'], K>>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<K extends keyof (Type['state'] & Type['computedValues']), ComputedValues extends object & NotAnArray>(
      this: TheStore<Type & { state: object & NotAnArray }>,
      fields: K[],
      computer$: (fields$: Observable<Pick<Type['state'] & Type['computedValues'], K>>) => Observable<ComputedValues>
   ): TheStore<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], Partial<ComputedValues>>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<Actions extends object & NotAnArray>(): TheStore<{
      state: Type['state']
      computedValues: Type['computedValues']
      actions: MergedFields<Type['actions'], Actions>
      dependencies: Type['dependencies']
   }>

   actionHandlers(
      this: TheStore<Type & { state: object & NotAnArray }>,
      focusedHandlers: (lens: UnfocusedLens<Type['state'] & Type['computedValues']>) => FocusedHandlers<Type['state'], Type['actions']>
   ): TheStore<Type>

   actionHandlers(
      focusedHandlers: (lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type['state'], Type['actions']>
   ): TheStore<Type>

   actions: ActionDispatchers<Type['actions']>

   ////////////
   // FOCUS //
   //////////

   focusFields<K extends keyof Type['state']>(...keys: K[]): TheStore<{
      state: Pick<Type['state'], K>
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<K extends keyof Type['state']>(keys: K[]): TheStore<{
      state: Pick<Type['state'], K>
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<SK extends keyof Type['state'], CK extends keyof Type['computedValues']>(
      keys: SK[],
      computed: CK[]
   ): TheStore<{
      state: Pick<Type['state'], SK>
      computedValues: Pick<Type['computedValues'], CK>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState>(fields: FieldLenses<Type['state'], RecomposedState>): TheStore<{
      state: RecomposedState
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState, CK extends keyof Type['computedValues']>(
      fields: FieldLenses<Type['state'], RecomposedState>,
      computedValues: CK[]
   ): TheStore<{
      state: RecomposedState
      computedValues: Pick<Type['computedValues'], CK>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<K extends keyof Type['state']>(key: K): TheStore<{
      state: Type['state'][K]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<K extends keyof Type['state']>(path: [K]): TheStore<{
      state: Type['state'][K]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<SK extends keyof Type['state'], CK extends keyof Type['computedValues']>(
      this: TheStore<{
         state: object & NotAnArray
         computedValues: Type['computedValues']
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>,
      path: [SK],
      computedValues: CK[]
   ): TheStore<{
      state: Type['state'][SK]
      computedValues: Pick<Type['computedValues'], CK>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]>(key1: K1, key2: K2): TheStore<{
         state: Type['state'][K1][K2]
         computedValues: {}
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]>(path: [K1, K2]): TheStore<{
         state: Type['state'][K1][K2]
         computedValues: {}
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      CK extends keyof Type['computedValues']>(
      this: TheStore<{
         state: object & NotAnArray
         computedValues: Type['computedValues']
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>,
      path: [K1, K2],
      computedValues: CK[]
      ): TheStore<{
         state: Type['state'][K1][K2]
         computedValues: Pick<Type['computedValues'], CK>
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]>(key1: K1, key2: K2, key3: K3): TheStore<{
         state: Type['state'][K1][K2][K3]
         computedValues: {}
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]>(path: [K1, K2, K3]): TheStore<{
         state: Type['state'][K1][K2][K3]
         computedValues: {}
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2],
      CK extends keyof Type['computedValues']>(
      this: TheStore<{
         state: object & NotAnArray
         computedValues: Type['computedValues']
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>,
      path: [K1, K2, K3],
      computedValues: CK[]
      ): TheStore<{
         state: Type['state'][K1][K2][K3]
         computedValues: Pick<Type['computedValues'], CK>
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>




















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
