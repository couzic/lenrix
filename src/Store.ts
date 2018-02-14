import 'rxjs/add/operator/distinctUntilChanged'
import 'rxjs/add/operator/map'

import { NotAnArray, UnfocusedLens } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

import { ActionObject } from './ActionObject'
import { ComputedState } from './ComputedState'
import { FocusedHandlers } from './FocusedHandlers'
import { FocusedSelection } from './FocusedSelection'
import { LightStore } from './LightStore'
import { MergedFields } from './MergedFields'

export interface Store<Type extends {
   state: any
   computedValues: object
   actions: object
   dependencies: object
}> {

   name?: string

   readonly localLens: UnfocusedLens<Type['state']>
   readonly state$: Observable<Type['state']>
   readonly currentState: Type['state']
   readonly computedState$: Observable<ComputedState<Type>>
   readonly currentComputedState: ComputedState<Type>
   readonly path: string

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<Actions extends object & NotAnArray>(): Store<{
      state: Type['state']
      computedValues: Type['computedValues']
      actions: MergedFields<Type['actions'], Actions>
      dependencies: Type['dependencies']
   }>

   updates(
      this: Store<Type>,
      focusedHandlers: (lens: UnfocusedLens<Type['state']>) => FocusedHandlers<Type>
   ): Store<Type>

   updates(
      this: Store<Type>,
      focusedHandlers: FocusedHandlers<Type>
   ): Store<Type>

   dispatch(action: ActionObject<Type['actions']>): void
   // TODO Implement ?
   // dispatch<ActionType extends keyof Type['actions'], Payload extends Type['actions'][ActionType]>(type: ActionType, payload: Payload): void

   // action$: Observable<Type['actions']>

   epics(epics: {
      [ActionType in keyof Type['actions']]?: (
         payload$: Observable<Type['actions'][ActionType]>,
         store: LightStore<Type>,
         dependencies: Type['dependencies']
      ) => Observable<ActionObject<Type['actions']>>
   }): Store<Type>

   sideEffects(effects: {
      [ActionType in keyof Type['actions']]?: (
         payload: Type['actions'][ActionType],
         store: LightStore<Type>,
         dependencies: Type['dependencies']
      ) => void
   }): Store<Type>

   ///////////
   // READ //
   /////////

   pick<K extends keyof ComputedState<Type>>(
      this: Store<Type & { state: object & NotAnArray }>,
      ...keys: K[]
   ): Observable<Pick<ComputedState<Type>, K>>

   cherryPick<Selection>(
      this: Store<Type & { state: object & NotAnArray }>,
      selection: FocusedSelection<Type, Selection>
   ): Observable<Selection>

   pluck<
      CS extends ComputedState<Type>,
      K extends keyof CS>(key: K): Observable<CS[K]>

   pluck<
      CS extends ComputedState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1]>(key1: K1, key2: K2): Observable<CS[K1][K2]>

   pluck<
      CS extends ComputedState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1],
      K3 extends keyof CS[K1][K2]>(key1: K1, key2: K2, key3: K3): Observable<CS[K1][K2][K3]>

   pluck<
      CS extends ComputedState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1],
      K3 extends keyof CS[K1][K2],
      K4 extends keyof CS[K1][K2][K3]>(key1: K1, key2: K2, key3: K3, key4: K4): Observable<CS[K1][K2][K3][K4]>

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      computer: (state: ComputedState<Type>, store?: LightStore<Type>) => ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      selection: FocusedSelection<Type, Selection>,
      computer: (selection: Selection, store?: LightStore<Type>) => ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields<K extends keyof ComputedState<Type>, ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      fields: K[],
      computer: (fields: Pick<ComputedState<Type>, K>, store?: LightStore<Type>) => ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      computer$: (state$: Observable<ComputedState<Type>>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      computer$: (state$: Observable<ComputedState<Type>>) => Observable<ComputedValues>
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], Partial<ComputedValues>>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom$<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      selection: FocusedSelection<Type, Selection>,
      computer$: (selection$: Observable<Selection>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom$<Selection extends object & NotAnArray, ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      selection: FocusedSelection<Type, Selection>,
      computer$: (selection$: Observable<Selection & Type['computedValues']>) => Observable<ComputedValues>,
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], Partial<ComputedValues>>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<K extends keyof ComputedState<Type>, ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      fields: K[],
      computer$: (fields$: Observable<Pick<ComputedState<Type>, K>>) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], ComputedValues>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<K extends keyof ComputedState<Type>, ComputedValues extends object & NotAnArray>(
      this: Store<Type & { state: object & NotAnArray }>,
      fields: K[],
      computer$: (fields$: Observable<Pick<ComputedState<Type>, K>>) => Observable<ComputedValues>
   ): Store<{
      state: Type['state']
      computedValues: MergedFields<Type['computedValues'], Partial<ComputedValues>>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   ////////////
   // FOCUS //
   //////////

   focusFields<K extends keyof Type['state']>(
      this: Store<Type & { state: object & NotAnArray }>,
      ...keys: K[]
   ): Store<{
      state: Pick<Type['state'], K>
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<K extends keyof Type['state']>(
      this: Store<Type & { state: object & NotAnArray }>,
      keys: K[]
   ): Store<{
      state: Pick<Type['state'], K>
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<SK extends keyof Type['state'], CK extends keyof Type['computedValues']>(
      this: Store<Type & { state: object & NotAnArray }>,
      keys: SK[],
      computed: CK[]
   ): Store<{
      state: Pick<Type['state'], SK>
      computedValues: Pick<Type['computedValues'], CK>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState>(fields: FocusedSelection<Type, RecomposedState>): Store<{
      state: RecomposedState
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState, CK extends keyof Type['computedValues']>(
      fields: FocusedSelection<Type, RecomposedState>,
      computedValues: CK[]
   ): Store<{
      state: RecomposedState
      computedValues: Pick<Type['computedValues'], CK>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<K extends keyof Type['state']>(
      key: K
   ): Store<{
      state: Type['state'][K]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<K extends keyof Type['state']>(
      path: [K]
   ): Store<{
      state: Type['state'][K]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<SK extends keyof Type['state'], CK extends keyof Type['computedValues']>(
      path: [SK],
      computedValues: CK[]
   ): Store<{
      state: Type['state'][SK]
      computedValues: Pick<Type['computedValues'], CK>
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]>(key1: K1, key2: K2): Store<{
         state: Type['state'][K1][K2]
         computedValues: {}
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]>(path: [K1, K2]): Store<{
         state: Type['state'][K1][K2]
         computedValues: {}
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      CK extends keyof Type['computedValues']>(
         path: [K1, K2],
         computedValues: CK[]
      ): Store<{
         state: Type['state'][K1][K2]
         computedValues: Pick<Type['computedValues'], CK>
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]>(key1: K1, key2: K2, key3: K3): Store<{
         state: Type['state'][K1][K2][K3]
         computedValues: {}
         actions: Type['actions']
         dependencies: Type['dependencies']
      }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]>(path: [K1, K2, K3]): Store<{
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
         path: [K1, K2, K3],
         computedValues: CK[]
      ): Store<{
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
