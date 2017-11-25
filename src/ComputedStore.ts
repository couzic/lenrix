import { FieldLenses, NotAnArray, UnfocusedLens } from 'immutable-lens'
import { Observable } from 'rxjs/Observable'

import { ActionComputedStore } from './ActionComputedStore'
import { MergedFields } from './MergedFields'
import { ReadableStore } from './ReadableStore'
import { Store } from './Store'
import { UpdatableStore } from './UpdatableStore'

export interface ComputedStoreType<NormalizedState extends object & NotAnArray, ComputedValues> {
   normalizedState: NormalizedState
   computedValues: ComputedValues
}

export interface ComputedStore<Type extends ComputedStoreType<object & NotAnArray, any>>
   extends ReadableStore<Type['normalizedState'] & Type['computedValues']>, UpdatableStore<Type['normalizedState']> {

   readonly lens: UnfocusedLens<Type['normalizedState']>
   readonly path: string

   name?: string

   //////////////
   // COMPUTE //
   ////////////

   compute<NewComputedValues extends object & NotAnArray>(
      computer: (state: Type['normalizedState'] & Type['computedValues']) => NewComputedValues
   ): ComputedStore<{
      normalizedState: Type['normalizedState']
      computedValues: MergedFields<Type['computedValues'], NewComputedValues>
   }>

   computeFrom<Selection extends object & NotAnArray, NewComputedValues extends object & NotAnArray>(
      selection: FieldLenses<Type['normalizedState'] & Type['computedValues'], Selection>,
      computer: (selection: Selection) => NewComputedValues
   ): ComputedStore<{
      normalizedState: Type['normalizedState'],
      computedValues: MergedFields<Type['computedValues'], NewComputedValues>
   }>

   // TODO ImplementType['computedValues'] & NewComputedValues
   // computeFromFields<K extends keyof NormalizedState & ComputedValues, NewComputedValues extends object & NotAnArray>(
   //    fields: K[],
   //    computer: (fields: Pick<NormalizedState & ComputedValues, K>) => NewComputedValues
   // ): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   compute$<NewComputedValues extends object & NotAnArray>(
      computer$: (state$: Observable<Type['normalizedState'] & Type['computedValues']>) => Observable<NewComputedValues>,
      initialValues: NewComputedValues
   ): ComputedStore<{
      normalizedState: Type['normalizedState'],
      computedValues: MergedFields<Type['computedValues'], NewComputedValues>
   }>

   compute$<NewComputedValues extends object & NotAnArray>(
      computer$: (state$: Observable<Type['normalizedState'] & Type['computedValues']>) => Observable<NewComputedValues>
   ): ComputedStore<{
      normalizedState: Type['normalizedState'],
      computedValues: MergedFields<Type['computedValues'], Partial<NewComputedValues>>
   }>

   // TODO Implement
   // computeFrom$<NewComputedValues extends object & NotAnArray>(
   //    selection: FieldLenses<NormalizedState & ComputedValues, Selection>,
   //    computer$: (selection$: Observable<Selection>) => Observable<NewComputedValues>,
   //    initialValues: NewComputedValues
   // ): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   // TODO Implement
   // computeFrom$<NewComputedValues extends object & NotAnArray>(
   //    selection: FieldLenses<NormalizedState & ComputedValues, Selection>,
   //    computer$: (selection$: Observable<Selection>) => Observable<NewComputedValues>
   // ): ComputedStore<NormalizedState, Partial<ComputedValues & NewComputedValues>>

   // TODO Implement
   // computeFromFields$<K extends keyof NormalizedState & ComputedValues, NewComputedValues extends object & NotAnArray>(
   //    fields: K[],
   //    computer$: (fields$: Observable<Pick<NormalizedState & ComputedValues, K>>) => Observable<NewComputedValues>,
   //    initialValues: NewComputedValues
   // ): ComputedStore<NormalizedState, ComputedValues & NewComputedValues>

   // TODO Implement
   // computeFromFields$<K extends keyof NormalizedState & ComputedValues, NewComputedValues extends object & NotAnArray>(
   //    fields: K[],
   //    computer$: (fields$: Observable<Pick<NormalizedState & ComputedValues, K>>) => Observable<NewComputedValues>
   // ): ComputedStore<NormalizedState, Partial<ComputedValues & NewComputedValues>>

   //////////////
   // ACTIONS //
   ////////////

   actionTypes<Actions>(): ActionComputedStore<{
      normalizedState: Type['normalizedState']
      computedValues: Type['computedValues']
      actions: Actions
   }>

   ////////////
   // FOCUS //
   //////////

   focusFields<K extends keyof Type['normalizedState']>(...keys: K[]): Store<{ state: Pick<Type['normalizedState'], K> }>

   focusFields<K extends keyof Type['normalizedState']>(keys: K[]): Store<{ state: Pick<Type['normalizedState'], K> }>

   focusFields<NK extends keyof Type['normalizedState'], CK extends keyof Type['computedValues']>(
      keys: NK[],
      computedValues: CK[]
   ): ComputedStore<{
      normalizedState: Pick<Type['normalizedState'], NK>,
      computedValues: Pick<Type['computedValues'], CK>
   }>

   recompose<RecomposedState>(fields: FieldLenses<Type['normalizedState'], RecomposedState>): Store<{ state: RecomposedState }>

   recompose<RecomposedState, CK extends keyof Type['computedValues']>(
      fields: FieldLenses<Type['normalizedState'], RecomposedState>,
      computedValues: CK[]
   ): ComputedStore<{
      normalizedState: RecomposedState,
      computedValues: Pick<Type['computedValues'], CK>
   }>

   focusPath<K extends keyof Type['normalizedState']>(key: K): Store<{ state: Type['normalizedState'][K] }>

   focusPath<K extends keyof Type['normalizedState']>(path: [K]): Store<{ state: Type['normalizedState'][K] }>

   focusPath<NK extends keyof Type['normalizedState'], CK extends keyof Type['computedValues']>(
      path: [NK],
      computedValues: CK[]
   ): ComputedStore<{
      normalizedState: Type['normalizedState'][NK],
      computedValues: Pick<Type['computedValues'], CK>
   }>

   focusPath<K1 extends keyof Type['normalizedState'],
      K2 extends keyof Type['normalizedState'][K1]>(key1: K1, key2: K2): Store<{ state: Type['normalizedState'][K1][K2] }>

   focusPath<K1 extends keyof Type['normalizedState'],
      K2 extends keyof Type['normalizedState'][K1]>(path: [K1, K2]): Store<{ state: Type['normalizedState'][K1][K2] }>

   focusPath<K1 extends keyof Type['normalizedState'],
      K2 extends keyof Type['normalizedState'][K1],
      CK extends keyof Type['computedValues']>(
      path: [K1, K2],
      computedValues: CK[]
      ): ComputedStore<{
         normalizedState: Type['normalizedState'][K1][K2],
         computedValues: Pick<Type['computedValues'], CK>
      }>

   focusPath<K1 extends keyof Type['normalizedState'],
      K2 extends keyof Type['normalizedState'][K1],
      K3 extends keyof Type['normalizedState'][K2]>(key1: K1, key2: K2, key3: K3): Store<{ state: Type['normalizedState'][K1][K2][K3] }>

   focusPath<K1 extends keyof Type['normalizedState'],
      K2 extends keyof Type['normalizedState'][K1],
      K3 extends keyof Type['normalizedState'][K2]>(path: [K1, K2, K3]): Store<{ state: Type['normalizedState'][K1][K2][K3] }>

   focusPath<K1 extends keyof Type['normalizedState'],
      K2 extends keyof Type['normalizedState'][K1],
      K3 extends keyof Type['normalizedState'][K2],
      CK extends keyof Type['computedValues']>(
      path: [K1, K2, K3],
      computedValues: CK[]
      ): ComputedStore<{
         normalizedState: Type['normalizedState'][K1][K2][K3],
         computedValues: Pick<Type['computedValues'], CK>
      }>

}
