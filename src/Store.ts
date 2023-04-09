import { PlainObject, UnfocusedLens } from 'immutable-lens'
import { Observable } from 'rxjs'

import { LightStore } from './LightStore'
import { ActionObject } from './utility-types/ActionObject'
import { ActionObservable } from './utility-types/ActionObservable'
import { Epics } from './utility-types/Epics'
import { FocusedHandlers } from './utility-types/FocusedHandlers'
import { FocusedReadonlySelection } from './utility-types/FocusedReadonlySelection'
import { FocusedUpdatableSelection } from './utility-types/FocusedUpdatableSelection'
import { StoreCurrentData } from './utility-types/StoreCurrentData'
import { StoreCurrentState } from './utility-types/StoreCurrentState'
import { StoreData } from './utility-types/StoreData'
import { StoreState } from './utility-types/StoreState'
import { StoreType } from './utility-types/StoreType'

type StoreWithReadonlyValues<
   Type extends StoreType,
   ReadonlyValues extends PlainObject
> = Store<{
   state: Type['state']
   readonlyValues: ReadonlyValues
   combinedValues: Type['combinedValues']
   loadingValues: Type['loadingValues']
   waitingToBeLoaded: Type['waitingToBeLoaded']
   actions: Type['actions']
   dependencies: Type['dependencies']
}>

type StoreWithCombinedValues<
   Type extends StoreType,
   CombinedValues extends PlainObject
> = Store<{
   state: Type['state']
   readonlyValues: Type['readonlyValues']
   combinedValues: CombinedValues
   loadingValues: Type['loadingValues']
   waitingToBeLoaded: Type['waitingToBeLoaded']
   actions: Type['actions']
   dependencies: Type['dependencies']
}>

// TODO this currently is not correct. We should only pass down the combined and loading values that are explicitely specified
// => migrate to new strategy using single object for key/value mapping, and separate key types
type StoreWithState<
   Type extends StoreType,
   NewType extends {
      state: any
      readonlyValues: PlainObject
   }
> = Store<{
   state: NewType['state']
   readonlyValues: NewType['readonlyValues']
   combinedValues: Type['combinedValues']
   loadingValues: Type['loadingValues']
   waitingToBeLoaded: Type['waitingToBeLoaded']
   actions: Type['actions']
   dependencies: Type['dependencies']
}>

export interface Store<Type extends StoreType> {
   name?: string

   readonly localLens: UnfocusedLens<Type['state']>
   readonly data$: Observable<StoreData<Type>>
   readonly currentData: StoreCurrentData<Type>
   readonly state$: Observable<StoreState<Type>>
   readonly currentState: StoreCurrentState<Type>

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
      combinedValues: Type['combinedValues']
      loadingValues: Type['loadingValues']
      waitingToBeLoaded: Type['waitingToBeLoaded']
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
      // TODO Solve problem: the whole point is to have guaranteed loaded and combined values, but here we will call store.currentState
      // and that will return nullable values.
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

