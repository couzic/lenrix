import { PlainObject, UnfocusedLens } from 'immutable-lens'
import { Observable, OperatorFunction } from 'rxjs'

import { LightStore } from './LightStore'
import { ActionObject } from './util/ActionObject'
import { ActionObservable } from './util/ActionObservable'
import { Epics } from './util/Epics'
import { FocusedHandlers } from './util/FocusedHandlers'
import { FocusedReadonlySelection } from './util/FocusedReadonlySelection'
import { FocusedUpdatableSelection } from './util/FocusedUpdatableSelection'
import { OutputState } from './util/OutputState'

export interface Store<
   Type extends {
      state: any
      readonlyValues: object
      actions: object
      dependencies: object
   }
> {
   name?: string

   readonly localLens: UnfocusedLens<Type['state']>
   readonly state$: Observable<OutputState<Type>>
   readonly currentState: OutputState<Type>
   // TODO Deprecate
   readonly computedState$: Observable<{
      [K in keyof OutputState<Type>]: OutputState<Type>[K]
   }>
   // TODO Deprecate
   readonly currentComputedState: {
      [K in keyof OutputState<Type>]: OutputState<Type>[K]
   }
   readonly action$: ActionObservable<Type['actions']>
   readonly path: string

   ///////////////
   // ACTIVATE //
   /////////////

   onActivate(callback: (store: Store<Type>) => void): Store<Type>
   activate(): void

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<Actions extends PlainObject>(): Store<{
      state: Type['state']
      readonlyValues: Type['readonlyValues']
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

   action<Action extends keyof Type['actions']>(
      action: Action
   ): Type['actions'][Action] extends void | null
      ? () => void
      : (payload: Type['actions'][Action]) => void

   // TODO Implement ?
   // dispatch<ActionType extends keyof Type['actions'], Payload extends Type['actions'][ActionType]>(type: ActionType, payload: Payload): void

   epics(
      epicsBuilder: (store: LightStore<Type>) => Epics<Type['actions']>
   ): Store<Type>

   pureEpics(epics: Epics<Type['actions']>): Store<Type>

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

   pick<K extends keyof OutputState<Type>>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      ...keys: K[]
   ): Observable<{ [P in K]: OutputState<Type>[P] }>

   cherryPick<Selection>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      selection: FocusedReadonlySelection<Type, Selection>
   ): Observable<Selection>

   pluck<CS extends OutputState<Type>, K extends keyof CS>(
      key: K
   ): Observable<CS[K]>

   pluck<
      CS extends OutputState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1]
   >(
      key1: K1,
      key2: K2
   ): Observable<CS[K1][K2]>

   pluck<
      CS extends OutputState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1],
      K3 extends keyof CS[K1][K2]
   >(
      key1: K1,
      key2: K2,
      key3: K3
   ): Observable<CS[K1][K2][K3]>

   pluck<
      CS extends OutputState<Type>,
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

   //////////////
   // COMPUTE //
   ////////////

   compute<ComputedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      computer: (
         state: { [K in keyof OutputState<Type>]: OutputState<Type>[K] },
         store: LightStore<Type>
      ) => ComputedValues
   ): Store<{
      state: Type['state']
      readonlyValues: {
         [K in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[K]
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
      readonlyValues: {
         [K in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields<
      K extends keyof OutputState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      computer: (
         fields: { [P in K]: OutputState<Type>[P] },
         store: LightStore<Type>
      ) => ComputedValues
   ): Store<{
      state: Type['state']
      readonlyValues: {
         [P in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[P]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromField<
      K extends keyof OutputState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      field: K,
      computer: (
         field: OutputState<Type>[K],
         store: LightStore<Type>
      ) => ComputedValues
   ): Store<{
      state: Type['state']
      readonlyValues: {
         [P in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[P]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      computer$: OperatorFunction<
         { [K in keyof OutputState<Type>]: OutputState<Type>[K] },
         ComputedValues
      >,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      readonlyValues: {
         [K in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   compute$<ComputedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      computer$: OperatorFunction<
         { [K in keyof OutputState<Type>]: OutputState<Type>[K] },
         ComputedValues
      >
   ): Store<{
      state: Type['state']
      readonlyValues: {
         [K in keyof (Type['readonlyValues'] &
            Partial<ComputedValues>)]: (Type['readonlyValues'] &
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
      readonlyValues: {
         [K in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[K]
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
      readonlyValues: {
         [K in keyof (Type['readonlyValues'] &
            Partial<ComputedValues>)]: (Type['readonlyValues'] &
            Partial<ComputedValues>)[K]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<
      K extends keyof OutputState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      computer$: (
         fields$: Observable<{ [P in K]: OutputState<Type>[P] }>
      ) => Observable<ComputedValues>,
      initialValues: ComputedValues
   ): Store<{
      state: Type['state']
      readonlyValues: {
         [CVK in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[CVK]
      }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   computeFromFields$<
      K extends keyof OutputState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      computer$: (
         fields$: Observable<{ [P in K]: OutputState<Type>[P] }>
      ) => Observable<ComputedValues>
   ): Store<{
      state: Type['state']
      readonlyValues: {
         [CVK in keyof (Type['readonlyValues'] &
            Partial<ComputedValues>)]: (Type['readonlyValues'] &
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
      readonlyValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<K extends keyof Type['state']>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      keys: K[]
   ): Store<{
      state: { [P in K]: Type['state'][P] }
      readonlyValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusFields<
      SK extends keyof Type['state'],
      CK extends keyof OutputState<Type>
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      keys: SK[],
      computed: CK[]
   ): Store<{
      state: { [P in SK]: Type['state'][P] }
      readonlyValues: { [P in CK]: OutputState<Type>[P] }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState>(
      fields: FocusedUpdatableSelection<Type, RecomposedState>
   ): Store<{
      state: RecomposedState
      readonlyValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   recompose<RecomposedState, CK extends keyof OutputState<Type>>(
      fields: FocusedUpdatableSelection<Type, RecomposedState>,
      readonlyValues: CK[]
   ): Store<{
      state: RecomposedState
      readonlyValues: { [P in CK]: OutputState<Type>[P] }
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<K extends keyof Type['state']>(
      key: K
   ): Store<{
      state: Type['state'][K]
      readonlyValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<K extends keyof Type['state']>(
      path: [K]
   ): Store<{
      state: Type['state'][K]
      readonlyValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      SK extends keyof Type['state'],
      CK extends keyof OutputState<Type>
   >(
      path: [SK],
      readonlyValues: CK[]
   ): Store<{
      state: Type['state'][SK]
      readonlyValues: { [P in CK]: OutputState<Type>[P] }
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
      readonlyValues: {}
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
      readonlyValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      CK extends keyof OutputState<Type>
   >(
      path: [K1, K2],
      readonlyValues: CK[]
   ): Store<{
      state: Type['state'][K1][K2]
      readonlyValues: { [P in CK]: OutputState<Type>[P] }
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
      readonlyValues: {}
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
      readonlyValues: {}
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2],
      CK extends keyof OutputState<Type>
   >(
      path: [K1, K2, K3],
      readonlyValues: CK[]
   ): Store<{
      state: Type['state'][K1][K2][K3]
      readonlyValues: { [P in CK]: OutputState<Type>[P] }
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
