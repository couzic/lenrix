import { PlainObject, UnfocusedLens } from 'immutable-lens'
import { Observable, OperatorFunction } from 'rxjs'

import { ActionObject } from './ActionObject'
import { ComputedState } from './ComputedState'
import { FocusedHandlers } from './FocusedHandlers'
import { FocusedReadonlySelection } from './FocusedReadonlySelection'
import { FocusedUpdatableSelection } from './FocusedUpdatableSelection'
import { LightStore } from './LightStore'

export interface HmrHandlers<T> {
   handlers?: T
   epics?: any
   effects?: any
}

export interface Store<
   Type extends {
      state: any
      computedValues: object
      actions: object
      dependencies: object
   }
> {
   name?: string

   readonly localLens: UnfocusedLens<Type['state']>
   readonly state$: Observable<Type['state']>
   readonly currentState: Type['state']
   readonly computedState$: Observable<
      { [K in keyof ComputedState<Type>]: ComputedState<Type>[K] }
   >
   readonly currentComputedState: {
      [K in keyof ComputedState<Type>]: ComputedState<Type>[K]
   }
   readonly path: string

   //////////////
   //   HMR   //
   ////////////

   hmrUpdate({
      epics,
      handlers,
      effects
   }: HmrHandlers<FocusedHandlers<Type>>): void

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<Actions extends PlainObject>(): Store<{
      state: Type['state']
      computedValues: Type['computedValues']
      actions: {
         [K in
            | Exclude<keyof Actions, keyof Type['actions']>
            | Exclude<keyof Type['actions'], keyof Actions>]: (Type['actions'] &
            Actions)[K]
      }
      dependencies: Type['dependencies']
   }>

   updates(
      this: Store<Type>,
      focusedHandlers: (
         lens: UnfocusedLens<Type['state']>
      ) => FocusedHandlers<Type>
   ): Store<Type>

   updates(
      this: Store<Type>,
      focusedHandlers: FocusedHandlers<Type>
   ): Store<Type>

   dispatch(action: ActionObject<Type['actions']>): void
   // TODO Implement ?
   // dispatch<ActionType extends keyof Type['actions'], Payload extends Type['actions'][ActionType]>(type: ActionType, payload: Payload): void

   // action$: Observable<Type['actions']>

   epics(
      epics: {
         [ActionType in keyof Type['actions']]?: (
            payload$: Observable<Type['actions'][ActionType]>,
            store: LightStore<Type>,
            dependencies: Type['dependencies']
         ) => Observable<ActionObject<Type['actions']>>
      }
   ): Store<Type>

   sideEffects(
      effects: {
         [ActionType in keyof Type['actions']]?: (
            payload: Type['actions'][ActionType],
            store: LightStore<Type>,
            dependencies: Type['dependencies']
         ) => void
      }
   ): Store<Type>

   ///////////
   // READ //
   /////////

   pick<K extends keyof ComputedState<Type>>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      ...keys: K[]
   ): Observable<{ [P in K]: ComputedState<Type>[P] }>

   cherryPick<Selection>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      selection: FocusedReadonlySelection<Type, Selection>
   ): Observable<Selection>

   pluck<CS extends ComputedState<Type>, K extends keyof CS>(
      key: K
   ): Observable<CS[K]>

   pluck<
      CS extends ComputedState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1]
   >(
      key1: K1,
      key2: K2
   ): Observable<CS[K1][K2]>

   pluck<
      CS extends ComputedState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1],
      K3 extends keyof CS[K1][K2]
   >(
      key1: K1,
      key2: K2,
      key3: K3
   ): Observable<CS[K1][K2][K3]>

   pluck<
      CS extends ComputedState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1],
      K3 extends keyof CS[K1][K2],
      K4 extends keyof CS[K1][K2][K3]
   >(
      key1: K1,
      key2: K2,
      key3: K3,
      key4: K4
   ): Observable<CS[K1][K2][K3][K4]>

   ///////////////
   // OPTIMIZE //
   /////////////

   filter(
      predicate: (
         state: { [K in keyof ComputedState<Type>]: ComputedState<Type>[K] }
      ) => boolean
   ): Store<Type>

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      computer: (
         state: { [K in keyof ComputedState<Type>]: ComputedState<Type>[K] },
         store: LightStore<Type>
      ) => ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: {
         [K in keyof (Type['computedValues'] &
            ComputedValues)]: (Type['computedValues'] & ComputedValues)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom<
      Selection extends PlainObject,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      selection: FocusedReadonlySelection<Type, Selection>,
      computer: (
         selection: Selection,
         store: LightStore<Type>
      ) => ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: {
         [K in keyof (Type['computedValues'] &
            ComputedValues)]: (Type['computedValues'] & ComputedValues)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields<
      K extends keyof ComputedState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      computer: (
         fields: { [P in K]: ComputedState<Type>[P] },
         store: LightStore<Type>
      ) => ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: {
         [P in keyof (Type['computedValues'] &
            ComputedValues)]: (Type['computedValues'] & ComputedValues)[P]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      computer$: OperatorFunction<
         { [K in keyof ComputedState<Type>]: ComputedState<Type>[K] },
         ComputedValues
      >,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: {
         [K in keyof (Type['computedValues'] &
            ComputedValues)]: (Type['computedValues'] & ComputedValues)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      computer$: OperatorFunction<
         { [K in keyof ComputedState<Type>]: ComputedState<Type>[K] },
         ComputedValues
      >
   ): Store<{
      state: Type['state']
      computedValues: {
         [K in keyof (Type['computedValues'] &
            Partial<ComputedValues>)]: (Type['computedValues'] &
            Partial<ComputedValues>)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom$<
      Selection extends PlainObject,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      selection: FocusedReadonlySelection<Type, Selection>,
      computer$: OperatorFunction<Selection, ComputedValues>,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: {
         [K in keyof (Type['computedValues'] &
            ComputedValues)]: (Type['computedValues'] & ComputedValues)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFrom$<
      Selection extends PlainObject,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      selection: FocusedReadonlySelection<Type, Selection>,
      computer$: OperatorFunction<Selection, ComputedValues>
   ): Store<{
      state: Type['state']
      computedValues: {
         [K in keyof (Type['computedValues'] &
            Partial<ComputedValues>)]: (Type['computedValues'] &
            Partial<ComputedValues>)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<
      K extends keyof ComputedState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      computer$: (
         fields$: Observable<{ [P in K]: ComputedState<Type>[P] }>
      ) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      computedValues: {
         [CVK in keyof (Type['computedValues'] &
            ComputedValues)]: (Type['computedValues'] & ComputedValues)[CVK]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<
      K extends keyof ComputedState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      computer$: (
         fields$: Observable<{ [P in K]: ComputedState<Type>[P] }>
      ) => Observable<ComputedValues>
   ): Store<{
      state: Type['state']
      computedValues: {
         [CVK in keyof (Type['computedValues'] &
            Partial<ComputedValues>)]: (Type['computedValues'] &
            Partial<ComputedValues>)[CVK]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   ////////////
   // FOCUS //
   //////////

   focusFields<K extends keyof Type['state']>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      ...keys: K[]
   ): Store<{
      state: { [P in K]: Type['state'][P] }
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<K extends keyof Type['state']>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      keys: K[]
   ): Store<{
      state: { [P in K]: Type['state'][P] }
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<
      SK extends keyof Type['state'],
      CK extends keyof Type['computedValues']
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      keys: SK[],
      computed: CK[]
   ): Store<{
      state: { [P in SK]: Type['state'][P] }
      computedValues: { [P in CK]: Type['computedValues'][P] }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState>(
      fields: FocusedUpdatableSelection<Type, RecomposedState>
   ): Store<{
      state: RecomposedState
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState, CK extends keyof Type['computedValues']>(
      fields: FocusedUpdatableSelection<Type, RecomposedState>,
      computedValues: CK[]
   ): Store<{
      state: RecomposedState
      computedValues: { [P in CK]: Type['computedValues'][P] }
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

   focusPath<
      SK extends keyof Type['state'],
      CK extends keyof Type['computedValues']
   >(
      path: [SK],
      computedValues: CK[]
   ): Store<{
      state: Type['state'][SK]
      computedValues: { [P in CK]: Type['computedValues'][P] }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]
   >(
      key1: K1,
      key2: K2
   ): Store<{
      state: Type['state'][K1][K2]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]
   >(
      path: [K1, K2]
   ): Store<{
      state: Type['state'][K1][K2]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      CK extends keyof Type['computedValues']
   >(
      path: [K1, K2],
      computedValues: CK[]
   ): Store<{
      state: Type['state'][K1][K2]
      computedValues: { [P in CK]: Type['computedValues'][P] }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]
   >(
      key1: K1,
      key2: K2,
      key3: K3
   ): Store<{
      state: Type['state'][K1][K2][K3]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]
   >(
      path: [K1, K2, K3]
   ): Store<{
      state: Type['state'][K1][K2][K3]
      computedValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2],
      CK extends keyof Type['computedValues']
   >(
      path: [K1, K2, K3],
      computedValues: CK[]
   ): Store<{
      state: Type['state'][K1][K2][K3]
      computedValues: { [P in CK]: Type['computedValues'][P] }
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