   pick<K extends keyof StoreState<Type>>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      ...keys: K[]
   ): Observable<{ [P in K]: StoreState<Type>[P] }>

   cherryPick<Selection>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      selection: FocusedReadonlySelection<Type, Selection>
   ): Observable<Selection>

   pluck<CS extends StoreState<Type>, K extends keyof CS>(
      key: K
   ): Observable<CS[K]>

   pluck<
      CS extends StoreState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1]
   >(
      key1: K1,
      key2: K2
   ): Observable<CS[K1][K2]>

   pluck<
      CS extends StoreState<Type>,
      K1 extends keyof CS,
      K2 extends keyof CS[K1],
      K3 extends keyof CS[K1][K2]
   >(
      key1: K1,
      key2: K2,
      key3: K3
   ): Observable<CS[K1][K2][K3]>

   pluck<
      CS extends StoreState<Type>,
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

   ///////////
   // LOAD //
   /////////

   loadFromFields<
      K extends keyof StoreState<Type>,
      LoadingValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      load: (fields: {
         [P in K]: StoreState<Type>[P]
      }) => Observable<LoadingValues>
   ): Store<{
      state: Type['state']
      readonlyValues: Type['readonlyValues']
      combinedValues: Type['combinedValues']
      loadingValues: Type['loadingValues'] & LoadingValues
      waitingToBeLoaded: false
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   waitUntilLoaded(): Store<{
      state: Type['state']
      readonlyValues: Type['readonlyValues']
      combinedValues: Type['combinedValues']
      loadingValues: Type['loadingValues']
      waitingToBeLoaded: true
      actions: Type['actions']
      dependencies: Type['dependencies']
   }>

   //////////////
   // COMPUTE //
   ////////////

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
   ): StoreWithReadonlyValues<
      Type,
      {
         [K in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[K]
      }
   >

   computeFromFields<
      K extends keyof StoreState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      fields: K[],
      computer: (
         fields: { [P in K]: StoreState<Type>[P] },
         store: LightStore<Type>
      ) => ComputedValues
   ): StoreWithReadonlyValues<
      Type,
      {
         [P in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[P]
      }
   >

   computeFromField<
      K extends keyof StoreState<Type>,
      ComputedValues extends PlainObject
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      field: K,
      computer: (
         field: StoreState<Type>[K],
         store: LightStore<Type>
      ) => ComputedValues
   ): StoreWithReadonlyValues<
      Type,
      {
         [P in keyof (Type['readonlyValues'] &
            ComputedValues)]: (Type['readonlyValues'] & ComputedValues)[P]
      }
   >

   //////////////
   // COMBINE //
   ////////////

   combineValues<CombinedValues extends PlainObject>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      combinedValues$: Observable<CombinedValues>
   ): StoreWithCombinedValues<
      Type,
      {
         [K in keyof (Type['combinedValues'] &
            CombinedValues)]: (Type['combinedValues'] & CombinedValues)[K]
      }
   >

   ////////////
   // FOCUS //
   //////////

   focusFields<K extends keyof Type['state']>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      ...keys: K[]
   ): StoreWithState<
      Type,
      {
         state: { [P in K]: Type['state'][P] }
         readonlyValues: {}
      }
   >

   focusFields<K extends keyof Type['state']>(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      keys: K[]
   ): StoreWithState<
      Type,
      {
         state: { [P in K]: Type['state'][P] }
         readonlyValues: {}
      }
   >

   focusFields<
      SK extends keyof Type['state'],
      CK extends keyof StoreState<Type>
   >(
      this: Store<Type & { state: PlainObject<Type['state']> }>,
      keys: SK[],
      computed: CK[]
   ): StoreWithState<
      Type,
      {
         state: { [P in SK]: Type['state'][P] }
         readonlyValues: { [P in CK]: StoreState<Type>[P] }
      }
   >

   recompose<RecomposedState>(
      fields: FocusedUpdatableSelection<Type, RecomposedState>
   ): StoreWithState<
      Type,
      {
         state: RecomposedState
         readonlyValues: {}
      }
   >

   recompose<RecomposedState, CK extends keyof StoreState<Type>>(
      fields: FocusedUpdatableSelection<Type, RecomposedState>,
      readonlyValues: CK[]
   ): StoreWithState<
      Type,
      {
         state: RecomposedState
         readonlyValues: { [P in CK]: StoreState<Type>[P] }
      }
   >

   focusPath<K extends keyof Type['state']>(
      key: K
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K]
         readonlyValues: {}
      }
   >

   focusPath<K extends keyof Type['state']>(
      path: [K]
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K]
         readonlyValues: {}
      }
   >

   focusPath<SK extends keyof Type['state'], CK extends keyof StoreState<Type>>(
      path: [SK],
      readonlyValues: CK[]
   ): StoreWithState<
      Type,
      {
         state: Type['state'][SK]
         readonlyValues: { [P in CK]: StoreState<Type>[P] }
      }
   >

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]
   >(
      key1: K1,
      key2: K2
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K1][K2]
         readonlyValues: {}
      }
   >

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1]
   >(
      path: [K1, K2]
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K1][K2]
         readonlyValues: {}
      }
   >

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      CK extends keyof StoreState<Type>
   >(
      path: [K1, K2],
      readonlyValues: CK[]
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K1][K2]
         readonlyValues: { [P in CK]: StoreState<Type>[P] }
      }
   >

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]
   >(
      key1: K1,
      key2: K2,
      key3: K3
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K1][K2][K3]
         readonlyValues: {}
      }
   >

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2]
   >(
      path: [K1, K2, K3]
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K1][K2][K3]
         readonlyValues: {}
      }
   >

   focusPath<
      K1 extends keyof Type['state'],
      K2 extends keyof Type['state'][K1],
      K3 extends keyof Type['state'][K1][K2],
      CK extends keyof StoreState<Type>
   >(
      path: [K1, K2, K3],
      readonlyValues: CK[]
   ): StoreWithState<
      Type,
      {
         state: Type['state'][K1][K2][K3]
         readonlyValues: { [P in CK]: StoreState<Type>[P] }
      }
   >
}
